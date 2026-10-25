import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Growth Coordinator: the central AI manager for Recycling OS growth.
// It ingests open items from the EXISTING engines (SEO recommendations,
// improvement queue), prioritizes them deterministically, applies ONLY
// owner-approved low-risk metadata changes, monitors outcomes with verified
// metrics, and auto-reverts metadata that measurably regressed.
// Pricing, payment, security and structural work is always escalated for the
// owner - never executed automatically.

const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString();
const round1 = (n) => Math.round(n * 10) / 10;
const priorityScore = (d) => round1((d.value * 2 + d.confidence) / (d.effort / 2 + d.cost / 2 + 1));
const log = (d, event, note) => { d.changelog = [...(d.changelog || []), { date: now(), event, note: note || '' }]; };

async function scan(base44) {
  const GD = base44.asServiceRole.entities.GrowthDecision;
  const everyDecision = await GD.filter({}, { limit: 500 });
  const allRecords = everyDecision.items || everyDecision;
  const openRecords = allRecords.filter((d) => ['proposed', 'approved', 'executing', 'monitoring', 'escalated'].includes(d.status));
  const openSet = new Set(openRecords.map((d) => `${d.source_type}:${d.source_id}`));
  const created = [];

  // 1. SEO recommendations awaiting review -> low-risk, coordinator-executable.
  const recs = await base44.asServiceRole.entities.SeoRecommendation.filter({ status: 'pending_review' }, { limit: 100 });
  for (const rec of (recs.items || recs)) {
    const key = `seo_recommendation:${rec.id}`;
    if (openSet.has(key) || created.length >= 40) continue;
    const badTitle = !rec.proposed_title || /^n\/?a$/i.test(String(rec.proposed_title).trim());
    const badDesc = !rec.proposed_description || /^n\/?a$/i.test(String(rec.proposed_description).trim());
    if (badTitle && badDesc) continue;
    const cleanTitle = badTitle ? (rec.target_keyword || rec.page_path || 'SEO metadata change') : String(rec.proposed_title).trim();
    created.push(await GD.create({
      title: `SEO metadata: ${cleanTitle}`.slice(0, 200),
      source_type: 'seo_recommendation', source_id: rec.id,
      summary: (rec.rationale || 'Metadata recommendation from the SEO Action Engine.').slice(0, 1000),
      category: 'seo_metadata', city: '',
      value: 3, confidence: 4, effort: 2, cost: 1,
      risk_tier: 'low', executable: true, requires_approval: true,
      priority_score: priorityScore({ value: 3, confidence: 4, effort: 2, cost: 1 }),
      proposed_change: { path: rec.page_path, title: badTitle ? '' : String(rec.proposed_title).trim(), description: badDesc ? '' : String(rec.proposed_description).trim() },
      expected_effect: 'Improve click-through for the targeted query on this page.',
      status: 'proposed',
      changelog: [{ date: now(), event: 'proposed', note: 'Ingested from SEO Action Engine' }],
    }));
    openSet.add(key);
  }

  // 2. Improvement queue items still unhandled -> risk by severity.
  const imps = await base44.asServiceRole.entities.Improvement.filter({}, { limit: 500 });
  for (const imp of (imps.items || imps).filter((i) => ['detected', 'reviewed'].includes(i.status))) {
    const key = `improvement:${imp.id}`;
    if (openSet.has(key) || created.length >= 40) continue;
    const isMinor = imp.severity === 'minor';
    const impDraft = { value: imp.severity === 'critical' ? 5 : imp.severity === 'major' ? 3 : 2, confidence: imp.evidence_url ? 4 : 3, effort: imp.effort === 'quick' ? 1 : imp.effort === 'moderate' ? 3 : 5, cost: 1 };
    created.push(await GD.create({
      title: (imp.title || 'Website improvement').slice(0, 200),
      source_type: 'improvement', source_id: imp.id,
      summary: ((imp.evidence || '') + ' ' + (imp.recommendation || '')).trim().slice(0, 1000) || imp.description || '',
      category: imp.severity === 'minor' ? 'content' : 'website_quality',
      value: impDraft.value,
      confidence: impDraft.confidence,
      effort: impDraft.effort,
      cost: impDraft.cost,
      priority_score: priorityScore(impDraft),
      risk_tier: isMinor ? 'low' : 'medium',
      executable: false, requires_approval: true,
      expected_effect: imp.business_impact || '',
      status: 'proposed',
      changelog: [{ date: now(), event: 'proposed', note: 'Ingested from the Improvement Queue' }],
    }));
    openSet.add(key);
  }

  // Refresh priority on every still-open decision.
  const all = openRecords.concat(created);
  for (const d of all) {
    const next = priorityScore(d);
    if (d.priority_score !== next) await GD.update(d.id, { priority_score: next });
  }
  const ranked = [...openRecords, ...created].sort((a, b) => (b.priority_score || 0) - (a.priority_score || 0));
  return { created: created.length, open: ranked.length, top: ranked.slice(0, 5).map((d) => ({ id: d.id, title: d.title, priority_score: d.priority_score })) };
}

