import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Admin-gated dispatch simulation: creates a mock booking (internal_test, so
// it never touches real metrics or dispatch queues), assigns it to a
// contractor, and sends the contractor a dispatch confirmation email —
// verifying the end-to-end booking -> assignment -> contractor communication
// path without touching production data.
const SIM_NAME = 'SIM TEST Customer';
const SIM_MARKER = 'dispatch_simulation';
const PARTNER_SHARE = 0.75;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admins only.' }, { status: 403 });
    }
    const srole = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'run');

    if (action === 'cleanup') {
      // Remove ONLY records this simulation creates: bookings with the sim
      // name and internal_test type, plus a mock partner tied to this admin.
      const sims = await srole.entities.Booking.filter({ record_type: 'internal_test', name: SIM_NAME }, { limit: 100 });
      const simList = sims.items || sims;
      for (const b of simList) {
        await srole.entities.Booking.delete(b.id);
      }
      const mockPartners = await srole.entities.Partner.filter({ name: 'TEST Simulation Contractor' }, { limit: 50 });
      const mockList = mockPartners.items || mockPartners;
      for (const p of mockList) {
        if (p.email === user.email) await srole.entities.Partner.delete(p.id);
      }
      return Response.json({ ok: true, removed_bookings: simList.length, removed_mock_partners: mockList.length });
    }

    // action === 'run'
    const recipientOverride = String(body.recipient || '').trim().slice(0, 200);
    const jobId = String(body.booking_id || '').trim(); // optionally re-notify an existing sim booking

    // 1. Resolve (or auto-create) the contractor.
    let partner = null;
    if (jobId) {
      const b = await srole.entities.Booking.get(jobId);
      if (!b || !b.id || (b.notes || '') !== SIM_MARKER) {
        return Response.json({ error: 'Simulation booking not found.' }, { status: 404 });
      }
      partner = { id: b.partner_id, name: b.partner_name, city: b.city };
      partner.email = recipientOverride || user.email;
      const notif = await sendDispatchEmail(srole, partner, b);
      await srole.entities.Booking.update(b.id, { notified: { dispatch_email: notif.status } });
      return Response.json({ ok: notif.status === 'sent', booking_id: b.id, partner: partner.name, email_to: partner.email, email_status: notif.status, error: notif.error });
    }
    if (body.partner_id) {
      const page = await srole.entities.Partner.filter({ _id: body.partner_id }, { limit: 1 });
      partner = (page.items || page)[0] || null;
    }
    if (!partner) {
      const page = await srole.entities.Partner.filter({ active: true }, { limit: 50 });
      partner = (page.items || page)[0] || null;
    }
    let createdMockPartner = false;
    if (!partner) {
      // Empty contractor network: spin up a mock contractor for the simulation.
      partner = await srole.entities.Partner.create({
        name: 'TEST Simulation Contractor',
        email: user.email,
        city: 'Vancouver',
        equipment: ['pickup truck'],
        active: true,
        description: 'Auto-created mock contractor for the dispatch simulation flow.',
      });
      createdMockPartner = true;
    }

    // 2. Create the mock booking, already assigned to the contractor.
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const simRef = crypto.randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
    const booking = await srole.entities.Booking.create({
      name: SIM_NAME,
      phone: '604-555-0188',
      email: recipientOverride || user.email,
      address: '123 Simulation Street',
      city: partner.city || 'Vancouver',
      province_code: 'BC',
      items_description: 'DISPATCH SIMULATION: one sofa, one mattress, two boxes',
      preferred_date: tomorrow,
      time_window: '10:00 - 12:00',
      quote_estimate: '$249',
      job_value: 249,
      record_type: 'internal_test',
      status: 'confirmed',
      assignment_status: 'assigned',
      partner_id: partner.id,
      partner_name: partner.name,
      description: 'Automated dispatch simulation booking.',
      notes: SIM_MARKER,
    });

    // 3. Send the contractor the dispatch confirmation.
    const emailTo = recipientOverride || partner.email || user.email;
    const notif = await sendDispatchEmail(srole, { name: partner.name, email: emailTo }, { ...booking, sim_ref: simRef });
    await srole.entities.Booking.update(booking.id, {
      notified: { dispatch_email: notif.status },
      status_history: [{ status: 'assigned', date: new Date().toISOString() }],
    });

    return Response.json({
      ok: notif.status === 'sent',
      booking_id: booking.id,
      sim_ref: simRef,
      partner: partner.name,
      mock_partner_created: createdMockPartner,
      email_to: emailTo,
      email_status: notif.status,
      error: notif.error || '',
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function sendDispatchEmail(srole, partner, b) {
  const payout = Math.round((Number(b.job_value) || 0) * PARTNER_SHARE * 100) / 100;
  const when = `${b.preferred_date || 'TBC'}${b.time_window ? ' · ' + b.time_window : ''}`;
  try {
    await srole.integrations.Core.SendEmail({
      to: partner.email,
      from_name: 'Same Day Recycling',
      subject: `Dispatch confirmed: ${b.name} · ${b.city || ''} (${b.quote_estimate || ''})`,
      text: `DISPATCH SIMULATION. Job ${b.sim_ref || ''}: ${b.name}, ${b.phone}. ${b.address}, ${b.city}. ${b.items_description}. ${when}. Job value: $${(Number(b.job_value) || 0).toFixed(2)} CAD. Your payout (75%): $${payout.toFixed(2)}.`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#102b2a">` +
        `<h2 style="color:#187b65;margin:0 0 4px">Dispatch confirmation</h2>` +
        `<p style="margin:0 0 16px;color:#475569">DISPATCH SIMULATION &mdash; job ${b.sim_ref || ''}</p>` +
        `<table style="width:100%;border-collapse:collapse;margin:16px 0">` +
        `<tr><td style="padding:6px 0;color:#475569">Customer</td><td style="text-align:right;font-weight:bold">${b.name} &middot; <a href="tel:${b.phone}" style="color:#187b65">${b.phone}</a></td></tr>` +
        `<tr><td style="padding:6px 0;color:#475569">Address</td><td style="text-align:right;font-weight:bold">${b.address}, ${b.city || ''}</td></tr>` +
        `<tr><td style="padding:6px 0;color:#475569">Items</td><td style="text-align:right">${b.items_description}</td></tr>` +
        `<tr><td style="padding:6px 0;color:#475569">Date / window</td><td style="text-align:right;font-weight:bold">${when}</td></tr>` +
        `<tr><td style="padding:6px 0;color:#475569">Job value</td><td style="text-align:right">$${(Number(b.job_value) || 0).toFixed(2)} CAD</td></tr>` +
        `<tr><td style="padding:6px 0;color:#475569">Your payout (75%)</td><td style="text-align:right;font-weight:bold;color:#187b65">$${payout.toFixed(2)}</td></tr>` +
        `</table>` +
        `<p style="color:#475569">Call the customer to confirm the window, then accept the job in your partner portal.</p>` +
        `<p style="color:#475569">Questions? Call (604) 849-1745.</p></div>`,
    });
    return { status: 'sent' };
  } catch (e) {
    const msg = String((e && e.message) || e);
    console.error('Dispatch confirmation email failed:', msg);
    return { status: 'failed', error: msg };
  }
}