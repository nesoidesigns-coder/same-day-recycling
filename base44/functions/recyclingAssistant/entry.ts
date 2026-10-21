import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const messages = Array.isArray(body.messages) ? body.messages.slice(-8).filter((m) => m && m.content) : [];
    const last = messages.length ? messages[messages.length - 1].content : (body.message || '');
    if (!last || !last.trim()) return Response.json({ error: 'A message is required' }, { status: 400 });

    // Matching listings from our own directory (real records only, no fabrication).
    let local = [];
    try {
      const page = await base44.entities.Provider.filter({}, { sort: '-created_date', limit: 300 });
      const all = page.items || page;
      const loc = String(body.location || '').toLowerCase().trim();
      const q = last.toLowerCase();
      local = all.filter((p) => {
        const locMatch = !loc || [p.city, p.province, p.service_area, p.address].some((f) => String(f || '').toLowerCase().includes(loc));
        const matMatch =
          String(p.name || '').toLowerCase().split(/\s+/).some((w) => w.length > 3 && q.includes(w)) ||
          String(p.materials_note || '').toLowerCase().split(/[\s,;.]+/).some((w) => w.length > 3 && q.includes(w)) ||
          (p.accepted_categories || []).some((c) => q.includes(String(c).replace(/_/g, ' ')));
        return locMatch && matMatch;
      }).slice(0, 4);
    } catch {
      local = [];
    }

    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      add_context_from_internet: true,
      prompt: [
        'You are the Same Day Recycling Assistant for samedayrecycling.ca, helping Canadians recycle correctly.',
        'User location (may be empty): ' + (body.location || 'not specified') + '.',
        'Listings from our own verified directory that may match: ' + JSON.stringify(local.map((p) => ({ name: p.name, city: p.city, province: p.province, service_type: p.service_type, website: p.website, materials: p.materials_note }))) + '.',
        'Strict rules:',
        '- Prioritize official municipal and provincial recycling sources and cite them as URLs.',
        '- Recycling rules vary by municipality. If you cannot confirm rules for the user\'s specific location, say so clearly in the uncertainty field and direct them to their municipality or a facility in our directory.',
        '- Never claim a specific material is recyclable without a source. When unsure, say what to check.',
        '- If the user describes a photo of an item, treat it only as a possible category hint, never as proof of composition or recyclability.',
        '- Be concise: under 180 words in the answer field. Recommend drop-off or pickup options where they exist.',
        '- Do not invent facilities, addresses, fees, or phone numbers.',
      ].join('\n'),
      response_json_schema: {
        type: 'object',
        properties: {
          answer: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' } },
          uncertainty: { type: 'string' },
        },
        required: ['answer'],
      },
    });

    return Response.json({
      reply: llm.answer || '',
      sources: Array.isArray(llm.sources) ? llm.sources : [],
      uncertainty: llm.uncertainty || '',
      local_providers: local,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}