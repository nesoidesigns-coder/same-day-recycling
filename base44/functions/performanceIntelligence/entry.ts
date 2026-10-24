import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';

// Development Intelligence — records verified website performance audits,
// compares comparable tests and connects AI Business Master to the history.
// Every number comes from a real recorded test; nothing is estimated and no
// audit is claimed unless it actually completed.
const numOrNull = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const diffOf = (prev, rec) => {
  const parts = [];
  const scoreDelta = (label, before, after) => {
    if (before == null || after == null || before === after) return;
    const d = Math.round((after - before) * 100) / 100;
    parts.push({ metric: label, before, after, change: d, direction: d > 0 ? 'improved' : 'regressed' });
  };
  scoreDelta('performance', prev.performance, rec.performance);
  scoreDelta('accessibility', prev.accessibility, rec.accessibility);
  scoreDelta('seo', prev.seo, rec.seo);
  scoreDelta('best_practices', prev.best_practices, rec.best_practices);
  if (prev.ai_score_max === rec.ai_score_max && prev.ai_score != null && rec.ai_score != null && prev.ai_score !== rec.ai_score) {
    const d = rec.ai_score - prev.ai_score;
    parts.push({ metric: 'ai_assessment', before: prev.ai_score, after: rec.ai_score, change: d, direction: d > 0 ? 'improved' : 'regressed' });
  }
  if (prev.lcp_seconds != null && rec.lcp_seconds != null && prev.lcp_seconds !== rec.lcp_seconds) {
    const d = Math.round((rec.lcp_seconds - prev.lcp_seconds) * 100) / 100;
    parts.push({ metric: 'lcp_seconds', before: prev.lcp_seconds, after: rec.lcp_seconds, change: d, direction: d < 0 ? 'improved' : 'regressed' });
  }
  if (prev.tbt_ms != null && rec.tbt_ms != null && prev.tbt_ms !== rec.tbt_ms) {
    const d = rec.tbt_ms - prev.tbt_ms;
    parts.push({ metric: 'tbt_ms', before: prev.tbt_ms, after: rec.tbt_ms, change: d, direction: d < 0 ? 'improved' : 'regressed' });
  }
  if (prev.cls != null && rec.cls != null && prev.cls !== rec.cls) {
    const d = Math.round((rec.cls - prev.cls) * 1000) / 1000;
    parts.push({ metric: 'cls', before: prev.cls, after: rec.cls, change: d, direction: d < 0 ? 'improved' : 'regressed' });
  }
  return parts;
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const payload = await req.json().catch(() => ({}));
    const action = String(payload.action || '');

    // ---- import: record one verified audit (manual entry or a completed PSI run) ----
    if (action === 'import') {
      const d = payload.audit || {};
      const testDate = String(d.test_date || '').slice(0, 10);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(testDate)) {
        return Response.json({ error: 'test_date (YYYY-MM-DD) is required.' }, { status: 400 });
      }
      const source = ['independent_debugbear', 'pagespeed_insights', 'admin_imported'].includes(d.test_source)
        ? d.test_source : 'admin_imported';
      const strategy = ['mobile', 'desktop', 'unknown'].includes(d.strategy) ? d.strategy : 'mobile';
      const observation = ['independent_observed', 'measured_run'].includes(d.observation_type)
        ? d.observation_type : 'independent_observed';
      const testedUrl = String(d.tested_url || '').startsWith('http')
        ? String(d.tested_url).slice(0, 300) : 'https://samedayrecycling.ca/';

      const record = {
        test_date: testDate,
        run_label: String(d.run_label || '').slice(0, 80),
        test_source: source,
        tested_url: testedUrl,
        strategy,
        observation_type: observation,
        tested_at: typeof d.tested_at === 'string' && d.tested_at
          ? d.tested_at.slice(0, 40)
          : observation === 'measured_run' ? new Date().toISOString() : '',
        execution_sequence: d.execution_sequence != null && Number.isFinite(Number(d.execution_sequence)) ? Number(d.execution_sequence) : null,
        performance: numOrNull(d.performance),
        accessibility: numOrNull(d.accessibility),
        seo: numOrNull(d.seo),
        best_practices: numOrNull(d.best_practices),
        ai_score: numOrNull(d.ai_score),
        ai_score_max: numOrNull(d.ai_score_max),
        lcp_seconds: numOrNull(d.lcp_seconds),
        tbt_ms: numOrNull(d.tbt_ms),
        cls: numOrNull(d.cls),
        fcp_seconds: numOrNull(d.fcp_seconds),
        speed_index_seconds: numOrNull(d.speed_index_seconds),
        notes: String(d.notes || '').slice(0, 1000),
        deployment_context: String(d.deployment_context || '').slice(0, 500),
        linked_improvement_id: String(d.linked_improvement_id || ''),
        entered_by: user.email || '',
        history: [{ date: new Date().toISOString(), event: 'recorded', note: `Recorded by ${user.email || 'admin'} as ${observation}.` }],
      };

      // Previous comparable test: same URL + device strategy. Same tool is
      // preferred (tool changes are surfaced, never hidden). Chronology is
      // resolved by verified execution timestamp, then owner-verified same-day
      // execution order — never import order or the test's label.
      const prior = (await base44.entities.PerformanceAudit.filter({ tested_url: testedUrl, strategy }, { sort: '-test_date', limit: 20 })).items || [];
      const chronDesc = (a, b) =>
        String(b.test_date).localeCompare(String(a.test_date)) ||
        String(b.tested_at || '').localeCompare(String(a.tested_at || '')) ||
        (b.execution_sequence ?? 0) - (a.execution_sequence ?? 0) ||
        String(b.created_date || '').localeCompare(String(a.created_date || ''));
      prior.sort(chronDesc);
      const sameTool = prior.filter((p) => p.test_source === source);
      const prev = sameTool[0] || prior[0] || null;

      const created = await base44.entities.PerformanceAudit.create(record);
      const comparison = prev ? {
        previous_id: prev.id,
        previous_label: prev.run_label || prev.test_source,
        same_tool: prev.test_source === record.test_source,
        changes: diffOf(prev, record),
      } : null;

      return Response.json({ ok: true, audit: created, previous: prev, comparison });
    }

    // ---- analyze: AI Business Master reads the verified history ----
    if (action === 'analyze') {
      const audits = (await base44.asServiceRole.entities.PerformanceAudit.filter({}, { sort: '-test_date', limit: 50 })).items || [];
      if (!audits.length) {
        return Response.json({ error: 'No recorded audits to analyze yet.' }, { status: 400 });
      }
      const improvements = (await base44.asServiceRole.entities.Improvement.filter({}, { sort: '-created_date', limit: 30 })).items || [];

      const context = {
        audits: audits.map((a) => ({
          date: a.test_date,
          label: a.run_label,
          source: a.test_source,
          strategy: a.strategy,
          observation_type: a.observation_type,
          performance: a.performance,
          accessibility: a.accessibility,
          seo: a.seo,
          best_practices: a.best_practices,
          ai_score: a.ai_score != null && a.ai_score_max ? `${a.ai_score}/${a.ai_score_max}` : null,
          lcp_seconds: a.lcp_seconds,
          tbt_ms: a.tbt_ms,
          cls: a.cls,
          notes: a.notes,
          deployment_context: a.deployment_context,
        })),
        improvement_queue: improvements.map((i) => ({
          title: i.title,
          status: i.status,
          severity: i.severity,
          before_result: i.before_result,
          after_result: i.after_result,
          verification_test: i.verification_test,
        })),
        targets: {
          seo: 'maintain 100',
          accessibility: '95+',
          best_practices: '95+',
          lighthouse_performance: '90+',
          total_blocking_time: 'under 200 ms',
          largest_contentful_paint: 'under 2.5 s',
          cumulative_layout_shift: 'under 0.1',
        },
      };

      const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt:
          'You are the performance engineer inside Recycling OS AI Business Master for samedayrecycling.ca. ' +
          'You are given every VERIFIED performance audit on record (independent DebugBear observations and authorized PageSpeed Insights runs), ' +
          'the improvement queue state, and the agreed optimization targets.\n\n' +
          'ABSOLUTE DATA RULE: the DATA object below is the ONLY evidence you have. Every date, test label, score and metric you mention must appear in DATA verbatim. Do not cite any test, date or number that is not in DATA — if the recorded history does not support a claim, omit the claim entirely. There are no other baselines.\n\n' +
          'Analyze the history and return JSON with:\n' +
          '- bottlenecks: what the measurements actually show is slow or blocking, each citing the audit data (metric + test + date). Never invent a cause. If deployment state at test time is uncertain or differs between tests, say so instead of guessing.\n' +
          '- regressions: cases where a comparable test (same device strategy, same URL) came out WORSE than the earlier comparable test. Only real data-backed regressions. If none, empty array.\n' +
          '- recommendations: prioritized improvements (priority: 1 = highest). For expensive JavaScript execution, recommend deferring, lazy loading or code splitting ONLY where the recorded data supports it. Every recommendation must respect this hard guardrail: NEVER propose sacrificing essential customer functionality — instant quotes, clear starting prices, accessible booking forms, responsive mobile navigation, the Rex AI assistant, accurate regional contractor coverage, or same-day pickup requests — merely to improve a benchmark score. Prefer improvements that help real customers.\n' +
          '- mobile_usability: an honest assessment of mobile usability and booking responsiveness based on the mobile-strategy tests only.\n' +
          '- next_improvement: the single most valuable next action, citing the evidence.\n' +
          '- summary: 2-3 sentences for the owner. Targets are goals, not guaranteed outcomes — say which targets are met, which are not, and note when two test tools differ (they use different measurement conditions).\n\n' +
          'DATA:\n' + JSON.stringify(context, null, 1).slice(0, 14000),
        response_json_schema: {
          type: 'object',
          properties: {
            bottlenecks: { type: 'array', items: { type: 'string' } },
            regressions: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, priority: { type: 'number' }, rationale: { type: 'string' }, effort: { type: 'string' } }, required: ['title', 'priority', 'rationale'] } },
            mobile_usability: { type: 'string' },
            next_improvement: { type: 'string' },
            summary: { type: 'string' },
          },
          required: ['bottlenecks', 'regressions', 'recommendations', 'mobile_usability', 'next_improvement', 'summary'],
        },
      });

      // Persist the analysis so AI Business Master's memory carries it forward.
      const latest = audits[0];
      await base44.asServiceRole.entities.BusinessMemory.create({
        entry_type: 'recommendation',
        title: `Development Intelligence analysis: ${latest.run_label || latest.test_source} (${latest.test_date})`,
        detail: String(ai.summary || '').slice(0, 2000),
        entry_date: new Date().toISOString().slice(0, 10),
        source: 'rex',
        related_ref: latest.id || '',
        impact_note: `Next improvement: ${String(ai.next_improvement || '').slice(0, 400)}`,
      });

      return Response.json({ ok: true, analysis: ai });
    }

    return Response.json({ error: 'Unknown action. Use import or analyze.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}