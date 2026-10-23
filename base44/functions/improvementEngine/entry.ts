import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Improvement Engine: turns recurring audit findings into a tracked
// improvement queue. Rex can run safe, read-only diagnostics (fetching the
// public pages, proposing fixes) — but nothing here publishes changes,
// touches prices, customer data, contracts, or the booking/payment systems.
// Owner approval happens through the Command Centre status workflow.

const SITE = 'https://samedayrecycling.ca';

// Every URL is a real, registered route in src/App.jsx. The homepage marker
// checks that crawlers receive actual rendered content, not a JS shell.
const PAGES = [
  { path: '/', label: 'Homepage', marker: 'junk removal' },
  { path: '/pricing', label: 'Pricing' },
  { path: '/coverage', label: 'Coverage' },
  { path: '/about', label: 'About' },
  { path: '/contact', label: 'Contact' },
  { path: '/furniture-removal', label: 'Furniture removal' },
  { path: '/junk-removal-vancouver', label: 'Vancouver city page' },
  { path: '/contractor-membership', label: 'Contractor membership' },
];

const OPEN_STATUSES = ['detected', 'reviewed', 'approved', 'in_progress', 'testing'];
const nowIso = () => new Date().toISOString();

async function adminGuard(base44) {
  const user = await base44.auth.me();
  if (!user || user.role !== 'admin') return null;
  return user;
}

// One site check: HTTP status, title, meta description, canonical, and for the
// homepage, whether meaningful HTML content actually rendered.
async function checkPage(page) {
  const url = SITE + page.path;
  const result = { url, label: page.label, findings: [] };
  let html = '';
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(12000), redirect: 'follow' });
    result.http_status = res.status;
    if (!res.ok) {
      result.findings.push({
        title: `${page.label} page failed to load (HTTP ${res.status})`,
        severity: 'critical',
        evidence: `GET ${url} returned HTTP ${res.status}.`,
      });
      return result;
    }
    html = await res.text();
  } catch (e) {
    result.findings.push({
      title: `${page.label} page unreachable`,
      severity: 'critical',
      evidence: `GET ${url} failed: ${e.message}`,
    });
    return result;
  }

  const hasTitle = /<title[^>]*>\s*[^<\s][^<]*<\/title>/i.test(html);
  const hasDesc = /<meta[^>]+name=["']description["'][^>]+content=["']\s*[^"\s][^""]*["']/i.test(html);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  if (!hasTitle) {
    result.findings.push({ title: `${page.label} is missing its <title> tag`, severity: 'major', evidence: `No non-empty <title> element found in the server HTML at ${url}.` });
  }
  if (!hasDesc) {
    result.findings.push({ title: `${page.label} is missing its meta description`, severity: 'major', evidence: `No meta description with content found in the server HTML at ${url}.` });
  }
  if (!hasCanonical) {
    result.findings.push({ title: `${page.label} is missing a canonical URL`, severity: 'minor', evidence: `No rel="canonical" link found in the server HTML at ${url}.` });
  }
  if (page.marker && !html.toLowerCase().includes(page.marker)) {
    result.findings.push({
      title: `${page.label} server HTML has no meaningful page content (rendering failure)`,
      severity: 'critical',
      evidence: `Server HTML at ${url} does not contain the expected page text ("${page.marker}") — crawlers likely receive a JavaScript shell.`,
    });
  }
  return result;
}

