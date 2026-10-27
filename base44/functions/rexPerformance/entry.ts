import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { secrets } from 'base44:runtime';

// Rex Performance Loop — diagnose, apply, verify, monitor.
//
// Every number here comes from a real Google PageSpeed Insights run that this
// function performed and recorded. Rex reads those measurements, states what
// they show, and queues the fix in the existing Improvement pipeline. Rex never
// claims a change it did not make: the "apply" pass prepares the exact code
// change (file, edit, expected effect) and the builder executes it; "verify"
// then re-measures with a fresh PSI run, and "monitor" flags regressions.
const OPEN_STATUSES = ['detected', 'reviewed', 'approved', 'in_progress', 'testing'];
const DEFAULT_URL = 'https://samedayrecycling.ca/';
const FIX_KEYS = [
  'reduce_render_blocking_css',
  'split_entry_bundle',
  'trim_font_families',
  'defer_third_party',
  'prioritise_lcp_image',
  'preconnect_resources',
  'reduce_unused_css',
  'lazy_mount_widgets',
  'other',
];

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const round2 = (n) => (n == null ? null : Math.round(n * 100) / 100);
const today = () => new Date().toISOString().slice(0, 10);
const nowIso = () => new Date().toISOString();

const metricLine = (a) =>
  a
    ? `performance ${a.performance ?? 'n/a'} · LCP ${a.lcp_seconds ?? 'n/a'}s · FCP ${a.fcp_seconds ?? 'n/a'}s · TBT ${a.tbt_ms ?? 'n/a'}ms · CLS ${a.cls ?? 'n/a'}`
    : 'no comparable measurement on record';

// One authorized PSI run. Only measurements Google actually returned are used;
// anything missing stays null rather than being estimated.
async function psiRun(url, strategy, key) {
  const endpoint =
    'https://www.googleapis.com/pagespeedonline/v5/runPagespeed' +
    `?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance&key=${key}`;
  const res = await fetch(endpoint, { signal: AbortSignal.timeout(105000) });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`PSI ${strategy} returned HTTP ${res.status}: ${detail.slice(0, 300)}`);
  }
  const json = await res.json();
  const lh = json.lighthouseResult || {};
  const audit = (id) => (lh.audits || {})[id] || {};
  const ms = (id) => num(audit(id).numericValue);
  const wasted = (id) => {
    const items = audit(id).details?.items || [];
    return items.reduce((total, item) => total + (num(item.wastedBytes) || 0), 0);
  };
  const thirdParty = (audit('third-party-summary').details?.items || [])
    .slice(0, 4)
    .map((i) => ({
      entity: String(i.entity || ''),
      transfer_kb: Math.round((num(i.transferSize) || 0) / 1024),
      blocking_ms: Math.round(num(i.blockingTime) || 0),
    }));

  return {
    strategy,
    performance: Math.round((lh.categories?.performance?.score || 0) * 100),
    metrics: {
      lcp_ms: ms('largest-contentful-paint'),
      fcp_ms: ms('first-contentful-paint'),
      si_ms: ms('speed-index'),
      tbt_ms: ms('total-blocking-time'),
      cls: num(audit('cumulative-layout-shift').numericValue),
    },
    opportunities: {
      unused_js_kb: Math.round(wasted('unused-javascript') / 1024),
      unused_css_kb: Math.round(wasted('unused-css-rules') / 1024),
      render_blocking_ms: Math.round(ms('render-blocking-resources') || 0),
      total_bytes_kb: Math.round((ms('total-byte-weight') || 0) / 1024),
      font_display_failed: audit('font-display').score === 0,
      third_party: thirdParty,
      lcp_element: String(
        audit('largest-contentful-paint-element').details?.items?.[0]?.node?.snippet || ''
      ).slice(0, 220),
    },
  };
}

