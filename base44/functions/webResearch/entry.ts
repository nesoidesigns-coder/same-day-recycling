import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let payload = {};
    try { payload = await req.json(); } catch {}
    const question = String(payload.question || '').trim().slice(0, 400);
    if (!question) return Response.json({ error: 'Pass a question' }, { status: 400 });

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You help the AI receptionist of Same Day Recycling (samedayrecycling.ca), a same-day junk removal and recycling company in British Columbia, Canada. ' +
        'A visitor asked something that needs current, verifiable information. Research it on the web and answer in under 120 words, plain text, ' +
        'specific to British Columbia or Canada where relevant. If you cannot verify the answer, say so honestly. Never quote prices for our own services.\n\nQuestion: "' + question + '"',
      add_context_from_internet: true,
    });

    return Response.json({ ok: true, answer: String(ai).slice(0, 1200) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}