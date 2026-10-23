import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Operations tracker: appends every new service request / booking to a
// Google Spreadsheet the ops team can follow. Actions:
//  - setup:   admin — creates the spreadsheet, writes headers, backfills recent bookings
//  - process: called by the "Bookings to Ops Sheet" workflow on every new booking
//  - toggle:  admin — enable/disable auto-push

const HEADERS = [
  'Logged', 'Reference', 'Status', 'Assignment', 'Name', 'Phone', 'Email',
  'Address', 'City', 'Province', 'Items', 'Preferred date', 'Time window',
  'Quote estimate', 'Approved quote', 'Final invoice', 'Assigned partner',
  'Record type',
];

function rowFor(booking, loggedAt) {
  return [
    loggedAt,
    booking.reference_code || booking.id || '',
    booking.status || 'new',
    booking.assignment_status || 'unassigned',
    booking.name || '',
    booking.phone || '',
    booking.email || '',
    booking.address || '',
    booking.city || '',
    booking.province_code || '',
    booking.items_description || '',
    booking.preferred_date || '',
    booking.time_window || '',
    booking.quote_estimate || '',
    booking.approved_quote_amount || 0,
    booking.final_invoice || 0,
    booking.partner_name || '',
    booking.record_type || 'service',
  ];
}

async function getSettings(base44) {
  const page = await base44.asServiceRole.entities.OpsSheetsSettings.list({ limit: 1 });
  return page.items?.[0] || null;
}

async function appendRows(base44, accessToken, sheetId, values) {
  const res = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Bookings!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
      signal: AbortSignal.timeout(20000),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Google Sheets append failed (${res.status}): ${err.error?.message || 'unknown error'}`);
  }
  return res.json();
}

async function loadBookings(base44, cursor) {
  return base44.asServiceRole.entities.Booking.filter(
    { record_type: 'service' },
    { sort: '-created_date', limit: 200, ...(cursor ? { cursor } : {}) }
  );
}

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const action = body.action || 'process';

    if (action === 'setup') {
      const existing = await getSettings(base44);
      if (existing?.spreadsheet_id) {
        return Response.json({ ok: true, already: true, sheet_url: existing.spreadsheet_url });
      }
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          properties: { title: `Same Day Recycling - Operations Tracker (${new Date().toISOString().slice(0, 10)})` },
          sheets: [{ properties: { title: 'Bookings' } }],
        }),
      });
      const created = await createRes.json();
      if (!createRes.ok) {
        return Response.json({ error: created.error?.message || 'Google refused the new spreadsheet.' }, { status: 502 });
      }

      // Backfill recent service bookings so the tracker starts useful
      let backfilled = 0;
      const now = new Date().toISOString();
      const page = await loadBookings(base44);
      const rows = (page.items || []).map((b) => rowFor(b, b.created_date || now));
      if (rows.length) {
        try {
          await appendRows(base44, accessToken, created.spreadsheetId, [HEADERS, ...rows]);
          backfilled = rows.length;
        } catch (e) {
          // Headers still attempted below; surface backfill problem but keep setup successful
          await appendRows(base44, accessToken, created.spreadsheetId, [HEADERS]).catch(() => {});
          return Response.json({ error: `Sheet created but the backfill failed: ${e.message}. Sheet: ${created.spreadsheetUrl}` }, { status: 502 });
        }
      } else {
        await appendRows(base44, accessToken, created.spreadsheetId, [HEADERS]);
      }

      await base44.asServiceRole.entities.OpsSheetsSettings.create({
        spreadsheet_id: created.spreadsheetId,
        spreadsheet_url: created.spreadsheetUrl,
        sheet_name: 'Bookings',
        enabled: true,
        last_backfill_date: new Date().toISOString().slice(0, 10),
        notes: `Backfilled ${backfilled} bookings at setup.`,
      });
      return Response.json({ ok: true, sheet_url: created.spreadsheetUrl, backfilled });
    }

    if (action === 'toggle') {
      const settings = await getSettings(base44);
      if (!settings) return Response.json({ error: 'Run setup first — no operations spreadsheet exists yet.' }, { status: 400 });
      const updated = await base44.asServiceRole.entities.OpsSheetsSettings.update(settings.id, { enabled: !settings.enabled });
      return Response.json({ ok: true, enabled: updated.enabled });
    }

    if (action === 'process') {
      const settings = await getSettings(base44);
      if (!settings?.spreadsheet_id || !settings.enabled) {
        return Response.json({ ok: true, skipped: true, reason: 'Ops sheets sync is off or not set up.' });
      }
      if (!body.booking_id) return Response.json({ error: 'booking_id required' }, { status: 400 });
      const booking = await base44.asServiceRole.entities.Booking.get(body.booking_id);
      if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
      if (booking.record_type && booking.record_type !== 'service') {
        return Response.json({ ok: true, skipped: true, reason: 'Not a service booking.' });
      }
      const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
      await appendRows(base44, accessToken, settings.spreadsheet_id, [rowFor(booking, booking.created_date || new Date().toISOString())]);
      return Response.json({ ok: true });
    }

    return Response.json({ error: `Unknown action '${action}'` }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}