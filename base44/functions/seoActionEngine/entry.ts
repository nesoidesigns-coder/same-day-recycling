import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import {
  TRACKED_PAGES, HEADING_INVENTORY, resolveSite, pageStats, currentMeta, gscWindow,
} from '../../shared/seoAction.ts';

// SEO Action Engine: audits tracked pages, pulls verified Google Search
// Console performance, lets Rex propose improvements, applies metadata
// changes only after explicit admin approval, records every change, and
// snapshots performance over time so before/after impact is measurable.
// The three intelligence layers are always kept separate: verified GSC data,
// external demand ESTIMATES, and public service-request discussions.

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let body = {};
    try { body = await req.json(); } catch {}
    const action = String(body.action || 'overview');

    if (action === 'overview') return await overview(base44);
    if (action === 'summary') return await summary(base44);
    if (action === 'audit') return await audit(base44, body);
    if (action === 'recommend') return await recommend(base44, user);
    if (action === 'approve') return await approve(base44, body, user);
    if (action === 'decline') return await decline(base44, body, user);
    if (action === 'snapshot') return await snapshot(base44);
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function gscConnection(base44) {
  const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_search_console');
  const siteUrl = await resolveSite(accessToken);
  return { token: accessToken, siteUrl };
}

// ---- Audit ----
async function buildAudit(base44, token, siteUrl, page) {
  const meta = await currentMeta(base44, page);
  const perf = await pageStats(token, siteUrl, page.path);
  const notes = [];
  if (!meta.title) notes.push('No stored meta title — the page falls back to its built-in copy.');
  if (meta.title && meta.title.length > 60) notes.push(`Meta title is ${meta.title.length} characters (recommended max 60).`);
  if (!meta.description) notes.push('No stored meta description.');
  if (meta.description && meta.description.length > 160) notes.push(`Meta description is ${meta.description.length} characters (recommended max 160).`);
  if (perf.stats.impressions > 100 && perf.stats.ctr < 2) notes.push(`Low click-through: ${perf.stats.impressions} impressions at ${perf.stats.ctr}% CTR — the listing is seen but not chosen.`);
  const weak = perf.queries.filter((q) => q.impressions >= 20 && q.position > 10);
  if (weak.length) notes.push(`${weak.length} query(ies) with 20+ impressions rank below position 10 — improvement candidates.`);

  return {
    page_path: page.path,
    page_label: page.label,
    kind: page.kind,
    target_keywords: page.target_keywords,
    meta: { ...meta, title_length: (meta.title || '').length, description_length: (meta.description || '').length },
    canonical: `https://samedayrecycling.ca${page.path}`,
    headings: HEADING_INVENTORY[page.path] || [],
    gsc: { window: perf.window, ...perf.stats },
    top_queries: perf.queries,
    notes,
  };
}

async function audit(base44, body) {
  const { token, siteUrl } = await gscConnection(base44);
  const pages = body.page_path ? TRACKED_PAGES.filter((p) => p.path === body.page_path) : TRACKED_PAGES;
  if (!pages.length) return Response.json({ error: 'Unknown page_path' }, { status: 400 });
  const settled = await Promise.allSettled(pages.map((p) => buildAudit(base44, token, siteUrl, p)));
  const audits = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  const errors = settled.filter((r) => r.status === 'rejected').map((r) => String(r.reason?.message || 'audit failed'));
  return Response.json({ audits, errors, generated_at: new Date().toISOString() });
}

