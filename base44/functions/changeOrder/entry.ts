import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { waitUntil } from 'base44:runtime';
import { taxFor, provinceForCity } from '../../shared/canadaTax.ts';

const APP_URL = 'https://samedayrecycling.ca';
const OWNER_EMAIL = 'samedayrecycling@gmail.com';
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const today = () => new Date().toISOString().slice(0, 10);

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const svc = base44.asServiceRole;

    // ---- Public: customer views a change order via its secure token ----
    if (action === 'view') {
      const token = String(body.token || '').trim();
      if (!token) return Response.json({ error: 'Missing approval token' }, { status: 400 });
      const found = await svc.entities.ChangeOrder.filter({ approval_token: token }, { limit: 1 });
      const co = (found.items || [])[0];
      if (!co) return Response.json({ error: 'Change order not found' }, { status: 404 });
      return Response.json({
        change_order: {
          number: co.number,
          items: co.items,
          description: co.description || '',
          amount_delta: co.amount_delta,
          tax_amount: co.tax_amount,
          revised_total: co.revised_total,
          status: co.status,
          job_ref: co.job_ref || '',
        },
      });
    }

    // ---- Public: customer approves or declines via its secure token ----
    if (action === 'respond') {
      const token = String(body.token || '').trim();
      const decision = String(body.decision || '');
      if (!token) return Response.json({ error: 'Missing approval token' }, { status: 400 });
      if (!['approved', 'declined'].includes(decision)) {
        return Response.json({ error: 'decision must be approved or declined' }, { status: 400 });
      }
      const found = await svc.entities.ChangeOrder.filter({ approval_token: token }, { limit: 1 });
      const co = (found.items || [])[0];
      if (!co) return Response.json({ error: 'Change order not found' }, { status: 404 });
      if (co.status !== 'pending_approval') {
        return Response.json({ error: `This change order was already ${co.status.replace('_', ' ')}` }, { status: 409 });
      }
      const method = ['secure_link', 'chat', 'phone', 'on_site'].includes(String(body.method || '')) ? String(body.method) : 'secure_link';
      const history = [...(co.history || []), { date: today(), event: decision, note: `Customer decision recorded (${method})` }];
      await svc.entities.ChangeOrder.update(co.id, {
        status: decision,
        responded_date: today(),
        approval_method: method,
        history,
      });
      if (decision === 'approved') {
        try {
          const booking = await svc.entities.Booking.get(co.booking_id);
          if (booking) {
            const base = Number(booking.final_invoice) > 0 ? Number(booking.final_invoice) : (Number(booking.job_value) || 0);
            await svc.entities.Booking.update(booking.id, {
              final_invoice: round2(base + Number(co.amount_delta || 0) + Number(co.tax_amount || 0)),
            });
          }
        } catch {}
      }
      waitUntil(svc.integrations.Core.SendEmail({
        to: OWNER_EMAIL,
        subject: `Change order #${co.number} ${decision === 'approved' ? 'approved' : 'declined'} (${co.job_ref || co.booking_id})`,
        body: `The customer ${decision === 'approved' ? 'APPROVED' : 'DECLINED'} change order #${co.number} for booking ${co.job_ref || co.booking_id}. Additional items: ${co.items}. Amount: $${round2(co.amount_delta).toFixed(2)}${co.tax_amount ? ` + $${round2(co.tax_amount).toFixed(2)} tax` : ''}.`,
        from_name: 'Same Day Recycling',
      }).catch(() => {}));
      return Response.json({ ok: true, status: decision });
    }

    // ---- Authenticated actions below: admin, or the booking's own contractor ----
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const isAdmin = user.role === 'admin';
    const bookingId = String(body.booking_id || '');

    let booking = null;
    if (bookingId) {
      try { booking = await svc.entities.Booking.get(bookingId); } catch {}
      if (!booking) return Response.json({ error: 'Booking not found' }, { status: 404 });
    }
    let scopeOk = isAdmin;
    if (!scopeOk && booking) {
      const partners = await base44.entities.Partner.filter({ email: user.email }, { limit: 1 });
      const partner = (partners.items || [])[0];
      scopeOk = !!(partner && booking.partner_id === partner.id);
    }
    if (!scopeOk) return Response.json({ error: 'Forbidden' }, { status: 403 });

    if (action === 'list') {
      if (!booking) return Response.json({ error: 'booking_id is required' }, { status: 400 });
      const cos = await svc.entities.ChangeOrder.filter({ booking_id: bookingId }, { sort: 'number', limit: 50 });
      return Response.json({ change_orders: cos.items || [] });
    }

    if (action === 'approve_original') {
      if (!booking) return Response.json({ error: 'booking_id is required' }, { status: 400 });
      const amount = round2(body.approved_amount);
      if (!(amount > 0)) return Response.json({ error: 'approved_amount must be a positive number' }, { status: 400 });
      const method = ['on_site', 'secure_link', 'chat', 'phone'].includes(String(body.method || '')) ? String(body.method) : 'on_site';
      await svc.entities.Booking.update(booking.id, {
        approved_quote_amount: amount,
        approval_method: method,
        approval_date: today(),
      });
      return Response.json({ ok: true, approved_quote_amount: amount, approval_method: method, approval_date: today() });
    }

    if (action === 'create') {
      if (!booking) return Response.json({ error: 'booking_id is required' }, { status: 400 });
      const items = String(body.items || '').trim();
      const delta = round2(body.amount_delta);
      if (!items) return Response.json({ error: 'items is required' }, { status: 400 });
      if (Number(body.amount_delta) === 0) return Response.json({ error: 'amount_delta is required (the additional charge)' }, { status: 400 });
      const existing = await svc.entities.ChangeOrder.filter({ booking_id: booking.id }, { limit: 100 });
      const number = ((existing.items || []).length) + 1;
      const province = booking.province_code || provinceForCity(booking.city);
      const tax = taxFor(province, delta);
      const base = Number(booking.final_invoice) > 0 ? Number(booking.final_invoice) : (Number(booking.job_value) || 0);
      const token = crypto.randomUUID().replace(/-/g, '');
      const history = [{ date: today(), event: 'created', note: `Requested by ${user.email} (${isAdmin ? 'admin' : 'contractor'})` }];
      const created = await svc.entities.ChangeOrder.create({
        booking_id: booking.id,
        job_ref: booking.reference_code || '',
        number,
        items,
        description: String(body.description || '').slice(0, 1000),
        photo_uris: Array.isArray(body.photo_uris) ? body.photo_uris.slice(0, 6) : [],
        amount_delta: delta,
        tax_amount: tax.tax,
        revised_total: round2(base + delta + tax.tax),
        status: 'pending_approval',
        approval_token: token,
        requested_by: user.email,
        requested_by_role: isAdmin ? 'admin' : 'contractor',
        history,
        notes: String(body.notes || '').slice(0, 1000),
      });
      if (booking.email) {
        waitUntil(svc.integrations.Core.SendEmail({
          to: booking.email,
          subject: `Change order #${number} for your pickup - approval needed`,
          body: `Hi ${booking.name || 'there'},\n\nYou asked us to add: ${items}\nAdditional charge: $${delta.toFixed(2)}${tax.tax ? ` + $${tax.tax.toFixed(2)} ${tax.label}` : ''}\nJob total if approved: $${round2(base + delta + tax.tax).toFixed(2)}\n\nThe original approved price is unchanged. Additional work is only carried out and charged once you approve it.\n\nReview and approve or decline here:\n${APP_URL}/change-order?token=${token}\n\nQuestions? Call (604) 849-1745.\n\nSame Day Recycling`,
          from_name: 'Same Day Recycling',
        }).catch(() => {}));
      }
      return Response.json({
        ok: true,
        change_order: created,
        approve_url: `${APP_URL}/change-order?token=${token}`,
      });
    }

    if (action === 'cancel') {
      if (!booking) return Response.json({ error: 'booking_id is required' }, { status: 400 });
      const found = await svc.entities.ChangeOrder.filter({ booking_id: booking.id, status: 'pending_approval' }, { limit: 10 });
      const targets = body.change_order_id
        ? (found.items || []).filter((c) => c.id === String(body.change_order_id))
        : (found.items || []);
      if (!targets.length) return Response.json({ error: 'No pending change order found' }, { status: 404 });
      for (const co of targets) {
        await svc.entities.ChangeOrder.update(co.id, {
          status: 'cancelled',
          history: [...(co.history || []), { date: today(), event: 'cancelled', note: `Cancelled by ${user.email}` }],
        });
      }
      return Response.json({ ok: true, cancelled: targets.length });
    }

    return Response.json({ error: 'Unknown action. Use view, respond, list, approve_original, create or cancel.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}