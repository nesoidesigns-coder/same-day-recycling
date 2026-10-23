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
    if (!r) {
      // Fallback: direct (active-city) bookings carry their own reference code.
      const { items: bItems } = await base44.asServiceRole.entities.Booking.filter(
        { reference_code: code },
        { limit: 1 }
      );
      const b = bItems && bItems[0];
      if (!b) return Response.json({ found: false });
      return Response.json({
        found: true,
        request: {
          kind: 'booking',
          reference_code: b.reference_code,
          name: b.name,
          city: b.city || '',
          service_type: 'junk_removal',
          items_description: b.items_description,
          status: b.status,
          partner_name: b.partner_name || '',
          preferred_date: b.preferred_date || '',
          appointment_date: '',
          time_window: b.time_window || '',
          quote_estimate: b.quote_estimate || '',
          approved_quote_amount: b.approved_quote_amount || 0,
          job_value: b.job_value || 0,
          assignment_status: b.assignment_status || '',
          created_date: b.created_date,
        },
      });
    }

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
        quote_amount: r.quote_amount || 0,
        dispatch_status: r.dispatch_status || '',
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