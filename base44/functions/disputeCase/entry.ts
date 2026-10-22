import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Admin-only dispute case file loader and factual case-summary assembler.
// The summary states facts from records only: it never asserts approvals that
// are not recorded, never claims a charge is legally indisputable, and never
// recommends automatic rejection of a complaint.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const svc = base44.asServiceRole;

    const loadCase = async (disputeId, bookingId) => {
      let dispute = null;
      let booking = null;
      if (disputeId) {
        try { dispute = await svc.entities.Dispute.get(String(disputeId)); } catch {}
        if (!dispute) return null;
        try { booking = await svc.entities.Booking.get(dispute.booking_id); } catch {}
      } else if (bookingId) {
        try { booking = await svc.entities.Booking.get(String(bookingId)); } catch {}
        if (!booking) return null;
        const ds = await svc.entities.Dispute.filter({ booking_id: booking.id }, { sort: '-created_date', limit: 1 });
        dispute = (ds.items || [])[0] || null;
      }
      if (!dispute) return null;
      const cos = booking
        ? await svc.entities.ChangeOrder.filter({ booking_id: booking.id }, { sort: 'number', limit: 50 })
        : { items: [] };
      const payments = booking
        ? await svc.entities.PaypalTransaction.filter({ ref_id: booking.id }, { limit: 20 })
        : { items: [] };
      return {
        dispute,
        booking: booking || null,
        change_orders: cos.items || [],
        payments: (payments.items || []).map((p) => ({
          purpose: p.purpose, amount: p.amount, status: p.status,
          paypal_order_id: p.paypal_order_id, created_date: p.created_date,
        })),
      };
    };

    if (action === 'load') {
      const caseData = await loadCase(body.dispute_id, body.booking_id);
      if (!caseData) return Response.json({ error: 'Dispute or booking not found' }, { status: 404 });
      return Response.json(caseData);
    }

    if (action === 'summary') {
      const caseData = await loadCase(body.dispute_id, body.booking_id);
      if (!caseData) return Response.json({ error: 'Dispute or booking not found' }, { status: 404 });
      const { dispute, booking, change_orders, payments } = caseData;
      const facts = {
        complaint: dispute.complaint,
        booking: booking ? {
          reference_code: booking.reference_code, name: booking.name, city: booking.city,
          items: booking.items_description, quote_estimate: booking.quote_estimate,
          job_value: booking.job_value, final_invoice: booking.final_invoice,
          approved_quote_amount: booking.approved_quote_amount,
          approval_method: booking.approval_method, approval_date: booking.approval_date,
          status: booking.status, payment_status: booking.payment_status,
          refund_amount: booking.refund_amount,
        } : null,
        change_orders: change_orders.map((c) => ({
          number: c.number, items: c.items, amount_delta: c.amount_delta,
          tax_amount: c.tax_amount, status: c.status, approval_method: c.approval_method,
        })),
        payments,
        prior_resolution_notes: dispute.resolution_notes || '',
      };
      const summary = await svc.integrations.Core.InvokeLLM({
        prompt:
          'You are assembling a FACTUAL case summary for a reviewer at Same Day Recycling evaluating a customer dispute. ' +
          'Rules: state only facts present in the data below; explicitly note any approval that is NOT recorded (e.g. "no approval record exists"); ' +
          'do NOT claim any charge is legally indisputable; do NOT recommend automatically rejecting the complaint; ' +
          'do NOT invent amounts, dates or approvals. Structure: Timeline, Money (quote vs approved vs final vs paid), Approvals on record, Change orders, Payment status, Open questions for the reviewer.\n\n' +
          'CASE DATA (JSON):\n' + JSON.stringify(facts, null, 2),
        response_json_schema: {
          type: 'object',
          properties: { summary: { type: 'string' } },
          required: ['summary'],
        },
      });
      const text = String(summary?.summary || '').slice(0, 5000);
      await svc.entities.Dispute.update(dispute.id, { case_summary: text });
      return Response.json({ ok: true, case_summary: text });
    }

    return Response.json({ error: 'Unknown action. Use load or summary.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}