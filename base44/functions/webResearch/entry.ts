import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { waitUntil } from 'base44:runtime';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    let payload = {};
    try { payload = await req.json(); } catch {}
    const question = String(payload.question || '').trim().slice(0, 400);
    if (!question) return Response.json({ error: 'Pass a question' }, { status: 400 });

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You help the AI receptionist of Same Day Recycling (samedayrecycling.ca), a same-day junk removal and recycling company serving every Canadian province and territory. ' +
        'A visitor asked something that needs current, verifiable information — it can be about anywhere in the world. Research it on the live web and answer in under 120 words, plain text, ' +
        'specific to the relevant Canadian province or territory when the question concerns Canada, and to the visitor\'s country or region otherwise. ' +
        'If you cannot verify the answer, say so honestly. Never quote prices for our own services.\n\nQuestion: "' + question + '"',
      add_context_from_internet: true,
    });

    const answer = String(ai).slice(0, 1200);

    waitUntil(
      base44.asServiceRole.entities.ResearchResult.create({
        topic: question,
        summary: answer,
        origin: 'receptionist',
      }).catch((saveErr) => console.error('Failed to save research:', saveErr))
    );

    return Response.json({ ok: true, answer });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}