// ---- Rex recommendations (never published without approval) ----
async function recommend(base44, user) {
  const pending = (await base44.asServiceRole.entities.SeoRecommendation.filter({ status: 'pending_review' }, { limit: 50 })).items || [];
  if (pending.length >= 6) {
    return Response.json({ ok: true, skipped: true, reason: 'The recommendation queue already has 6 items awaiting review — approve or decline them first.' });
  }

  const { token, siteUrl } = await gscConnection(base44);
  const settled = await Promise.allSettled(TRACKED_PAGES.map((p) => buildAudit(base44, token, siteUrl, p)));
  const audits = settled.filter((r) => r.status === 'fulfilled').map((r) => r.value);
  if (!audits.length) return Response.json({ error: 'Search Console data could not be loaded — no recommendations generated.' }, { status: 502 });

  // External demand estimates and public discussions are separate intelligence
  // layers and are labelled as such everywhere they appear.
  const demand = (await base44.asServiceRole.entities.DemandObservation.filter(
    { est_monthly_volume: { $gt: 0 } }, { sort: '-est_monthly_volume', limit: 20 }
  ).catch(() => ({ items: [] }))).items || [];
  const demandLines = demand.map((d) => `${d.keyword} (${d.province_code || d.geo_key || 'CA'}): ESTIMATED monthly volume ${d.est_monthly_volume}, source ${d.provider}, period ${d.period || 'unknown'}`);

  let discussionLines = [];
  try {
    const agg = await base44.asServiceRole.entities.PublicOpportunity.aggregate({ query: { status: 'open' }, groupBy: 'service_category' });
    discussionLines = (agg?.rows || []).map((r) => `${r.service_category || 'other'}: ${r.count} public request post(s)`);
  } catch {}

  const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are the SEO action engine for samedayrecycling.ca, a Canadian junk removal, furniture removal and recycling service. Propose concrete search improvements for the tracked pages below, based ONLY on the data provided.

TARGET KEYWORDS per page:
${audits.map((a) => `- ${a.page_path} (${a.page_label}): ${a.target_keywords.join(', ')}`).join('\n')}

PAGE DATA (audits): ${JSON.stringify(audits.map((a) => ({ page: a.page_path, meta: { title: a.meta.title, description: a.meta.description }, gsc: a.gsc, top_queries: a.top_queries, headings: a.headings, notes: a.notes })))}

EXTERNAL DEMAND ESTIMATES (provider estimates, NOT verified performance): ${demandLines.join('; ') || 'none stored'}
PUBLIC SERVICE-REQUEST DISCUSSIONS (community posts, not customers): ${discussionLines.join('; ') || 'none stored'}

RULES:
- Metadata proposals: proposed_title max 60 characters, proposed_description 140-160 characters. They must read naturally, answer the target query, and stay truthful.
- NEVER promise availability, same-day service, guaranteed pickup or time slots. NEVER state a price not present in the data. NEVER suggest fabricated reviews or testimonials.
- Content proposals (kind "content"): one NEW on-page section the page does not already have. In proposed_content_note give the section heading and 2-3 sentences on what it should cover. Do not propose a heading that exists in the headings inventory.
- Prefer targets supported by verified GSC data (a query with high impressions and weak position, or weak CTR); use demand estimates only as secondary support and say so in the rationale.
- rationale: one sentence citing the specific data.
- At most 3 proposals per page, and at most ${6 - pending.length} total. If the data shows no clear opportunity, return fewer or none. Never invent metrics.
Return { "recommendations": [ ... ] }`,
    response_json_schema: {
      type: 'object',
      properties: {
        recommendations: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              page_path: { type: 'string' },
              target_keyword: { type: 'string' },
              kind: { type: 'string', enum: ['metadata', 'content'] },
              proposed_title: { type: 'string' },
              proposed_description: { type: 'string' },
              proposed_content_note: { type: 'string' },
              rationale: { type: 'string' },
            },
            required: ['page_path', 'target_keyword', 'kind'],
          },
        },
      },
      required: ['recommendations'],
    },
  });

  const valid = (llm.recommendations || [])
    .filter((r) => TRACKED_PAGES.some((p) => p.path === r.page_path))
    .filter((r) => (r.kind === 'metadata' ? r.proposed_title && r.proposed_description : r.proposed_content_note))
    .slice(0, 6 - pending.length);

  const today = new Date().toISOString().slice(0, 10);
  const gscContext = (page_path) => {
    const a = audits.find((x) => x.page_path === page_path);
    return a ? `Verified GSC (${a.gsc.window.startDate}–${a.gsc.window.endDate}): ${a.gsc.clicks} clicks, ${a.gsc.impressions} impressions, avg position ${a.gsc.position}.` : '';
  };
  if (!valid.length) return Response.json({ ok: true, created: 0, message: 'No data-supported recommendations right now.' });

  const rows = await base44.asServiceRole.entities.SeoRecommendation.bulkCreate(valid.map((r) => ({
    page_path: r.page_path,
    page_label: (TRACKED_PAGES.find((p) => p.path === r.page_path) || {}).label || '',
    target_keyword: String(r.target_keyword).slice(0, 120),
    kind: r.kind === 'content' ? 'content' : 'metadata',
    proposed_title: String(r.proposed_title || '').slice(0, 120),
    proposed_description: String(r.proposed_description || '').slice(0, 320),
    proposed_content_note: String(r.proposed_content_note || '').slice(0, 1000),
    rationale: String(r.rationale || '').slice(0, 1000),
    gsc_context: gscContext(r.page_path),
    status: 'pending_review',
    recommended_date: today,
  })));

  return Response.json({ ok: true, created: rows.length, skipped: true });
}

// ---- Approval applies metadata instantly; content directions are recorded ----
async function approve(base44, body, user) {
  const id = String(body.id || '');
  const rec = await base44.asServiceRole.entities.SeoRecommendation.get(id).catch(() => null);
  if (!rec) return Response.json({ error: 'Recommendation not found' }, { status: 404 });
  if (rec.status !== 'pending_review') return Response.json({ error: `This recommendation is already ${rec.status}.` }, { status: 409 });
  const page = TRACKED_PAGES.find((p) => p.path === rec.page_path);
  if (!page) return Response.json({ error: 'Unknown target page' }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);
  const reviewNote = String(body.review_note || '');

  if (rec.kind === 'content') {
    // A substantial copy change is implemented in code after the owner approves
    // the direction — approval records the decision, it never rewrites a page.
    await base44.asServiceRole.entities.SeoOpsLog.create({
      run_id: 'seo-action-engine',
      run_type: 'repair',
      run_date: today,
      area: 'content',
      url: `https://samedayrecycling.ca${page.path}`,
      issue: `Approved content direction for "${rec.target_keyword}" on ${page.label}.`,
      evidence: rec.rationale || '',
      fix: rec.proposed_content_note || '',
      fix_applied: false,
      status: 'approved',
      approved_by: user.email || 'admin',
    });
    await base44.asServiceRole.entities.SeoRecommendation.update(id, { status: 'applied', review_note: reviewNote });
    return Response.json({ ok: true, applied: 'content_direction' });
  }

  const before = await currentMeta(base44, page);
  let gscBefore = { clicks: 0, impressions: 0, position: 0 };
  try {
    const { token, siteUrl } = await gscConnection(base44);
    const perf = await pageStats(token, siteUrl, page.path);
    gscBefore = { clicks: perf.stats.clicks, impressions: perf.stats.impressions, position: perf.stats.position };
  } catch {}

  const isCity = page.kind === 'city';
  const entity = isCity ? base44.asServiceRole.entities.CitySeo : base44.asServiceRole.entities.ServicePageMeta;
  const payload = isCity
    ? { seo_title: rec.proposed_title, seo_description: rec.proposed_description, updated_date: today }
    : { path: page.path, title: rec.proposed_title, description: rec.proposed_description, generated_date: today };
  const { items: rows } = await entity.filter(isCity ? { city: page.city } : { path: page.path }, { limit: 1 });
  if (rows[0]) await entity.update(rows[0].id, payload);
  else await entity.create(isCity ? { city: page.city, ...payload } : payload);

  const change = await base44.asServiceRole.entities.SeoChangeLog.create({
    page_path: page.path,
    target_keyword: rec.target_keyword,
    previous_title: before.title,
    previous_description: before.description,
    new_title: rec.proposed_title,
    new_description: rec.proposed_description,
    change_date: today,
    reason: [rec.rationale, reviewNote ? `Reviewer: ${reviewNote}` : ''].filter(Boolean).join(' · ').slice(0, 1000),
    gsc_before_clicks: gscBefore.clicks,
    gsc_before_impressions: gscBefore.impressions,
    gsc_before_position: gscBefore.position,
    gsc_window_days: 28,
    recommendation_id: id,
    changed_by: user.email || 'admin',
    status: 'applied',
  });
  await base44.asServiceRole.entities.SeoRecommendation.update(id, { status: 'applied', review_note: reviewNote, change_id: change.id });
  return Response.json({ ok: true, applied: 'metadata', change_id: change.id });
}

