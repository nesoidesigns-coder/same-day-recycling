import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';
import { sendBookingNotifications } from '../../shared/bookingNotify.ts';
import { isActiveCity } from '../../shared/coverageStatus.ts';

// Self-driven AI booking engine. The customer chats; the AI extracts booking
// details one message at a time. The SERVER — never the model — decides when
// enough is collected and books automatically, confirmed on the spot.
const REQUIRED = ['name', 'phone', 'address', 'city', 'items_description'];
const FIELDS = [...REQUIRED, 'email', 'city', 'preferred_date', 'time_window'];
const LIMITS = {
  name: 80, phone: 30, email: 120, address: 200, city: 60,
  items_description: 500, preferred_date: 20, time_window: 40,
};

function sanitizeCollected(raw) {
  const out = {};
  for (const f of FIELDS) {
    const v = raw && raw[f];
    out[f] = typeof v === 'string' ? v.trim().slice(0, LIMITS[f]) : '';
  }
  return out;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'aiBooking', 40);
    if (!limited.allowed) return rateLimitedResponse();
    const body = await req.json().catch(() => ({}));
    const message = String(body.message || '').trim().slice(0, 600);
    if (!message) return Response.json({ error: 'Tell me what you need picked up.' }, { status: 400 });

    const collected = sanitizeCollected(body.collected);
    const history = (Array.isArray(body.history) ? body.history : [])
      .filter((m) => m && (m.role === 'assistant' || m.role === 'user') && typeof m.content === 'string')
      .slice(-8)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }));

    const today = new Date().toISOString().slice(0, 10);
    const transcript = history.map((m) => (m.role === 'user' ? 'Customer: ' : 'Rex: ') + m.content).join('\n');
    const have = Object.fromEntries(FIELDS.map((f) => [f, collected[f]]));

    const ai = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt:
        'You are Rex, the self-driven booking engine for Same Day Recycling, a Canadian junk removal and recycling company. ' +
        'Your only job is to collect the details needed to book a pickup by chatting with the customer.\n' +
        'Required details: name, phone, address, the city the pickup is in, and a short description of the items. ' +
        'Active service cities right now: Vancouver, Burnaby, Surrey, Richmond and Coquitlam (BC). ' +
        'Optional: email, preferred date, preferred time window.\n' +
        'Details already collected (JSON): ' + JSON.stringify(have) + '\n' +
        'Conversation so far:\n' + (transcript || '(just started)') + '\n' +
        "The customer's latest message: \"" + message + '"\n' +
        'Rules: extract any NEW details from the latest message into "extracted" (empty string when not mentioned; ' +
        'preferred_date as YYYY-MM-DD, resolving "today"/"tomorrow" against ' + today + ' in the America/Vancouver timezone). ' +
        'Never invent details, never quote prices, never promise an exact crew arrival time — dispatch confirms the final slot. ' +
        'Reply in ONE to two short, friendly sentences asking for the single most important missing detail ' +
        '(or, when everything required is present, confirming the details in one line). Use Canadian spelling.',
      response_json_schema: {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          extracted: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              phone: { type: 'string' },
              email: { type: 'string' },
              address: { type: 'string' },
              city: { type: 'string' },
              items_description: { type: 'string' },
              preferred_date: { type: 'string' },
              time_window: { type: 'string' },
            },
            required: ['name', 'phone', 'email', 'address', 'city', 'items_description', 'preferred_date', 'time_window'],
          },
        },
        required: ['reply', 'extracted'],
      },
    });

    const extracted = (ai && ai.extracted) || {};
    for (const f of FIELDS) {
      const v = typeof extracted[f] === 'string' ? extracted[f].trim() : '';
      if (v) collected[f] = v.slice(0, LIMITS[f]);
    }

    const missing = REQUIRED.filter((f) => !collected[f]);
    const reply =
      String((ai && ai.reply) || '').trim().slice(0, 500) ||
      'Got it. What else can you tell me about the pickup?';

    if (missing.length) {
      return Response.json({ reply, collected, missing });
    }

    // Booking integrity: confirmed bookings are only created in active service
    // territories. Anything else becomes a waitlist entry — never a Booking.
    if (!isActiveCity(collected.city)) {
      await base44.entities.ServiceWaitlist.create({
        name: collected.name,
        phone: collected.phone,
        ...(collected.email ? { email: collected.email } : {}),
        city: collected.city,
        address: collected.address,
        notes: collected.items_description,
        source: 'ai_booking',
      });
      return Response.json({
        reply:
          `To be upfront with you: we're not running confirmed pickups in ${collected.city} yet. ` +
          `I've added you to the service waitlist for ${collected.city} — we'll reach out the moment a verified partner launches there.`,
        collected,
        missing: [],
        waitlisted: true,
      });
    }

    // Everything required is present — the system books itself, no human step.
    const now = new Date().toISOString();
    const booking = await base44.entities.Booking.create({
      name: collected.name,
      phone: collected.phone,
      address: collected.address,
      items_description: collected.items_description,
      ...(collected.email ? { email: collected.email } : {}),
      ...(collected.city ? { city: collected.city } : {}),
      ...(collected.preferred_date ? { preferred_date: collected.preferred_date } : {}),
      ...(collected.time_window ? { time_window: collected.time_window } : {}),
      status: 'confirmed',
      status_history: [{ status: 'new', date: now }, { status: 'confirmed', date: now }],
    });

    const notified = await sendBookingNotifications(base44.asServiceRole, {
      name: collected.name,
      phone: collected.phone,
      address: collected.address,
      city: collected.city,
      items_description: collected.items_description,
      email: collected.email,
      preferred_date: collected.preferred_date,
      time_window: collected.time_window,
      quote_estimate: '',
    });

    return Response.json({
      reply:
        `Booked and confirmed. ${collected.name}, your pickup is confirmed for ` +
        `${collected.preferred_date || 'the next available date'}` +
        `${collected.time_window ? ` (${collected.time_window})` : ''}. ` +
        `Dispatch will lock in the exact arrival window and update you.` +
        `${collected.email ? ' A confirmation email is on its way.' : ''}`,
      collected,
      missing: [],
      booked: { id: booking.id, status: 'confirmed', notified },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}