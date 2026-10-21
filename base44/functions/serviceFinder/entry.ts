import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Parses a customer's job description into structured intent ONLY.
// Availability, pricing and coverage are checked on the client against the
// verified coverage source of truth — this function never answers the
// customer, invents prices, slots or providers.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let payload = {};
    try { payload = await req.json(); } catch {}
    const message = String(payload.message || '').trim().slice(0, 500);
    if (!message) {
      return Response.json({ error: 'Describe the job you need.' }, { status: 400 });
    }

    const intent = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are an intent extractor for a Canadian junk removal and recycling booking assistant. ' +
        'Read the customer message below and extract structured intent ONLY. ' +
        'Do NOT answer the customer, do NOT give advice, do NOT mention prices, availability or providers. ' +
        'Extract: service_type (one of: junk_removal, furniture_removal, appliance_removal, electronics_recycling, office_commercial, metal_pickup, scheduled_pickup, other), ' +
        'city (the Canadian city name exactly as a proper noun, e.g. "Surrey", or "" if none), ' +
        'postal_code (the Canadian postal code or FSA like "V5K 0A1" or "V5K", or "" if none), ' +
        'items (a short list of the items or materials mentioned, e.g. ["old refrigerator"], or []). ' +
        'Customer message: "' + message + '"',
      response_json_schema: {
        type: 'object',
        properties: {
          service_type: {
            type: 'string',
            enum: ['junk_removal', 'furniture_removal', 'appliance_removal', 'electronics_recycling', 'office_commercial', 'metal_pickup', 'scheduled_pickup', 'other'],
          },
          city: { type: 'string' },
          postal_code: { type: 'string' },
          items: { type: 'array', items: { type: 'string' } },
        },
        required: ['service_type', 'city', 'postal_code', 'items'],
      },
    });

    return Response.json({ intent });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}