// Recreate a finding only if there is no OPEN improvement with the same
// title + URL — resolved items stay resolved, regressions re-open as new.
async function recordFinding(svc, existing, f, source, sourceRef) {
  const dup = existing.find((i) => i.title === f.title && i.evidence_url === (f.evidence_url || ''));
  if (dup) return null;
  const created = await svc.entities.Improvement.create({
    title: f.title,
    source,
    source_ref: sourceRef || '',
    evidence_url: f.evidence_url || '',
    evidence: f.evidence || '',
    severity: f.severity || 'major',
    status: 'detected',
    history: [{ date: nowIso(), event: 'created', note: 'Recorded by the diagnostics scan.' }],
  });
  return created;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await adminGuard(base44);
    if (!user) return Response.json({ error: 'Forbidden' }, { status: 403 });
    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = body?.action || 'scan';

    // Safe, reversible diagnostics: fetch the public pages and queue findings.
    if (action === 'scan') {
      const checks = [];
      for (let i = 0; i < PAGES.length; i += 6) {
        const batch = PAGES.slice(i, i + 6);
        const settled = await Promise.allSettled(batch.map((p) => checkPage(p)));
        settled.forEach((s) => { if (s.status === 'fulfilled') checks.push(s.value); });
      }
      const openPage = await svc.entities.Improvement.filter(
        { status: { $in: OPEN_STATUSES } },
        { limit: 500 }
      );
      const existing = Array.isArray(openPage) ? openPage : (openPage.items || []);
      const findings = checks.flatMap((c) => c.findings.map((f) => ({ ...f, evidence_url: c.url })));
      const created = [];
      for (const f of findings) {
        const rec = await recordFinding(svc, existing, f, 'site_diagnostics', 'site_scan');
        if (rec) created.push({ id: rec.id, title: rec.title, severity: rec.severity });
      }
      const criticals = created.filter((c) => c.severity === 'critical');

      // Alert the owner by email when the scan finds critical problems so
      // critical regressions never sit unnoticed in the queue.
      if (criticals.length > 0) {
        try {
          const adminsPage = await svc.entities.User.filter({ role: 'admin' }, { limit: 50 });
          const admins = Array.isArray(adminsPage) ? adminsPage : (adminsPage.items || []);
          const to = admins.map((u) => u.email).filter(Boolean).join(',');
          if (to) {
            const rows = criticals.map((c) => `<li>${c.title}</li>`).join('');
            await svc.integrations.Core.SendEmail({
              to,
              subject: `${criticals.length} critical site problem${criticals.length === 1 ? '' : 's'} detected`,
              html: `<p>The latest site diagnostics found <strong>${criticals.length} critical</strong> problem${criticals.length === 1 ? '' : 's'} now queued in your Improvement Queue:</p><ul>${rows}</ul><p>Review them at the Command Centre: Improvement Queue.</p>`,
            });
          }
        } catch { /* alert is best-effort; the queue record is the source of truth */ }
      }

      return Response.json({
        checked: checks.length,
        urls: checks.map((c) => ({ url: c.url, http_status: c.http_status || null, findings: c.findings.length })),
        new_findings: created,
        critical_count: criticals.length,
      });
    }

    // Rex proposes the business impact, fix, effort and verification test for
    // one queued improvement. Read-only: nothing is published or changed.
    if (action === 'diagnose') {
      const id = String(body?.improvement_id || '');
      if (!id) return Response.json({ error: 'improvement_id is required.' }, { status: 400 });
      const imp = await svc.entities.Improvement.get(id);
      if (!imp) return Response.json({ error: 'Improvement not found.' }, { status: 404 });
      const llm = await svc.integrations.Core.InvokeLLM({
        prompt: [
          'You are Rex, the operations AI for Same Day Recycling (samedayrecycling.ca), a Canadian junk removal and recycling platform.',
          'An audit finding needs a concrete, measurable improvement plan. Do not invent metrics you cannot measure; the verification test must be a specific, runnable check (a URL to test, what to look for, and the expected result).',
          'Finding: ' + imp.title,
          'Evidence observed: ' + (imp.evidence || 'none recorded'),
          'Evidence URL: ' + (imp.evidence_url || 'none'),
          'Severity: ' + imp.severity,
          'Return concise, specific fields. Maximum ~80 words per field.',
        ].join('\n'),
        response_json_schema: {
          type: 'object',
          properties: {
            business_impact: { type: 'string' },
            recommendation: { type: 'string' },
            effort: { type: 'string', enum: ['quick', 'moderate', 'major'] },
            verification_test: { type: 'string' },
          },
          required: ['business_impact', 'recommendation', 'effort', 'verification_test'],
        },
      });
      const d = llm || {};
      const patch = {
        business_impact: d.business_impact || imp.business_impact,
        recommendation: d.recommendation || imp.recommendation,
        effort: ['quick', 'moderate', 'major'].includes(d.effort) ? d.effort : imp.effort,
        verification_test: d.verification_test || imp.verification_test,
      };
      patch.history = [...(imp.history || []), { date: nowIso(), event: 'rex_diagnosed', note: 'Rex proposed the impact, fix and verification test.' }];
      await svc.entities.Improvement.update(id, patch);
      return Response.json({ ok: true, diagnosis: patch });
    }

    // Pull open Evidence Inspector findings into the queue so one lifecycle
    // tracks every improvement (no duplicate dashboards).
    if (action === 'import_findings') {
      const page = await svc.entities.RexFinding.filter(
        { status: { $in: ['open', 'approved'] } },
        { limit: 200 }
      );
      const findings = Array.isArray(page) ? page : (page.items || []);
      const openPage = await svc.entities.Improvement.filter(
        { status: { $in: OPEN_STATUSES } },
        { limit: 500 }
      );
      const existing = Array.isArray(openPage) ? openPage : (openPage.items || []);
      const created = [];
      for (const f of findings) {
        const rec = await recordFinding(svc, existing, {
          title: f.finding_text,
          severity: f.severity,
          evidence: f.actual_result || '',
          evidence_url: f.source_url || '',
        }, 'evidence_inspector', f.id);
        if (rec) created.push({ id: rec.id, title: rec.title });
      }
      return Response.json({ imported: created.length, items: created });
    }

    // Render test: confirm Google receives useful HTML on service and city
    // pages. Existing pages only — verified operating markets are improved
    // before any new URL is created.
    if (action === 'render_test') {
      const servicePaths = ['/furniture-removal', '/appliance-removal', '/electronics-recycling', '/commercial-recycling', '/same-day-pickup'];
      let cityPaths = [];
      try {
        const csPage = await svc.entities.CitySeo.filter({}, { limit: 100 });
        const cs = Array.isArray(csPage) ? csPage : (csPage.items || []);
        cityPaths = cs
          .map((c) => '/junk-removal-' + String(c.city || '').toLowerCase().trim().replace(/\s+/g, '-'))
          .filter((p) => p.length > 14)
          .slice(0, 12);
      } catch { /* city pages optional; service pages still tested */ }
      const targets = [
        ...servicePaths.map((p) => ({ path: p, label: p })),
        ...cityPaths.map((p) => ({ path: p, label: p })),
      ];
      const results = [];
      for (let i = 0; i < targets.length; i += 6) {
        const batch = targets.slice(i, i + 6);
        const settled = await Promise.allSettled(batch.map((p) => checkPage(p)));
        settled.forEach((s) => { if (s.status === 'fulfilled') results.push(s.value); });
      }
      const openPage = await svc.entities.Improvement.filter({ status: { $in: OPEN_STATUSES } }, { limit: 500 });
      const existing = Array.isArray(openPage) ? openPage : (openPage.items || []);
      const newFindings = [];
      for (const r of results) {
        for (const f of r.findings) {
          const rec = await recordFinding(svc, existing, { ...f, evidence_url: r.url }, 'site_diagnostics', 'render_test');
          if (rec) newFindings.push({ id: rec.id, title: rec.title });
        }
      }
      return Response.json({
        tested: results.length,
        results: results.map((r) => ({ url: r.url, http_status: r.http_status || null, issues: r.findings.map((f) => f.title) })),
        new_findings: newFindings,
      });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message || 'Unexpected error' }, { status: 500 });
  }
}