import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const OWNER_EMAIL = 'nesoidesigns@gmail.com';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Everything submitted in the last 24 hours
    const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();

    const bookings = (await base44.asServiceRole.entities.Booking.filter(
      { created_date: { $gte: cutoff } },
      { sort: '-created_date', limit: 100 }
    )).items || [];

    const leads = (await base44.asServiceRole.entities.RealtorLead.filter(
      { created_date: { $gte: cutoff } },
      { sort: '-created_date', limit: 100 }
    )).items || [];

    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Vancouver' });

    if (!bookings.length && !leads.length) {
      try {
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: OWNER_EMAIL,
          subject: `Daily report ${today}: no new submissions`,
          html:
            '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto">' +
            `<h2 style="color:#0c3b24">Daily report &mdash; ${today}</h2>` +
            '<p style="color:#475569">No new bookings or realtor leads came in over the last 24 hours.</p>' +
            '</div>',
        });
      } catch {}
      return Response.json({ ok: true, bookings: 0, leads: 0 });
    }

    const esc = (s) => String(s == null ? '' : s).replace(/</g, '&lt;');

    const bookingRows = bookings
      .map(
        (b) =>
          `<tr style="border-bottom:1px solid #e5e7eb">` +
          `<td style="padding:10px 8px;vertical-align:top"><strong style="color:#0c3b24">${esc(b.name)}</strong><br><span style="font-size:12px;color:#475569">${esc(b.phone)}</span></td>` +
          `<td style="padding:10px 8px;vertical-align:top;font-size:13px;color:#0c3b24">${esc(b.address)}${b.city ? ', ' + esc(b.city) : ''}<br><span style="color:#475569">${esc(b.items_description)}</span></td>` +
          `<td style="padding:10px 8px;vertical-align:top;font-size:13px;color:#475569">${esc(b.preferred_date || 'flexible')}<br>${esc(b.time_window || '')}</td>` +
          `<td style="padding:10px 8px;vertical-align:top;font-size:13px;color:#475569">${esc(b.quote_estimate || '')}</td>` +
          `<td style="padding:10px 8px;vertical-align:top;font-size:12px"><span style="background:#1d9e56;color:#000;padding:2px 8px;border-radius:8px;font-weight:bold">${esc(b.status)}</span></td>` +
          `</tr>`
      )
      .join('');

    const leadRows = leads
      .map(
        (l) =>
          `<tr style="border-bottom:1px solid #e5e7eb">` +
          `<td style="padding:10px 8px;vertical-align:top"><strong style="color:#0c3b24">${esc(l.agent_name)}</strong>${l.brokerage ? '<br><span style="font-size:12px;color:#475569">' + esc(l.brokerage) + '</span>' : ''}<br><span style="font-size:12px;color:#475569">${esc(l.phone)}</span></td>` +
          `<td style="padding:10px 8px;vertical-align:top;font-size:13px;color:#0c3b24">${esc(l.property_address)}${l.city ? ', ' + esc(l.city) : ''}<br><span style="color:#475569">${esc(l.items_description || '')}</span></td>` +
          `<td style="padding:10px 8px;vertical-align:top;font-size:13px;color:#475569">${esc(l.preferred_date || 'flexible')}</td>` +
          `<td style="padding:10px 8px;vertical-align:top;font-size:13px;color:#475569">${l.quote_low != null ? '$' + esc(l.quote_low) + ' &ndash; $' + esc(l.quote_high) : 'pending AI quote'}</td>` +
          `<td style="padding:10px 8px;vertical-align:top;font-size:12px"><span style="background:#1d9e56;color:#000;padding:2px 8px;border-radius:8px;font-weight:bold">${esc(l.status)}</span></td>` +
          `</tr>`
      )
      .join('');

    const table = (title, head, rows, empty) =>
      `<h3 style="color:#0c3b24;margin:24px 0 8px">${title}</h3>` +
      (rows
        ? `<table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f4f7f5;text-align:left">${head
            .map((h) => `<th style="padding:8px;color:#0c3b24">${h}</th>`)
            .join('')}</tr></thead><tbody>${rows}</tbody></table>`
        : `<p style="color:#475569;font-size:13px">${empty}</p>`);

    const html =
      '<div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto">' +
      `<h2 style="color:#0c3b24">Daily report &mdash; ${today}</h2>` +
      '<p style="color:#475569">Everything submitted in the last 24 hours:</p>' +
      table(
        `New bookings (${bookings.length})`,
        ['Customer', 'Address &amp; items', 'Requested', 'Quote', 'Status'],
        bookingRows,
        'No new bookings in the last 24 hours.'
      ) +
      table(
        `Realtor leads (${leads.length})`,
        ['Agent', 'Property &amp; items', 'Needed by', 'AI quote', 'Status'],
        leadRows,
        'No new realtor leads in the last 24 hours.'
      ) +
      '<p style="margin-top:20px"><a href="https://samedayrecycling.ca/admin/jobs" style="background:#1d9e56;color:#000;padding:12px 24px;border-radius:16px;font-weight:bold;text-decoration:none">Open the dashboard</a></p>' +
      '</div>';

    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: OWNER_EMAIL,
        subject: `Daily report ${today}: ${bookings.length} booking${bookings.length === 1 ? '' : 's'}, ${leads.length} realtor lead${leads.length === 1 ? '' : 's'}`,
        html,
      });
    } catch {}

    return Response.json({ ok: true, bookings: bookings.length, leads: leads.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}