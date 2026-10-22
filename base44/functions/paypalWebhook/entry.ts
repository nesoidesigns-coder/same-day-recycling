import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { paypal, applySubscriptionState, CURRENCY } from '../../shared/paypal.ts';

// PayPal webhook receiver. Authenticity: every inbound event is re-fetched from
// PayPal's own API by event id — anything PayPal doesn't acknowledge is rejected.
// Idempotency: event ids are logged in PaypalWebhookEvent; repeats are no-ops.
export default async function(req) {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'POST only.' }, { status: 405 });
    const base44 = createClientFromRequest(req);
    const srole = base44.asServiceRole;
    const body = await req.json().catch(() => null);
    const eventId = String(body?.id || '').trim();
    const inboundType = String(body?.event_type || '').trim();
    if (!eventId || !inboundType) return Response.json({ error: 'Missing event id or type.' }, { status: 400 });

    // 1) Verify with PayPal before trusting anything in the payload.
    let verified;
    try {
      verified = await paypal('/v1/notifications/webhooks-events/' + encodeURIComponent(eventId));
    } catch (e) {
      return Response.json({ error: 'Event could not be verified with PayPal.' }, { status: 401 });
    }
    const eventType = verified.event_type || inboundType;
    const resource = verified.resource || {};
    const subId = resource.id || resource.billing_agreement_id || '';

    // 2) Idempotency — ignore events we've already processed.
    const { items: seen } = await srole.entities.PaypalWebhookEvent.filter({ event_id: eventId }, { limit: 1 });
    if (seen && seen.length) return Response.json({ ok: true, duplicate: true });

    const rec = await srole.entities.PaypalWebhookEvent.create({
      event_id: eventId,
      event_type: eventType,
      subscription_id: subId,
      handled: false,
      detail: (verified.summary || '').slice(0, 500),
    });

    // 3) Locate the transaction this subscription belongs to.
    let tx = null;
    if (subId) {
      const { items } = await srole.entities.PaypalTransaction.filter({ paypal_subscription_id: subId }, { limit: 1 });
      tx = items && items.length ? items[0] : null;
    }

    // 3b) Reconciliation: a subscription event may arrive with no transaction
    // on file (e.g. records created before transaction logging existed). Backfill
    // one from the subscription's custom_id (the license / white-label client
    // id stored at creation) so the money trail stays complete.
    let action = 'logged';
    if (!tx && subId) {
      const customId = String(resource.custom_id || '').trim();
      if (customId) {
        const backfillStatus = /ACTIVATED|REACTIVATED/.test(eventType) ? 'active'
          : (/CANCELLED|EXPIRED/.test(eventType) ? 'cancelled' : 'created');
        const payerEmail = (resource.subscriber && resource.subscriber.email_address) || '';
        const lic = await srole.entities.SoftwareLicense.get(customId).catch(() => null);
        if (lic && lic.id) {
          tx = await srole.entities.PaypalTransaction.create({
            kind: 'subscription',
            purpose: 'license_subscription',
            ref_id: lic.id,
            ref_label: lic.company,
            customer_email: lic.email || '',
            amount: Number(lic.monthly_fee) || 0,
            currency: CURRENCY,
            paypal_subscription_id: subId,
            paypal_payer_email: payerEmail,
            status: backfillStatus,
          });
          action = 'backfilled';
        } else {
          const ag = await srole.entities.ContractorAgreement.get(customId).catch(() => null);
          if (ag && ag.id) {
            tx = await srole.entities.PaypalTransaction.create({
              kind: 'subscription',
              purpose: 'contractor_membership',
              ref_id: ag.id,
              ref_label: ag.partner_name || '',
              customer_email: ag.partner_email || '',
              amount: Number(ag.membership_fee_monthly) || Number((ag.territory_subscription || {}).monthly_rate) || 0,
              currency: CURRENCY,
              paypal_subscription_id: subId,
              paypal_payer_email: payerEmail,
              status: backfillStatus,
            });
            action = 'backfilled';
          } else {
            const wl = await srole.entities.WhiteLabelClient.get(customId).catch(() => null);
            if (wl && wl.id) {
              tx = await srole.entities.PaypalTransaction.create({
                kind: 'subscription',
                purpose: 'white_label_subscription',
                ref_id: wl.id,
                ref_label: wl.company,
                customer_email: wl.email || '',
                amount: Number(wl.monthly_fee) || 0,
                currency: CURRENCY,
                paypal_subscription_id: subId,
                paypal_payer_email: payerEmail,
                status: backfillStatus,
              });
              action = 'backfilled';
            }
          }
        }
      }
    }

    // 4) Act on lifecycle events.
    if (tx && tx.ref_id) {
      switch (eventType) {
        case 'BILLING.SUBSCRIPTION.ACTIVATED':
        case 'BILLING.SUBSCRIPTION.REACTIVATED':
          if (tx.status !== 'active') {
            await srole.entities.PaypalTransaction.update(tx.id, {
              status: 'active',
              paypal_payer_email: (resource.subscriber && resource.subscriber.email_address) || tx.paypal_payer_email || '',
            });
          }
          await applySubscriptionState(srole, tx.purpose, tx.ref_id, 'active', base44);
          action = 'activated';
          break;
        case 'BILLING.SUBSCRIPTION.CANCELLED':
        case 'BILLING.SUBSCRIPTION.EXPIRED':
          if (tx.status !== 'cancelled') {
            await srole.entities.PaypalTransaction.update(tx.id, { status: 'cancelled' });
          }
          await applySubscriptionState(srole, tx.purpose, tx.ref_id, 'cancelled');
          action = 'cancelled';
          break;
        case 'BILLING.SUBSCRIPTION.SUSPENDED':
        case 'PAYMENT.SALE.DENIED':
          await applySubscriptionState(srole, tx.purpose, tx.ref_id, 'paused');
          action = 'paused';
          break;
        case 'PAYMENT.SALE.COMPLETED':
          action = 'payment_recorded';
          break;
        default:
          action = 'logged';
      }
    }

    await srole.entities.PaypalWebhookEvent.update(rec.id, {
      handled: !!tx,
      target: tx ? tx.purpose : '',
      license_ref: tx ? tx.ref_id : '',
      detail: ((verified.summary || '') + ' | action: ' + action + (tx ? '' : ' | no matching transaction - needs admin review')).slice(0, 1000),
    });
    return Response.json({ ok: true, action });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}