async function decline(base44, body, user) {
  const id = String(body.id || '');
  const rec = await base44.asServiceRole.entities.SeoRecommendation.get(id).catch(() => null);
  if (!rec) return Response.json({ error: 'Recommendation not found' }, { status: 404 });
  if (rec.status !== 'pending_review') return Response.json({ error: `This recommendation is already ${rec.status}.` }, { status: 409 });
  await base44.asServiceRole.entities.SeoRecommendation.update(id, {
    status: 'declined',
    review_note: String(body.review_note || `Declined by ${user.email || 'admin'}`),
  });
  return Response.json({ ok: true });
}

// ---- Performance snapshots over time + after-measurement of changes ----
async function snapshot(base44) {
  const { token, siteUrl } = await gscConnection(base44);
  const window = gscWindow();
  const today = new Date().toISOString().slice(0, 10);
  const created = [];
  const skipped = [];

  for (const page of TRACKED_PAGES) {
    const existing = (await base44.asServiceRole.entities.SeoPerformanceSnapshot.filter({ page_path: page.path, snapshot_date: today }, { limit: 1 })).items;
    if (existing.length) { skipped.push(page.path); continue; }
    const perf = await pageStats(token, siteUrl, page.path);
    const startISO = new Date(`${window.startDate}T00:00:00Z`).toISOString();
    let bookings = 0;
    try {
      const query = page.kind === 'city'
        ? { created_date: { $gte: startISO }, city: page.city }
        : { created_date: { $gte: startISO } };
      bookings = await base44.asServiceRole.entities.Booking.count(query);
    } catch {}
    created.push(await base44.asServiceRole.entities.SeoPerformanceSnapshot.create({
      page_path: page.path,
      snapshot_date: today,
      clicks: perf.stats.clicks,
      impressions: perf.stats.impressions,
      avg_position: perf.stats.position,
      bookings,
      booking_basis: page.kind === 'city' ? 'city' : 'site_wide',
      window_days: 28,
      source: 'google_search_console',
    }));
  }

  // Attach after-values to applied changes once a post-change snapshot exists.
  const openChanges = (await base44.asServiceRole.entities.SeoChangeLog.filter({ gsc_after_measured: false, status: 'applied' }, { limit: 50 })).items || [];
  let measured = 0;
  for (const change of openChanges) {
    if (!change.change_date || change.change_date >= today) continue;
    const { items: after } = await base44.asServiceRole.entities.SeoPerformanceSnapshot.filter(
      { page_path: change.page_path, snapshot_date: { $gt: change.change_date } }, { sort: 'snapshot_date', limit: 1 }
    );
    if (after[0]) {
      await base44.asServiceRole.entities.SeoChangeLog.update(change.id, {
        gsc_after_clicks: after[0].clicks,
        gsc_after_impressions: after[0].impressions,
        gsc_after_position: after[0].avg_position,
        gsc_after_measured: true,
      });
      measured += 1;
    }
  }

  return Response.json({ ok: true, created: created.length, skipped, changes_measured: measured, window });
}