async function approve(base44, user, id, note) {
  const GD = base44.asServiceRole.entities.GrowthDecision;
  const d = await GD.get(id);
  if (!d) return { error: 'Decision not found' };
  if (d.risk_tier === 'high') return { error: 'High-risk decisions are escalated and must be executed manually by the owner.' };

  if (d.executable && d.risk_tier === 'low' && d.category === 'seo_metadata' && d.proposed_change?.path) {
    const ch = d.proposed_change;
    const existing = await base44.asServiceRole.entities.ServicePageMeta.filter({ path: ch.path }, { limit: 1 });
    const prior = (existing.items || existing)[0];
    const prevState = prior
      ? { path: ch.path, title: prior.title || '', description: prior.description || '' }
      : { path: ch.path, title: '', description: '' };
    if (prior) {
      await base44.asServiceRole.entities.ServicePageMeta.update(prior.id, { title: ch.title, description: ch.description, generated_date: today() });
    } else {
      await base44.asServiceRole.entities.ServicePageMeta.create({ path: ch.path, title: ch.title, description: ch.description, generated_date: today() });
    }
    await base44.asServiceRole.entities.SeoChangeLog.create({
      page_path: ch.path, change_date: today(),
      previous_title: prevState.title, previous_description: prevState.description,
      new_title: ch.title, new_description: ch.description,
      reason: (d.summary || 'Growth Coordinator approved change').slice(0, 1000),
      recommendation_id: d.source_id || '', changed_by: user?.email || 'growth-coordinator', status: 'applied',
    });
    if (d.source_type === 'seo_recommendation' && d.source_id) {
      try { await base44.asServiceRole.entities.SeoRecommendation.update(d.source_id, { status: 'applied', review_note: note || 'Approved via Growth Coordinator' }); } catch { /* source already resolved */ }
    }
    // Verified baseline for later monitoring.
    const snaps = await base44.asServiceRole.entities.SeoPerformanceSnapshot.filter({ page_path: ch.path }, { sort: '-snapshot_date', limit: 1 });
    const latest = (snaps.items || snaps)[0];
    const baseline = latest ? { snapshot_date: latest.snapshot_date, clicks: latest.clicks || 0, impressions: latest.impressions || 0, avg_position: latest.avg_position || 0 } : { snapshot_date: today(), clicks: 0, impressions: 0, avg_position: 0, note: 'No verified snapshot yet' };
    log(d, 'approved', note || 'Approved by owner');
    log(d, 'executed', 'Metadata applied and logged to SeoChangeLog');
    await GD.update(d.id, {
      status: 'monitoring', previous_state: prevState, baseline_metrics: baseline,
      executed_date: today(), changelog: d.changelog,
    });
    return { ok: true, status: 'monitoring', applied: true };
  }

  log(d, 'approved', note || 'Approved by owner; requires implementation outside the coordinator');
  await GD.update(d.id, { status: 'approved', changelog: d.changelog });
  return { ok: true, status: 'approved', applied: false };
}

async function decline(base44, id, note) {
  const GD = base44.asServiceRole.entities.GrowthDecision;
  const d = await GD.get(id);
  if (!d) return { error: 'Decision not found' };
  log(d, 'declined', note || 'Declined by owner');
  await GD.update(d.id, { status: 'declined', changelog: d.changelog });
  return { ok: true };
}