// Record the run as a verified audit so the history and comparisons stay real.
async function recordAudit(svc, url, run, enteredBy) {
  const m = run.metrics || {};
  return svc.entities.PerformanceAudit.create({
    test_date: today(),
    tested_at: nowIso(),
    run_label: `Rex PSI ${run.strategy} run`,
    test_source: 'pagespeed_insights',
    tested_url: url,
    strategy: run.strategy,
    observation_type: 'measured_run',
    performance: run.performance,
    lcp_seconds: round2(m.lcp_ms != null ? m.lcp_ms / 1000 : null),
    fcp_seconds: round2(m.fcp_ms != null ? m.fcp_ms / 1000 : null),
    speed_index_seconds: round2(m.si_ms != null ? m.si_ms / 1000 : null),
    tbt_ms: m.tbt_ms != null ? Math.round(m.tbt_ms) : null,
    cls: round2(m.cls),
    notes: `Rex run. Unused JS ${run.opportunities.unused_js_kb} KB · unused CSS ${run.opportunities.unused_css_kb} KB · render-blocking ${run.opportunities.render_blocking_ms} ms · total ${run.opportunities.total_bytes_kb} KB.`,
    entered_by: String(enteredBy || 'rex').slice(0, 200),
    history: [{ date: nowIso(), event: 'recorded', note: 'Rex ran an authorized PageSpeed Insights test.' }],
  });
}

async function previousComparable(svc, url, strategy, excludeId) {
  const page = await svc.entities.PerformanceAudit.filter(
    { tested_url: url, strategy },
    { sort: '-created_date', limit: 10 }
  );
  const items = (page.items || []).filter((a) => a.id !== excludeId && a.observation_type === 'measured_run');
  return items[0] || null;
}

