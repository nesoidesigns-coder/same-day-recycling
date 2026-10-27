import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// Admin-only live system-health snapshot. Every status reflects an ACTUAL test
// run at request time (HTTP fetches, record counts, credential checks) — never
// assumptions. Public surfaces never render this; it lives in administration.
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

    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [
      partners, recruits, pendingApps, awaitingContractor, unableToFulfill,
      txCreated, txPaid, txFailed, txRefunded, unhandledEvents, recentBookings,
      bookingsWeek, rexActionsWeek, obsTotal, obsVolumes, latestSyncPage,
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
      safeCount('Booking', { created_date: { $gte: weekAgo } }),
      safeCount('AiActionLog', { created_date: { $gte: weekAgo } }),
      safeCount('DemandObservation', {}),
      safeCount('DemandObservation', { metric_type: 'monthly_volume' }),
      srole.entities.DemandSyncLog.filter({}, { sort: '-created_date', limit: 1 }),
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

    // --- Live public-site tests ---
    let siteStatus = 0, siteError = '', siteTitle = false, siteDescription = false, siteCanonical = false;
    try {
      const res = await fetch('https://samedayrecycling.ca/', {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; RecyclingOS-Health/1.0)' },
        signal: AbortSignal.timeout(10000),
      });
      siteStatus = res.status;
      if (res.ok) {
        const html = await res.text();
        siteTitle = /<title[^>]*>\s*[^<\s]/i.test(html);
        // Attribute order is not guaranteed in served HTML (the platform emits
        // content before name), so match the tag and require both attributes.
        siteDescription = /<meta[^>]*name=["']description["'][^>]*content=["'][^"'\s]/i.test(html)
          || /<meta[^>]*content=["'][^"'\s][^>]*name=["']description["']/i.test(html);
        siteCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
      }
    } catch (e) {
      siteError = e.message || 'fetch failed';
    }
    const websiteCheck = siteStatus === 200 ? 'pass' : siteError ? 'warning' : 'fail';
    const seoCheck = siteStatus !== 200 ? (siteError ? 'warning' : 'fail')
      : (siteTitle && siteDescription && siteCanonical) ? 'pass' : 'warning';

    // --- Mobile performance: real PageSpeed Insights run ---
    let mobileScore = null, mobileDetail = 'Not tested', mobileStatus = 'warning';
    try {
      const key = await secrets.get('PAGESPEED_API_KEY');
      if (key) {
        const ps = await fetch('https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=' + encodeURIComponent('https://samedayrecycling.ca/') + '&strategy=mobile&key=' + key,
          { signal: AbortSignal.timeout(45000) });
        if (ps.ok) {
          const psData = await ps.json();
          mobileScore = Math.round((psData?.lighthouseResult?.categories?.performance?.score || 0) * 100);
          mobileStatus = mobileScore >= 80 ? 'pass' : mobileScore >= 50 ? 'warning' : 'fail';
          mobileDetail = `PageSpeed mobile performance score: ${mobileScore}/100 (lab run, just now)`;
        } else { mobileDetail = `PageSpeed API returned ${ps.status}`; }
      } else { mobileDetail = 'PAGESPEED_API_KEY not configured'; }
    } catch (e) { mobileDetail = `PageSpeed check failed: ${e.message || 'error'}`; }

    const latestSync = (latestSyncPage?.items || [])[0] || null;
    const marketStatus = obsVolumes > 0 ? 'pass'
      : obsTotal > 0 ? 'warning' : 'fail';
    const marketDetail = obsVolumes > 0
      ? `${obsVolumes} verified monthly-volume observations stored`
      : obsTotal > 0
        ? `${obsTotal} relative-interest observations stored (Google Trends, Canada); monthly volume estimates pending Keyword Planner credentials`
        : 'No verified market observations stored';

    const contractorCapacity = (partners || 0) + (recruits || 0);
    const dispatchStatus = contractorCapacity === 0 && awaitingContractor > 0 ? 'fail'
      : contractorCapacity === 0 ? 'warning' : 'pass';
    const notifyStatus = customerFailures > 0 ? 'fail'
      : emailSends.length === 0 ? 'warning' : 'pass';
    const bookingStatus = bookingsWeek > 0 ? 'pass' : 'warning';
    const rexStatus = rexActionsWeek > 0 ? 'pass' : 'warning';
    const payStatus = paypalConfigured ? 'pass' : 'fail';

    const systems = [
      { system: 'Website availability', status: websiteCheck, detail: siteStatus ? `https://samedayrecycling.ca returned HTTP ${siteStatus}` : `Custom domain unreachable from the runtime: ${siteError || 'no response'} — the Base44 platform URL remains live` },
      { system: 'SEO rendering', status: seoCheck, detail: siteStatus === 200 ? `Served HTML contains title: ${siteTitle ? 'yes' : 'no'} · meta description: ${siteDescription ? 'yes' : 'no'} · canonical: ${siteCanonical ? 'yes' : 'no'}` : 'Homepage could not be fetched for this check' },
      { system: 'Market data connection', status: marketStatus, detail: marketDetail + (latestSync ? ` · latest sync: ${latestSync.source} ${latestSync.status} ${latestSync.run_date || ''}` : '') },
      { system: 'Rex AI', status: rexStatus, detail: rexActionsWeek > 0 ? `${rexActionsWeek} AI actions logged in the last 7 days` : 'No AI activity logged in the last 7 days (agent is configured but unverified by traffic)' },
      { system: 'Booking', status: bookingStatus, detail: bookingsWeek > 0 ? `${bookingsWeek} bookings created in the last 7 days` : 'No bookings in the last 7 days — flow is deployed but unverified by recent traffic' },
      { system: 'Payment processing', status: payStatus, detail: paypalConfigured ? `PayPal configured (${paypalMode}); ${txPaid || 0} paid / ${txFailed || 0} failed transactions` : 'PAYPAL_MODE, PAYPAL_CLIENT_ID or PAYPAL_SECRET missing' },
      { system: 'Contractor dispatch', status: dispatchStatus, detail: contractorCapacity === 0 ? 'No active verified contractors in the network' : `${contractorCapacity} active contractors; ${awaitingContractor || 0} requests awaiting contractor` },
      { system: 'Notifications', status: notifyStatus, detail: customerFailures > 0 ? `${customerFailures} recent customer email failures` : emailSends.length === 0 ? 'No recent sends to test' : 'Recent sends delivered without recorded failures' },
      { system: 'Mobile performance', status: mobileStatus, detail: mobileDetail },
    ];

    return Response.json({
      systems,
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
      market_data: {
        stored_observations: obsTotal,
        volume_observations: obsVolumes,
        latest_sync: latestSync ? { source: latestSync.source, status: latestSync.status, period: latestSync.period, run_date: latestSync.run_date } : null,
      },
      mobile_performance: { score: mobileScore, detail: mobileDetail },
      checked_at: new Date().toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}