async function revert(base44, id, reason) {
  const GD = base44.asServiceRole.entities.GrowthDecision;
  const d = await GD.get(id);
  if (!d) return { error: 'Decision not found' };
  if (!d.previous_state?.path) return { error: 'No previous state recorded; nothing to roll back to.' };
  const prev = d.previous_state;
  const existing = await base44.asServiceRole.entities.ServicePageMeta.filter({ path: prev.path }, { limit: 1 });
  const prior = (existing.items || existing)[0];
  if (prior) {
    await base44.asServiceRole.entities.ServicePageMeta.update(prior.id, { title: prev.title, description: prev.description, generated_date: today() });
  } else if (prev.title && prev.description) {
    await base44.asServiceRole.entities.ServicePageMeta.create({ path: prev.path, title: prev.title, description: prev.description, generated_date: today() });
  }
  await base44.asServiceRole.entities.SeoChangeLog.create({
    page_path: prev.path, change_date: today(),
    previous_title: d.proposed_change?.title || '', previous_description: d.proposed_change?.description || '',
    new_title: prev.title, new_description: prev.description,
    reason: 'Rollback of ' + (d.revert_reason || reason || 'regression') + ' (Growth Coordinator)', changed_by: 'growth-coordinator', status: 'reverted',
  });
  log(d, 'reverted', reason || 'Rolled back to previous metadata');
  await GD.update(d.id, { status: 'reverted', revert_reason: reason || 'Reverted by owner', changelog: d.changelog });
  return { ok: true };
}

async function monitor(base44) {
  const GD = base44.asServiceRole.entities.GrowthDecision;
  const watching = await GD.filter({ status: 'monitoring' }, { limit: 200 });
  const results = [];
  for (const d of (watching.items || watching)) {
    const path = d.proposed_change?.path || d.previous_state?.path;
    const executed = d.executed_date ? new Date(d.executed_date) : null;
    const days = executed ? Math.floor((Date.now() - executed.getTime()) / 86400000) : null;
    const snaps = await base44.asServiceRole.entities.SeoPerformanceSnapshot.filter({ page_path: path }, { sort: '-snapshot_date', limit: 1 });
    const latest = (snaps.items || snaps)[0];
    const after = latest && executed && latest.snapshot_date >= d.executed_date
      ? { snapshot_date: latest.snapshot_date, clicks: latest.clicks || 0, impressions: latest.impressions || 0, avg_position: latest.avg_position || 0 }
      : null;
    const base = d.baseline_metrics || {};
    if (after) {
      const clickPct = base.clicks > 0 ? round1(((after.clicks - base.clicks) / base.clicks) * 100) : null;
      const imprPct = base.impressions > 0 ? round1(((after.impressions - base.impressions) / base.impressions) * 100) : null;
      const regressed = base.clicks >= 5 && clickPct !== null && clickPct <= -40 && imprPct !== null && imprPct <= -30;
      if (regressed && d.executable) {
        await revert(base44, d.id, `Verified regression: clicks ${clickPct}% since execution`);
        results.push({ id: d.id, action: 'auto_reverted', click_change_pct: clickPct });
        continue;
      }
      d.measured_effect = { baseline: base, after, click_change_pct: clickPct, impression_change_pct: imprPct, window_days: days };
      log(d, 'monitored', `Verified after-snapshot: clicks ${clickPct === null ? 'n/a' : clickPct + '%'}, impressions ${imprPct === null ? 'n/a' : imprPct + '%'}`);
      await GD.update(d.id, { status: 'executed', measured_effect: d.measured_effect, changelog: d.changelog });
      results.push({ id: d.id, action: 'measured', click_change_pct: clickPct });
    } else {
      log(d, 'monitoring', days !== null ? `Day ${days}: no verified performance snapshot after execution yet; not measured.` : 'Awaiting executed date.');
      await GD.update(d.id, { changelog: d.changelog });
      results.push({ id: d.id, action: 'waiting', days });
    }
  }
  return { monitored: results.length, results };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'run';
    let result;
    if (action === 'run') result = await scan(base44);
    else if (action === 'monitor') result = await monitor(base44);
    else if (action === 'approve') result = await approve(base44, user, body.id, body.note);
    else if (action === 'decline') result = await decline(base44, body.id, body.note);
    else if (action === 'revert') result = await revert(base44, body.id, body.reason);
    else return Response.json({ error: 'Unknown action' }, { status: 400 });
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}