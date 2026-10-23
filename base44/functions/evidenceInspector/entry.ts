import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Evidence Inspector: turns brand-scan findings into tracked, testable records.
// sync    = log any findings from the latest scan that aren't tracked yet,
//           classifying severity, source URL and a proposed fix (one LLM pass,
//           cached in the RexFinding records — never re-classified on reload).
// approve = owner approves the proposed fix.
// retest  = Rex re-fetches the live page with a web-capable model and reports
//           resolved / not_resolved with fresh evidence. Never invents a pass.

const SEVERITIES = ['critical', 'major', 'minor'];
const today = () => new Date().toISOString().slice(0, 10);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let payload = {};
    try { payload = await req.json(); } catch {}
    const action = payload.action || 'sync';

    // ---- Approve -------------------------------------------------------------
    if (action === 'approve') {
      if (!payload.id) return Response.json({ error: 'Missing finding id.' }, { status: 400 });
      const f = await base44.entities.RexFinding.get(payload.id);
      if (!f) return Response.json({ error: 'Finding not found.' }, { status: 404 });
      const history = [...(Array.isArray(f.history) ? f.history : []), { date: today(), event: 'approved', note: `Fix approved by ${user.email}` }];
      await base44.entities.RexFinding.update(payload.id, {
        status: 'approved',
        approved_by: user.email,
        approved_date: today(),
        history,
      });
      return Response.json({ ok: true });
    }

    // ---- Retest --------------------------------------------------------------
    if (action === 'retest') {
      if (!payload.id) return Response.json({ error: 'Missing finding id.' }, { status: 400 });
      const f = await base44.entities.RexFinding.get(payload.id);
      if (!f) return Response.json({ error: 'Finding not found.' }, { status: 404 });
      const url = f.source_url || 'https://samedayrecycling.ca/';
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        model: 'gemini_3_8_flash',
        add_context_from_internet: true,
        prompt: `You are Rex, retesting a previously recorded finding on the live website. Fetch and inspect the CURRENT live content of ${url} (and the site generally if needed). The finding, recorded on ${f.tested_date}, was: "${f.finding_text}". What the test observed at the time: "${String(f.actual_result || '').slice(0, 800)}". The owner has since implemented a fix and this is the verification pass. Determine honestly whether the finding still applies to the CURRENT live content. If the problem is clearly gone, resolved = true. If it still applies, or you cannot confirm it is gone, resolved = false. In evidence, state exactly what you observed on the live page that supports your conclusion (quote or describe the current state). Never claim resolution without evidence from the fetched content.`,
        response_json_schema: {
          type: 'object',
          properties: {
            resolved: { type: 'boolean' },
            evidence: { type: 'string' },
          },
          required: ['resolved', 'evidence'],
        },
      });
      const resolved = llm?.resolved === true;
      const evidence = String(llm?.evidence || '').slice(0, 2000);
      const history = [...(Array.isArray(f.history) ? f.history : []), { date: today(), event: resolved ? 'retest_passed' : 'retest_failed', note: evidence.slice(0, 300) }];
      await base44.entities.RexFinding.update(payload.id, {
        status: resolved ? 'resolved' : 'not_resolved',
        retest_date: today(),
        retest_evidence: evidence,
        history,
      });
      await base44.entities.AiActionLog.create({
        actor: 'rex',
        action: 'finding_retest',
        summary: `Retested "${String(f.finding_text || '').slice(0, 120)}" against ${url}: ${resolved ? 'resolved' : 'not resolved'}.`,
        outcome: 'success',
        target_type: 'finding',
        target_id: payload.id,
      });
      return Response.json({ ok: true, resolved, evidence });
    }

    // ---- Sync (default) ------------------------------------------------------
    const scans = await base44.entities.BrandScan.list({ sort: '-created_date', limit: 1 });
    const scan = (scans.items || scans)[0];
    if (!scan) return Response.json({ findings: [], scan_date: null });
    const scanId = payload.scan_id || scan.id;
    const existingPage = await base44.entities.RexFinding.filter({ scan_id: scanId }, { limit: 100 });
    const existing = existingPage.items || existingPage;
    const have = new Set(existing.map((x) => x.finding_text));

    const collected = [];
    for (const f of scan.verified_findings || []) collected.push({ kind: 'verified', text: f.finding, result: f.evidence });
    for (const f of scan.ai_estimates || []) collected.push({ kind: 'ai_estimate', text: f.finding, result: f.reasoning });
    const missing = collected.filter((c) => c.text && !have.has(c.text));

    if (missing.length) {
      const siteUrls = (scan.sources || [])
        .map((s) => (String(s).match(/https?:\/\/\S+/) || [])[0])
        .filter(Boolean);
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You are Rex, the growth analyst for ${scan.target}. A brand scan produced the findings below. For EACH finding, assign: severity ("critical" if it loses customers or blocks search crawlers from reading content, "major" if it clearly hurts rankings or trust, "minor" if it is polish), one concrete proposed fix (specific actions, not generic advice), and source_url — the most relevant page that was tested, chosen from this list when possible: ${JSON.stringify(siteUrls)}. Findings and their observed results: ${JSON.stringify(missing.map((m) => ({ finding: m.text, result: String(m.result || '').slice(0, 400) })))}`,
        response_json_schema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  finding: { type: 'string' },
                  severity: { type: 'string' },
                  proposed_fix: { type: 'string' },
                  source_url: { type: 'string' },
                },
                required: ['finding', 'severity', 'proposed_fix'],
              },
            },
          },
          required: ['items'],
        },
      });
      const byFinding = new Map((llm?.items || []).map((i) => [i.finding, i]));
      const fallbackUrl = siteUrls[0] || `https://${String(scan.target).replace(/^https?:\/\//, '')}/`;
      await base44.entities.RexFinding.bulkCreate(missing.map((m) => {
        const cls = byFinding.get(m.text) || {};
        return {
          scan_id: scanId,
          finding_text: m.text,
          finding_kind: m.kind,
          severity: SEVERITIES.includes(cls.severity) ? cls.severity : 'major',
          source_url: String(cls.source_url || '').startsWith('http') ? cls.source_url : fallbackUrl,
          tested_date: String(scan.created_date || '').slice(0, 10),
          actual_result: String(m.result || '').slice(0, 2000),
          proposed_fix: String(cls.proposed_fix || 'Pending Rex analysis — approve after classification.').slice(0, 2000),
          status: 'open',
          history: [{ date: today(), event: 'created', note: `Logged from brand scan of ${String(scan.created_date || '').slice(0, 10)}` }],
        };
      }));
    }

    const afterPage = await base44.entities.RexFinding.filter({ scan_id: scanId }, { sort: '-created_date', limit: 100 });
    const findings = afterPage.items || afterPage;
    return Response.json({ findings, scan_date: String(scan.created_date || '').slice(0, 10), added: missing.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}