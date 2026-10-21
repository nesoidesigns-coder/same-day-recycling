import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const METRICS = [
  { key: "canada_diversion_rate", target: "Canada's national solid waste diversion rate, latest data (currently 27.1% for 2022 per Statistics Canada / ECCC)" },
  { key: "landfill_methane", target: "Share of Canada's national methane emissions from landfills, latest ECCC Greenhouse Gas Inventory (currently 17% for 2023)" },
  { key: "aluminum_energy", target: "Energy saving from recycling aluminum versus primary production (currently ~95% per the International Aluminium Institute)" },
  { key: "plastics_canada", target: "Share of plastic waste diverted from disposal in Canada (currently 9%, over 3 Mt discarded per year, per ECCC)" },
  { key: "ewaste_global", target: "Share of global e-waste formally collected and recycled, latest UN Global E-waste Monitor (currently 22.3% of 62 Mt in 2022)" },
  { key: "ns_leadership", target: "Nova Scotia's solid waste diversion rate, Canada's highest provincial rate (currently 43%)" },
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const metricList = METRICS.map((m, i) => `${i + 1}. key="${m.key}" — ${m.target}`).join("\n");
    const prompt = `You are a fact-checker for a Canadian recycling company. Using official published sources (Environment and Climate Change Canada, Statistics Canada, the International Aluminium Institute, and the UN Global E-waste Monitor), verify or update each statistic below. Use web search to find the most recent authoritative figure. Do not invent numbers or sources: if a figure cannot be verified from an official source, keep the current value noted in the target description.\n\n${metricList}\n\nFor each metric return: the exact key, the stat as a short display string (e.g. "27.1%"), a one-line label stating what the number measures, a 1-2 sentence plain-language detail explaining why it matters, the official source organization name, and the exact source page URL. Respond only with verified figures from official government, standards-body, or United Nations sources.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: {
        type: "object",
        properties: {
          facts: {
            type: "array",
            items: {
              type: "object",
              properties: {
                key: { type: "string" },
                stat: { type: "string" },
                label: { type: "string" },
                detail: { type: "string" },
                source_name: { type: "string" },
                source_url: { type: "string" },
              },
              required: ["key", "stat", "label"],
            },
          },
        },
        required: ["facts"],
      },
    });

    const facts = Array.isArray(result && result.facts) ? result.facts : [];
    const validKeys = new Set(METRICS.map((m) => m.key));
    const today = new Date().toISOString().slice(0, 10);
    const existing = await base44.asServiceRole.entities.RecyclingFact.filter({});
    const byKey = new Map(existing.map((f) => [f.key, f]));

    let updated = 0;
    let created = 0;
    for (const f of facts) {
      if (!f || !validKeys.has(f.key) || !f.stat || !f.label) continue;
      const payload = {
        stat: String(f.stat),
        label: String(f.label),
        detail: String(f.detail || ""),
        source_name: String(f.source_name || ""),
        source_url: String(f.source_url || ""),
        verified_date: today,
      };
      const match = byKey.get(f.key);
      if (match) {
        await base44.asServiceRole.entities.RecyclingFact.update(match.id, payload);
        updated++;
      } else {
        await base44.asServiceRole.entities.RecyclingFact.create({ key: f.key, ...payload });
        created++;
      }
    }

    return Response.json({ ok: true, updated, created, checked: facts.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}