async function overview(base44) {
  const [recs, changes, snaps] = await Promise.all([
    base44.asServiceRole.entities.SeoRecommendation.filter({}, { sort: '-created_date', limit: 60 }),
    base44.asServiceRole.entities.SeoChangeLog.filter({}, { sort: '-change_date', limit: 60 }),
    base44.asServiceRole.entities.SeoPerformanceSnapshot.filter({}, { sort: '-snapshot_date', limit: 120 }),
  ]);
  return Response.json({
    recommendations: recs.items || [],
    changes: changes.items || [],
    snapshots: snaps.items || [],
    pages: TRACKED_PAGES,
  });
}

// Lightweight payload for the Live Operations command centre card.
async function summary(base44) {
  const pending = (await base44.asServiceRole.entities.SeoRecommendation.filter({ status: 'pending_review' }, { limit: 3 })).items || [];
  const pendingCount = await base44.asServiceRole.entities.SeoRecommendation.count({ status: 'pending_review' });
  const snaps = (await base44.asServiceRole.entities.SeoPerformanceSnapshot.filter({}, { sort: '-snapshot_date', limit: TRACKED_PAGES.length * 2 })).items || [];
  const latest = {};
  for (const s of snaps) if (!latest[s.page_path]) latest[s.page_path] = s;
  return Response.json({
    pending_count: pendingCount || 0,
    pending,
    pages: TRACKED_PAGES.map((p) => ({ path: p.path, label: p.label, latest: latest[p.path] || null })),
  });
}