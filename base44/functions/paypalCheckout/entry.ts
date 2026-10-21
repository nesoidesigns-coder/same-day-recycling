import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';
import { paypal, paypalAppOrigin as appOrigin, parseQuoteAmount, CURRENCY } from '../../shared/paypal.ts';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || '');
    const srole = base44.asServiceRole;
    const mode = (secrets.get('PAYPAL_MODE') || 'sandbox').toLowerCase();

    if (action === 'config') {
      return Response.json({ clientId: secrets.get('PAYPAL_CLIENT_ID') || '', currency: CURRENCY, mode });
    }

    if (action === 'get_client') {
      const payToken = String(body.pay_token || '').trim();
      if (!payToken) return Response.json({ error: 'Missing payment token.' }, { status: 400 });
      const { items } = await srole.entities.WhiteLabelClient.filter({ pay_token: payToken }, { limit: 1 });
      if (!items || !items.length) return Response.json({ error: 'This payment link is not valid.' }, { status: 404 });
      const c = items[0];
      const setup = await srole.entities.PaypalTransaction.filter({ purpose: 'white_label_setup', ref_id: c.id, status: 'paid' }, { limit: 1 });
      const sub = await srole.entities.PaypalTransaction.filter({ purpose: 'white_label_subscription', ref_id: c.id, status: 'active' }, { limit: 1 });
      return Response.json({
        company: c.company,
        contact_name: c.contact_name,
        setup_fee: Number(c.setup_fee) || 0,
        monthly_fee: Number(c.monthly_fee) || 0,
        plan: c.plan,
        setup_paid: !!(setup.items && setup.items.length),
        subscription_active: !!(sub.items && sub.items.length),
      });
    }

    if (action === 'get_license') {
      const payToken = String(body.pay_token || '').trim();
      if (!payToken) return Response.json({ error: 'Missing payment token.' }, { status: 400 });
      const { items } = await srole.entities.SoftwareLicense.filter({ pay_token: payToken }, { limit: 1 });
      if (!items || !items.length) return Response.json({ error: 'This payment link is not valid.' }, { status: 404 });
      const c = items[0];
      const setup = await srole.entities.PaypalTransaction.filter({ purpose: 'license_setup', ref_id: c.id, status: 'paid' }, { limit: 1 });
      const sub = await srole.entities.PaypalTransaction.filter({ purpose: 'license_subscription', ref_id: c.id, status: 'active' }, { limit: 1 });
      return Response.json({
        company: c.company,
        contact_name: c.contact_name,
        setup_fee: Number(c.setup_fee) || 0,
        monthly_fee: Number(c.monthly_fee) || 0,
        plan: c.plan,
        setup_paid: !!(setup.items && setup.items.length),
        subscription_active: !!(sub.items && sub.items.length),
      });
    }

    if (action === 'create_license') {
      const s = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
      const company = s(body.company, 100);
      const contactName = s(body.contact_name, 80);
      const email = s(body.email, 120).toLowerCase();
      const city = s(body.city, 60);
      const province = s(body.province, 40);
      const phone = s(body.phone, 40);
      const plan = ['starter', 'growth', 'network'].includes(body.plan) ? body.plan : 'starter';
      if (!company || !contactName || !email || !email.includes('@')) {
        return Response.json({ error: 'Company, contact name and a valid email are required.' }, { status: 400 });
      }
      const FEES = { starter: { setup: 2500, monthly: 199 }, growth: { setup: 4500, monthly: 399 }, network: { setup: 9500, monthly: 799 } };
      const existing = await srole.entities.SoftwareLicense.filter({ email }, { limit: 1 });
      if (existing.items && existing.items.length) {
        return Response.json({ pay_token: existing.items[0].pay_token, existing: true });
      }
      const rec = await srole.entities.SoftwareLicense.create({
        company,
        contact_name: contactName,
        email,
        phone,
        city,
        province,
        plan,
        setup_fee: FEES[plan].setup,
        monthly_fee: FEES[plan].monthly,
        status: 'provisioning',
        pay_token: crypto.randomUUID(),
      });
      return Response.json({ pay_token: rec.pay_token, existing: false });
    }

    if (action === 'create_order') {
      const kind = String(body.kind || '');
      let amount = 0, description = '', refId = '', refLabel = '', purpose = '', customerEmail = '';
      if (kind === 'booking') {
        const bookingId = String(body.booking_id || '').trim();
        if (!bookingId) return Response.json({ error: 'Missing booking.' }, { status: 400 });
        const b = await srole.entities.Booking.get(bookingId);
        if (!b || !b.id) return Response.json({ error: 'Booking not found.' }, { status: 404 });
        amount = parseQuoteAmount(b.quote_estimate) || Number(b.job_value) || 0;
        if (!amount) {
          return Response.json({ error: "The final price is confirmed by the crew on arrival, so there's nothing to pay yet. Call (604) 849-1745 to pay after your pickup." }, { status: 422 });
        }
        purpose = 'booking_quote';
        refId = b.id;
        refLabel = b.name + (b.city ? ' - ' + b.city : '');
        description = 'Junk removal pickup - ' + (b.items_description || '').slice(0, 100);
        customerEmail = b.email || '';
      } else if (kind === 'white_label_setup') {
        const payToken = String(body.pay_token || '').trim();
        if (!payToken) return Response.json({ error: 'Missing payment token.' }, { status: 400 });
        const { items } = await srole.entities.WhiteLabelClient.filter({ pay_token: payToken }, { limit: 1 });
        if (!items || !items.length) return Response.json({ error: 'This payment link is not valid.' }, { status: 404 });
        const c = items[0];
        amount = Number(c.setup_fee) || 0;
        if (!amount) return Response.json({ error: 'No setup fee is configured for this client.' }, { status: 422 });
        purpose = 'white_label_setup';
        refId = c.id;
        refLabel = c.company;
        description = 'White-label setup fee - ' + c.company;
        customerEmail = c.email || '';
      } else if (kind === 'license_setup') {
        const payToken = String(body.pay_token || '').trim();
        if (!payToken) return Response.json({ error: 'Missing payment token.' }, { status: 400 });
        const { items } = await srole.entities.SoftwareLicense.filter({ pay_token: payToken }, { limit: 1 });
        if (!items || !items.length) return Response.json({ error: 'This payment link is not valid.' }, { status: 404 });
        const c = items[0];
        amount = Number(c.setup_fee) || 0;
        if (!amount) return Response.json({ error: 'No setup fee is configured for this license.' }, { status: 422 });
        purpose = 'license_setup';
        refId = c.id;
        refLabel = c.company;
        description = 'Software license setup fee - ' + c.company;
        customerEmail = c.email || '';
      } else {
        return Response.json({ error: 'Unknown payment kind.' }, { status: 400 });
      }
      const order = await paypal('/v2/checkout/orders', 'POST', {
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: CURRENCY, value: amount.toFixed(2) },
          description: description.slice(0, 127),
          custom_id: (purpose + ':' + refId).slice(0, 127),
        }],
        application_context: { shipping_preference: 'NO_SHIPPING' },
      });
      await srole.entities.PaypalTransaction.create({
        kind: 'order',
        purpose,
        ref_id: refId,
        ref_label: refLabel,
        customer_email: customerEmail,
        amount,
        currency: CURRENCY,
        paypal_order_id: order.id,
        status: 'created',
      });
      return Response.json({ orderId: order.id, amount });
    }

    if (action === 'capture') {
      const orderId = String(body.order_id || '').trim();
      if (!orderId) return Response.json({ error: 'Missing order.' }, { status: 400 });
      const cap = await paypal('/v2/checkout/orders/' + orderId + '/capture', 'POST');
      const payerEmail = (cap.payer && cap.payer.email_address) || '';
      const { items } = await srole.entities.PaypalTransaction.filter({ paypal_order_id: orderId }, { limit: 1 });
      if (items && items.length) {
        await srole.entities.PaypalTransaction.update(items[0].id, { status: 'paid', paypal_payer_email: payerEmail });
        if (items[0].purpose === 'license_setup' && items[0].ref_id) {
          const lic = await srole.entities.SoftwareLicense.get(items[0].ref_id).catch(() => null);
          if (lic && lic.id && lic.status === 'provisioning') {
            await srole.entities.SoftwareLicense.update(lic.id, { status: 'setup_paid' });
          }
        }
      }
      return Response.json({ status: cap.status, payerEmail });
    }

    if (action === 'create_subscription') {
      const payToken = String(body.pay_token || '').trim();
      if (!payToken) return Response.json({ error: 'Missing payment token.' }, { status: 400 });
      const isLicense = body.target === 'license';
      const annual = body.billing_cycle === 'annual';
      const entity = isLicense ? srole.entities.SoftwareLicense : srole.entities.WhiteLabelClient;
      const purpose = isLicense ? 'license_subscription' : 'white_label_subscription';
      const payReturn = isLicense ? '/software-pay?pay=' : '/white-label-pay?pay=';
      const { items } = await entity.filter({ pay_token: payToken }, { limit: 1 });
      if (!items || !items.length) return Response.json({ error: 'This payment link is not valid.' }, { status: 404 });
      const c = items[0];
      const monthly = Number(c.monthly_fee) || 0;
      if (!monthly) return Response.json({ error: 'No monthly fee is configured.' }, { status: 422 });
      // Annual = 10x the monthly rate (2 months free), billed once per year
      const billAmount = annual ? Math.round(monthly * 10 * 100) / 100 : monthly;
      let planId = annual ? (c.paypal_annual_plan_id || '') : (c.paypal_plan_id || '');
      if (!planId) {
        const product = await paypal('/v1/catalogs/products', 'POST', {
          name: ('Same Day Recycling - ' + c.company).slice(0, 127),
          type: 'SERVICE',
          description: isLicense ? 'Software license subscription' : 'White-label service',
        });
        const plan = await paypal('/v1/billing/plans', 'POST', {
          product_id: product.id,
          name: annual ? 'Annual plan (2 months free)' : 'Monthly plan',
          billing_cycles: [{
            frequency: { interval_unit: annual ? 'YEAR' : 'MONTH', interval_count: 1 },
            tenure_type: 'REGULAR',
            sequence: 1,
            pricing_scheme: { fixed_price: { value: billAmount.toFixed(2), currency_code: CURRENCY } },
          }],
          payment_preferences: { auto_bill_outstanding: true },
        });
        planId = plan.id;
        await entity.update(c.id, annual ? { paypal_annual_plan_id: planId, billing_cycle: 'annual' } : { paypal_plan_id: planId, billing_cycle: 'monthly' });
      }
      const origin = appOrigin(req);
      const sub = await paypal('/v1/billing/subscriptions', 'POST', {
        plan_id: planId,
        custom_id: c.id,
        application_context: {
          brand_name: 'Same Day Recycling',
          locale: 'en-CA',
          user_action: 'SUBSCRIBE_NOW',
          shipping_preference: 'NO_SHIPPING',
          return_url: origin + payReturn + payToken,
          cancel_url: origin + payReturn + payToken + '&cancelled=1',
        },
      });
      const approve = (sub.links || []).find((l) => l.rel === 'approve');
      await srole.entities.PaypalTransaction.create({
        kind: 'subscription',
        purpose,
        ref_id: c.id,
        ref_label: c.company,
        customer_email: c.email || '',
        amount: billAmount,
        currency: CURRENCY,
        paypal_subscription_id: sub.id,
        status: 'created',
      });
      return Response.json({ approve_url: approve ? approve.href : null, subscription_id: sub.id });
    }

    if (action === 'verify_subscription') {
      const subId = String(body.subscription_id || '').trim();
      if (!subId) return Response.json({ error: 'Missing subscription.' }, { status: 400 });
      const sub = await paypal('/v1/billing/subscriptions/' + subId);
      const status = (sub.status || '').toUpperCase();
      const { items } = await srole.entities.PaypalTransaction.filter({ paypal_subscription_id: subId }, { limit: 1 });
      if ((status === 'ACTIVE' || status === 'APPROVED') && items && items.length) {
        await srole.entities.PaypalTransaction.update(items[0].id, {
          status: 'active',
          paypal_payer_email: (sub.subscriber && sub.subscriber.email_address) || '',
        });
        if (items[0].ref_id) {
          if (items[0].purpose === 'license_subscription') {
            const lic = await srole.entities.SoftwareLicense.get(items[0].ref_id).catch(() => null);
            if (lic && lic.id && lic.status !== 'cancelled') {
              const today = new Date().toISOString().slice(0, 10);
              await srole.entities.SoftwareLicense.update(lic.id, {
                status: 'active',
                paypal_subscription_id: subId,
                started_date: lic.started_date || today,
                provisioned_date: today,
              });
              try {
                await srole.users.inviteUser(lic.email, 'user');
              } catch (e) {
                await srole.entities.SoftwareLicense.update(lic.id, { notes: ('Account invite: ' + (e.message || 'failed')).slice(0, 1000) });
              }
            }
          } else {
            await srole.entities.WhiteLabelClient.update(items[0].ref_id, { status: 'active' });
          }
        }
        return Response.json({ status: 'active' });
      }
      return Response.json({ status: status.toLowerCase() });
    }

    if (action === 'cancel_subscription') {
      const user = await base44.auth.me();
      if (!user || user.role !== 'admin') return Response.json({ error: 'Admins only.' }, { status: 403 });
      const subId = String(body.subscription_id || '').trim();
      if (!subId) return Response.json({ error: 'Missing subscription.' }, { status: 400 });
      await paypal('/v1/billing/subscriptions/' + subId + '/cancel', 'POST', { reason: 'NOT_AGREED' });
      const { items } = await srole.entities.PaypalTransaction.filter({ paypal_subscription_id: subId }, { limit: 1 });
      if (items && items.length) {
        await srole.entities.PaypalTransaction.update(items[0].id, { status: 'cancelled' });
        if (items[0].purpose === 'license_subscription' && items[0].ref_id) {
          await srole.entities.SoftwareLicense.update(items[0].ref_id, { status: 'cancelled' }).catch(() => {});
        } else if (items[0].ref_id) {
          await srole.entities.WhiteLabelClient.update(items[0].ref_id, { status: 'churned' }).catch(() => {});
        }
      }
      return Response.json({ ok: true });
    }

    return Response.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}