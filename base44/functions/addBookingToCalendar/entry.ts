import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

// Creates a Google Calendar event for a confirmed booking.
// Called by the admin dashboard when a booking status moves to confirmed/scheduled.
// Safe to call twice: once the booking has a calendar_event_id it returns early.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    if (!body.booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });

    const booking = await base44.entities.Booking.get(body.booking_id);
    if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    if (booking.calendar_event_id) {
      return Response.json({ ok: true, already_synced: true, event_id: booking.calendar_event_id });
    }

    // Only confirmed or scheduled pickups get synced to the calendar
    const syncStatuses = ['confirmed', 'scheduled'];
    if (!syncStatuses.includes(booking.status)) {
      return Response.json({ ok: true, skipped: true, reason: `Status is '${booking.status || 'new'}' — only confirmed or scheduled pickups are synced` });
    }

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlecalendar');

    // Pick event date: preferred date, or today as fallback
    const date = booking.preferred_date || new Date().toISOString().slice(0, 10);

    // Parse a start hour from the time window ("9-11am", "2:00 PM", "Afternoon", ...)
    const win = (booking.time_window || '').toLowerCase();
    let hour = null;
    let minute = 0;
    const timeMatch = win.match(/(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)/);
    if (timeMatch) {
      hour = parseInt(timeMatch[1], 10);
      minute = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
      if (timeMatch[3][0] === 'p' && hour < 12) hour += 12;
      if (timeMatch[3][0] === 'a' && hour === 12) hour = 0;
    } else if (/afternoon/.test(win)) {
      hour = 13;
    } else if (/evening/.test(win)) {
      hour = 16;
    } else if (/morning/.test(win)) {
      hour = 9;
    } else {
      const num = win.match(/(\d{1,2})/);
      hour = num ? parseInt(num[1], 10) : 9;
    }
    if (Number.isNaN(hour) || hour > 21) hour = 9;
    hour = Math.max(6, Math.min(21, hour));

    const pad = (n) => String(n).padStart(2, '0');
    const startDT = `${date}T${pad(hour)}:${pad(minute)}:00`;
    const endHour = hour + 2 >= 24 ? hour + 2 - 24 : hour + 2;
    const endDT = `${date}T${pad(endHour)}:${pad(minute)}:00`;

    const descriptionLines = [
      booking.items_description,
      '',
      `Phone: ${booking.phone}`,
      booking.email ? `Email: ${booking.email}` : null,
      `Status: ${booking.status || 'confirmed'}`,
      booking.quote_estimate ? `Quote: ${booking.quote_estimate}` : null,
      booking.time_window ? `Requested window: ${booking.time_window}` : null,
    ].filter(Boolean).join('\n');

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: `Junk removal — ${booking.name}${booking.city ? ` (${booking.city})` : ''}`,
        location: booking.address,
        description: descriptionLines,
        start: { dateTime: startDT, timeZone: 'America/Vancouver' },
        end: { dateTime: endDT, timeZone: 'America/Vancouver' },
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const errText = await res.text();
      return Response.json({ error: `Google Calendar API error (${res.status}): ${errText}` }, { status: 502 });
    }

    const event = await res.json();
    await base44.entities.Booking.update(booking.id, { calendar_event_id: event.id || '' });

    return Response.json({ ok: true, event_id: event.id, event_link: event.htmlLink });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}