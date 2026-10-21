import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { paypal, paypalAppOrigin, parseQuoteAmount, CURRENCY } from '../../shared/paypal.ts';
import { categorizeLoad, buildImpactPdf, COMMERCIAL_RE } from '../../shared/impactReceipt.ts';

// Agent-facing sales actions for Rex: payment links and recycling receipts.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const svc = base44.asServiceRole;
    const origin = paypalAppOrigin(req);

    // PayPal redirect return (browser GET): capture the approved order, then send the customer home.
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const orderId = url.searchParams.get('token');
      if (!orderId) return Response.redirect(origin + '/', 302);
      const cap = await paypal('/v2/checkout/orders/' + orderId + '/capture', 'POST');
      const payerEmail = (cap.payer && cap.payer.email_address) || '';
      const { items } = await svc.entities.PaypalTransaction.filter({ paypal_order_id: orderId }, { limit: 1 });
      let booking = null;
      if (items && items.length) {
        await svc.entities.PaypalTransaction.update(items[0].id, { status: 'paid', paypal_payer_email: payerEmail });
        if (items[0].ref_id) booking = await svc.entities.Booking.get(items[0].ref_id).catch(() => null);
        if (booking && booking.email) {
          await svc.integrations.Core.SendEmail({
            to: booking.email,
            subject: 'Payment received - Same Day Recycling',
            from_name: 'Same Day Recycling',
            body: 'Hi ' + (booking.name || 'there') + ',\n\nPayment received - thank you. Your pickup is on the books and our team will be in touch with your arrival window.\n\nSame Day Recycling | (604) 849-1745 | samedayrecycling.ca',
          });
        }
      }
      return Response.redirect(origin + '/?paid=1', 302);
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');

    if (action === 'payment_link') {
      const bookingId = String(body.booking_id || '').trim();
      if (!bookingId) return Response.json({ error: 'booking_id is required' }, { status: 400 });
      const b = await svc.entities.Booking.get(bookingId);
      if (!b || !b.id) return Response.json({ error: 'Booking not found.' }, { status: 404 });
      const amount = parseQuoteAmount(b.quote_estimate) || Number(b.job_value) || 0;
      if (!amount) {
        return Response.json({
          error: "The final price is confirmed by the crew on arrival, so there's nothing to prepay yet. Payment happens after the pickup.",
          code: 'pay_on_arrival',
        }, { status: 422 });
      }
      const order = await paypal('/v2/checkout/orders', 'POST', {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: CURRENCY, value: amount.toFixed(2) },
          description: ('Junk removal pickup - ' + (b.items_description || '')).slice(0, 127),
          custom_id: ('booking_quote:' + b.id).slice(0, 127),
        }],
        application_context: {
          shipping_preference: 'NO_SHIPPING',
          return_url: origin + '/functions/rexSales',
          cancel_url: origin + '/?pay_cancelled=1',
        },
      });
      await svc.entities.PaypalTransaction.create({
        kind: 'order',
        purpose: 'booking_quote',
        ref_id: b.id,
        ref_label: b.name + (b.city ? ' - ' + b.city : ''),
        customer_email: b.email || '',
        amount,
        currency: CURRENCY,
        paypal_order_id: order.id,
        status: 'created',
      });
      const approve = (order.links || []).find((l) => l.rel === 'approve' || l.rel === 'payer-action');
      return Response.json({ approve_url: approve ? approve.href : null, amount });
    }

    if (action === 'receipt') {
      const bookingId = String(body.booking_id || '').trim();
      if (!bookingId) return Response.json({ error: 'booking_id is required' }, { status: 400 });
      const booking = await svc.entities.Booking.get(bookingId);
      if (!booking) return Response.json({ error: 'Booking not found.' }, { status: 404 });
      if (booking.status !== 'completed') {
        return Response.json({ sent: false, reason: 'Booking is not completed yet - receipts go out after the pickup is done.' });
      }
      if (!booking.email) {
        return Response.json({ sent: false, reason: 'This booking has no customer email on file - ask for one and save it first.' });
      }
      const city = booking.city || 'Canada';
      const pickupDate = booking.preferred_date || new Date().toISOString().slice(0, 10);
      const items = (booking.items_description || '').slice(0, 400) || 'Your load';
      const categories = await categorizeLoad(base44, booking.items_description || '');
      const commercial = COMMERCIAL_RE.test((booking.items_description || '') + ' ' + (booking.description || ''));
      const pdfBase64 = buildImpactPdf({
        customerName: booking.name,
        city,
        pickupDate,
        items,
        categories,
        bookingId: booking.id,
        commercial,
      });
      await svc.integrations.Core.SendEmail({
        to: booking.email,
        template_name: 'RecyclingReceipt',
        attachments: [{ filename: 'Same-Day-Recycling-Impact-Report.pdf', content: pdfBase64 }],
        variables: {
          customer_name: booking.name || 'there',
          city,
          pickup_date: pickupDate,
          items,
        },
      });
      return Response.json({ sent: true, to: booking.email, pdf: true });
    }

    return Response.json({ error: 'Unknown action. Use payment_link or receipt.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}