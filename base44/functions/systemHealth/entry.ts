import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// Admin-only live system-health snapshot: email delivery, payment config,
// contractor availability, pending requests, dispatch failures and errors.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required.' }, { status: 403 });
    }
    const srole = base44.asServiceRole;

    const safeCount = async (entity, query) => {
      try { return await srole.entities[entity].count(query); } catch { return null; }
    };

    const [
      partners, recruits, pendingApps, awaitingContractor, unableToFulfill,
      txCreated, txPaid, txFailed, txRefunded, unhandledEvents, recentBookings,
    ] = await Promise.all([
      safeCount('Partner', { active: true }),
      safeCount('ProviderRecruit', { verified: true }),
      safeCount('ContractorApplication', { status: 'new' }),
      safeCount('NationalRequest', { dispatch_status: 'awaiting_contractor' }),
      safeCount('NationalRequest', { dispatch_status: 'unable_to_fulfill' }),
      safeCount('PaypalTransaction', { status: 'created' }),
      safeCount('PaypalTransaction', { status: 'paid' }),
      safeCount('PaypalTransaction', { status: 'failed' }),
      safeCount('PaypalTransaction', { status: 'refunded' }),
      safeCount('PaypalWebhookEvent', { handled: false }),
      srole.entities.Booking.filter({}, { sort: '-created_date', limit: 10 }),
    ]);

    const recentBookingsPage = recentBookings || { items: [] };
    const emailSends = (recentBookingsPage.items || []).map((b) => ({
      booking: b.name,
      date: b.created_date,
      owner: (b.notified && b.notified.owner_email) || 'unknown',
      customer: (b.notified && b.notified.customer_email) || 'unknown',
      errors: (b.notified && b.notified.errors) || [],
    }));
    const customerFailures = emailSends.filter((s) => s.customer === 'failed').length;

    let paypalMode = 'unknown', paypalConfigured = false;
    try {
      paypalMode = (await secrets.get('PAYPAL_MODE')) || 'unset';
      const clientId = await secrets.get('PAYPAL_CLIENT_ID');
      paypalConfigured = !!(await secrets.get('PAYPAL_SECRET')) && !!clientId;
    } catch { /* secrets unavailable */ }

    return Response.json({
      payments: {
        mode: paypalMode,
        configured: paypalConfigured,
        transactions: { created: txCreated, paid: txPaid, failed: txFailed, refunded: txRefunded },
        unhandled_webhook_events: unhandledEvents,
      },
      email: {
        engine: 'Built-in Base44 SendEmail (no external credentials)',
        recent_sends: emailSends,
        recent_customer_failures: customerFailures,
      },
      contractors: {
        active_partners: partners,
        verified_recruits: recruits,
        pending_applications: pendingApps,
      },
      dispatch: {
        pending_requests: awaitingContractor,
        failures: unableToFulfill,
      },
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}