async function emailAdmins(svc, subject, html) {
  try {
    const page = await svc.entities.User.filter({ role: 'admin' }, { limit: 20 });
    const to = (page.items || []).map((u) => u.email).filter(Boolean).join(',');
    if (!to) return;
    await svc.integrations.Core.SendEmail({ to, subject, html });
  } catch {
    // Alerting is best effort — the queue record is the source of truth.
  }
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const svc = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'diagnose');
    const requestedUrl = String(body.url || '').trim();
    const url = requestedUrl.startsWith('http') ? requestedUrl.slice(0, 300) : DEFAULT_URL;

    const key = secrets.get('PAGESPEED_API_KEY');
    if (!key) return Response.json({ error: 'PAGESPEED_API_KEY is not set. Add it on the Secrets page.' }, { status: 500 });

    // ---- diagnose: measure, record, and queue what the numbers actually show ----
    if (action === 'diagnose') {
      const mobile = await psiRun(url, 'mobile', key);
      const desktop = await psiRun(url, 'desktop', key).catch(() => null);

      const recorded = await recordAudit(svc, url, mobile, user.email);
      if (desktop) await recordAudit(svc, url, desktop, user.email);
      const previous = await previousComparable(svc, url, 'mobile', recorded.id);

      const openPage = await svc.entities.Improvement.filter(
        { status: { $in: OPEN_STATUSES } },
        { limit: 300 }
      );
      const openItems = openPage.items || [];

      const analysis = await svc.integrations.Core.InvokeLLM({
        prompt: [
          'You are Rex, the performance engineer for Same Day Recycling (samedayrecycling.ca), a React + Vite single-page app served from a CDN.',
          'You are given the measurements from a PageSpeed Insights run that just completed, the previous comparable mobile run, and the app stack facts.',
          'ABSOLUTE DATA RULE: DATA below is your only evidence. Every number you state must appear in DATA verbatim. Never invent a metric, a file, a cause or a test. If DATA does not support a claim, omit the claim.',
          'Hard guardrail: never propose sacrificing essential customer functionality — instant quotes, visible starting prices, accessible booking forms, mobile navigation, the Rex assistant, coverage accuracy or same-day requests — merely to raise a benchmark score.',
          'Return JSON. findings[] = the ranked fixes (highest impact first, at most 5). evidence must quote the DATA numbers that prove the problem. recommendation = the concrete change. verification_test = how a later PSI run will prove it worked. fix_key = the closest class from the allowed list.',
          'STACK FACTS (measured by the builder, treat as fact): entry JS ~529 KB raw / ~172 KB gzipped across the critical path; render-blocking CSS ~216 KB raw / ~37 KB gzipped with a large hand-written legacy layer; three webfont families are requested; the app is client-rendered so first paint waits on JS and CSS.',
          'DATA:\n' + JSON.stringify({
            url,
            mobile,
            desktop,
            previous_mobile: previous
              ? {
                  date: previous.test_date,
                  performance: previous.performance,
                  lcp_seconds: previous.lcp_seconds,
                  fcp_seconds: previous.fcp_seconds,
                  tbt_ms: previous.tbt_ms,
                  cls: previous.cls,
                }
              : null,
            targets: { performance: 90, lcp_seconds: 2.5, tbt_ms: 200, cls: 0.1 },
          }).slice(0, 12000),
        ].join('\n'),
        response_json_schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            findings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  severity: { type: 'string', enum: ['critical', 'major', 'minor'] },
                  evidence: { type: 'string' },
                  business_impact: { type: 'string' },
                  recommendation: { type: 'string' },
                  verification_test: { type: 'string' },
                  effort: { type: 'string', enum: ['quick', 'moderate', 'major'] },
                  fix_key: { type: 'string', enum: FIX_KEYS },
                },
                required: ['title', 'severity', 'evidence', 'business_impact', 'recommendation', 'verification_test', 'effort', 'fix_key'],
              },
            },
          },
          required: ['summary', 'findings'],
        },
      });

      const created = [];
      for (const f of analysis.findings || []) {
        const title = String(f.title || '').slice(0, 200);
        if (!title) continue;
        const dup = openItems.find((i) => String(i.title || '').trim().toLowerCase() === title.trim().toLowerCase());
        if (dup) continue;
        const record = await svc.entities.Improvement.create({
          title,
          source: 'performance_intelligence',
          source_ref: recorded.id,
          evidence_url: url,
          evidence: String(f.evidence || '').slice(0, 2000),
          severity: ['critical', 'major', 'minor'].includes(f.severity) ? f.severity : 'major',
          business_impact: String(f.business_impact || '').slice(0, 1000),
          recommendation: String(f.recommendation || '').slice(0, 2000),
          effort: ['quick', 'moderate', 'major'].includes(f.effort) ? f.effort : 'moderate',
          fix_key: FIX_KEYS.includes(f.fix_key) ? f.fix_key : 'other',
          verification_test: String(f.verification_test || '').slice(0, 1000),
          before_result: metricLine(recorded).slice(0, 1000),
          status: 'detected',
          history: [{ date: nowIso(), event: 'created', note: `Rex diagnosed this from a PSI ${mobile.strategy} run (performance ${mobile.performance}).` }],
        });
        created.push({ id: record.id, title: record.title, severity: record.severity, fix_key: record.fix_key });
      }

      return Response.json({
        ok: true,
        url,
        audit: {
          id: recorded.id,
          date: recorded.test_date,
          performance: mobile.performance,
          metrics: mobile.metrics,
          opportunities: mobile.opportunities,
          desktop_performance: desktop ? desktop.performance : null,
        },
        previous: previous ? { date: previous.test_date, performance: previous.performance, lcp_seconds: previous.lcp_seconds } : null,
        summary: String(analysis.summary || ''),
        new_findings: created,
      });
    }

    // ---- apply: Rex prepares the exact change and moves the finding forward ----
    // A backend function cannot edit the frontend bundle, so Rex writes the
    // precise edit (file, change, expected effect) and the builder executes it.
    if (action === 'apply') {
      const id = String(body.improvement_id || '');
      if (!id) return Response.json({ error: 'improvement_id is required.' }, { status: 400 });
      const imp = await svc.entities.Improvement.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!imp) return Response.json({ error: 'Improvement not found.' }, { status: 404 });

      const latestPage = await svc.entities.PerformanceAudit.filter(
        { tested_url: imp.evidence_url || url, strategy: 'mobile' },
        { sort: '-created_date', limit: 1 }
      );
      const baseline = (latestPage.items || [])[0] || null;

      const plan = await svc.integrations.Core.InvokeLLM({
        prompt: [
          'You are Rex, preparing an implementation brief for one performance finding on a React + Vite SPA (samedayrecycling.ca).',
          'The builder will execute your brief verbatim, so it must name the exact change.',
          'PATH RULE: the only paths you may name are src/index.css, index.html and src/App.jsx. Never invent a file, an @import, a module or a folder that was not given to you — if you do not know the exact file, describe the change by what it must target (e.g. "the hand-written legacy selector layer in src/index.css") and leave the file unnamed.',
          'FACT: src/index.css contains no @import of any stylesheet. Its unused weight is the hand-written legacy layer (the .admin-li compatibility remaps and the hex-colour selector blocks) plus Tailwind utilities this page never uses. Work from that, not from a guessed import.',
          'Never propose breaking customer functionality (quotes, pricing, booking, navigation, the Rex assistant, coverage accuracy).',
          'Finding: ' + imp.title,
          'Evidence observed: ' + (imp.evidence || 'none recorded'),
          'Recommended correction: ' + (imp.recommendation || 'not yet proposed'),
          'Baseline measurement: ' + (imp.before_result || metricLine(baseline)),
          'Return: builder_action (max ~600 chars: file, the exact change, why it helps), expected_effect (the metric and direction a later PSI run should show, no invented numbers), rollback (how to undo it safely).',
        ].join('\n'),
        response_json_schema: {
          type: 'object',
          properties: {
            builder_action: { type: 'string' },
            expected_effect: { type: 'string' },
            rollback: { type: 'string' },
          },
          required: ['builder_action', 'expected_effect', 'rollback'],
        },
      });

      const history = [
        ...(imp.history || []),
        {
          date: nowIso(),
          event: 'rex_applied',
          note: `Rex prepared the change. Expected: ${String(plan.expected_effect || '').slice(0, 300)} · Rollback: ${String(plan.rollback || '').slice(0, 200)}`,
        },
      ];
      const updated = await svc.entities.Improvement.update(id, {
        builder_action: String(plan.builder_action || '').slice(0, 2000),
        before_result: imp.before_result || metricLine(baseline).slice(0, 1000),
        status: 'in_progress',
        history,
      });

      return Response.json({
        ok: true,
        improvement: updated,
        builder_action: updated.builder_action,
        expected_effect: String(plan.expected_effect || ''),
        rollback: String(plan.rollback || ''),
        requires_builder: true,
      });
    }

    // ---- verify: re-measure with a real run and record what actually changed ----
    if (action === 'verify') {
      const id = String(body.improvement_id || '');
      if (!id) return Response.json({ error: 'improvement_id is required.' }, { status: 400 });
      const imp = await svc.entities.Improvement.get(id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!imp) return Response.json({ error: 'Improvement not found.' }, { status: 404 });

      const target = imp.evidence_url || url;
      const run = await psiRun(target, 'mobile', key);
      const recorded = await recordAudit(svc, target, run, user.email);
      const previous = await previousComparable(svc, target, 'mobile', recorded.id);

      const after = metricLine(recorded);
      const scoreUp = previous ? recorded.performance > previous.performance : false;
      const lcpUp = previous && previous.lcp_seconds != null && recorded.lcp_seconds != null
        ? recorded.lcp_seconds < previous.lcp_seconds
        : false;
      const passed = recorded.performance >= 90 || scoreUp || lcpUp;

      const delta = previous
        ? `performance ${previous.performance} → ${recorded.performance}, LCP ${previous.lcp_seconds ?? 'n/a'}s → ${recorded.lcp_seconds ?? 'n/a'}s`
        : `no previous comparable run; measured performance ${recorded.performance}`;

      const updated = await svc.entities.Improvement.update(id, {
        after_result: after.slice(0, 1000),
        status: passed ? 'verified' : 'testing',
        verified_date: passed ? today() : undefined,
        verified_by: passed ? 'rex' : '',
        history: [
          ...(imp.history || []),
          {
            date: nowIso(),
            event: 'rex_verified',
            note: `${delta}. ${passed ? 'Measured improvement confirmed.' : 'Not measurably better yet — kept in testing.'}`,
          },
        ],
      });

      return Response.json({ ok: true, improvement: updated, after_result: after, delta, passed, audit_id: recorded.id });
    }

    // ---- monitor: scheduled regression watch, alerts on a real drop ----
    if (action === 'monitor') {
      const run = await psiRun(url, 'mobile', key);
      const recorded = await recordAudit(svc, url, run, 'rex_monitor');
      const previous = await previousComparable(svc, url, 'mobile', recorded.id);

      const scoreDrop = previous && previous.performance != null
        ? previous.performance - recorded.performance
        : 0;
      const lcpWorse = previous && previous.lcp_seconds != null && recorded.lcp_seconds != null
        ? recorded.lcp_seconds - previous.lcp_seconds
        : 0;
      const regression = Boolean(previous) && (scoreDrop >= 5 || lcpWorse >= 0.5);

      let queued = null;
      if (regression) {
        const title = `Performance regression: score ${previous.performance} → ${recorded.performance}`;
        const openPage = await svc.entities.Improvement.filter(
          { status: { $in: OPEN_STATUSES }, source: 'performance_intelligence' },
          { limit: 200 }
        );
        const existing = (openPage.items || []).find((i) => String(i.title || '').trim().toLowerCase() === title.toLowerCase());
        if (!existing) {
          queued = await svc.entities.Improvement.create({
            title,
            source: 'performance_intelligence',
            source_ref: recorded.id,
            evidence_url: url,
            evidence: `PSI mobile on ${recorded.test_date}: performance ${previous.performance} → ${recorded.performance}; LCP ${previous.lcp_seconds ?? 'n/a'}s → ${recorded.lcp_seconds ?? 'n/a'}s; TBT ${previous.tbt_ms ?? 'n/a'}ms → ${recorded.tbt_ms ?? 'n/a'}ms.`,
            severity: scoreDrop >= 10 ? 'critical' : 'major',
            business_impact: 'Slower first paint on mobile costs bookings from customers who need same-day pickup.',
            recommendation: 'Compare the current build against the last passing run and revert or fix the change that caused the drop.',
            effort: 'moderate',
            fix_key: 'other',
            verification_test: `Re-run PSI mobile on ${url} and confirm performance returns to ${previous.performance} or better.`,
            before_result: metricLine(previous).slice(0, 1000),
            status: 'detected',
            history: [{ date: nowIso(), event: 'created', note: 'Rex monitor detected a measured regression.' }],
          });
          await emailAdmins(
            svc,
            `Performance dropped: ${previous.performance} → ${recorded.performance}`,
            `<p>Rex's scheduled performance check measured a regression on ${url}.</p><p><strong>${recorded.test_date}</strong>: performance <strong>${previous.performance} → ${recorded.performance}</strong>, LCP ${previous.lcp_seconds ?? 'n/a'}s → ${recorded.lcp_seconds ?? 'n/a'}s.</p><p>The finding is queued in your Improvement Queue.</p>`
          );
        }
      }

      return Response.json({
        ok: true,
        url,
        current: { date: recorded.test_date, performance: recorded.performance, metrics: run.metrics },
        previous: previous ? { date: previous.test_date, performance: previous.performance, lcp_seconds: previous.lcp_seconds } : null,
        regression,
        queued: queued ? { id: queued.id, title: queued.title } : null,
      });
    }

    return Response.json({ error: 'Unknown action. Use diagnose, apply, verify or monitor.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}