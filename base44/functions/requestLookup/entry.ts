import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';

// Public reference-code lookup: a customer checks the status of their own
// national service request. No sign-in — the lookup key is the random code
// saved at submission. Returns only the fields needed for the status card;
// phone, email, address and postal code are never returned.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'requestLookup', 10);
    if (!limited.allowed) return rateLimitedResponse();

    const body = await req.json().catch(() => ({}));
    const code = String(body?.reference_code || '').trim().toUpperCase().slice(0, 12);
    if (!/^[A-Z0-9]{6,12}$/.test(code)) {
      return Response.json({ error: 'Enter the 8-character reference code from your confirmation.' }, { status: 400 });
    }

    const { items } = await base44.asServiceRole.entities.NationalRequest.filter(
      { reference_code: code },
      { limit: 1 }
    );
    const r = items && items[0];
    if (!r) return Response.json({ found: false });

    return Response.json({
      found: true,
      request: {
        reference_code: r.reference_code,
        name: r.name,
        city: r.city,
        service_type: r.service_type,
        items_description: r.items_description,
        status: r.status,
        quote_status: r.quote_status,
        partner_name: r.partner_name || '',
        preferred_date: r.preferred_date || '',
        appointment_date: r.appointment_date || '',
        created_date: r.created_date,
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}