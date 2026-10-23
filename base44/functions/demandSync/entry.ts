import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { dedupeObservations, summarizeDemand, currentPeriod } from '../../shared/demand.ts';
import { isTestPartner } from '../../shared/coverageStatus.ts';
import { secrets } from 'base44:runtime';

const fmtDate = (d) => d.toISOString().slice(0, 10);

// Admin-only: refreshes every supported demand source according to each
// provider's actual cadence, records per-source status in DemandSyncLog, and
// publishes a verified capture snapshot. Sources with no authorized
// connection (Keyword Planner, Google Trends) are logged as 'unavailable' —
// never silently omitted, never fabricated.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const svc = base44.asServiceRole;
    const now = new Date();
    const started = now.toISOString();
    const today = fmtDate(now);
    const GSC_CADENCE = 'Daily (Search Console reporting lags ~2 days)';
    const GA_CADENCE = 'Daily (GA4 standard processing)';
    const KP_CADENCE = 'Monthly retrieval via Google Ads API (Keyword Planner volumes are monthly estimates)';

    const logs = [];
    const sources = {};

    // ---- Google Search Console (our capture, Canada-filtered, 28 days) ----
    let gsc = null;
    try {
      const { accessToken } = await svc.connectors.getConnection('google_search_console');
      const sitesRes = await fetch('https://www.googleapis.com/webmasters/v3/sites', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!sitesRes.ok) throw new Error(`Sites request failed (${sitesRes.status})`);
      const sitesData = await sitesRes.json();
      const sites = (sitesData.siteEntry || []).map((s) => s.siteUrl);
      const target = sites.find((s) => s.includes('samedayrecycling.ca')) || sites[0];
      if (!target) throw new Error('No verified Search Console property found');

      const end = new Date();
      end.setUTCDate(end.getUTCDate() - 2);
      const start = new Date(end);
      start.setUTCDate(start.getUTCDate() - 27);

      const res = await fetch(
        `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(target)}/searchAnalytics/query`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            startDate: fmtDate(start),
            endDate: fmtDate(end),
            dimensions: ['country'],
            dimensionFilters: [{ dimension: 'country', operator: 'equals', expression: 'CAN' }],
            rowLimit: 1,
          }),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!res.ok) throw new Error(`Search Analytics request failed (${res.status})`);
      const data = await res.json();
      const row = (data.rows || [])[0];
      gsc = {
        impressions: Math.round(row?.impressions || 0),
        clicks: Math.round(row?.clicks || 0),
        ctr: row ? Math.round((row.ctr || 0) * 1000) / 10 : 0,
        position: row ? Math.round((row.position || 0) * 10) / 10 : 0,
        window: `${fmtDate(start)} to ${fmtDate(end)}`,
        country_filter: 'CAN',
      };
      sources.google_search_console = { status: 'success', note: `Canada-filtered, ${gsc.window}` };
      logs.push({ source: 'google_search_console', status: 'success', run_date: today, started_at: started, records_upserted: 1, period: '28d', coverage_note: `Impressions ${gsc.impressions}, clicks ${gsc.clicks} across Canada (${gsc.window}).`, next_update_cadence: GSC_CADENCE });
    } catch (e) {
      sources.google_search_console = { status: 'failed', note: e.message };
      logs.push({ source: 'google_search_console', status: 'failed', run_date: today, started_at: started, error: e.message, next_update_cadence: GSC_CADENCE });
    }

    // ---- Google Analytics (engagement, 28 days) ----
    let ga = null;
    try {
      const { accessToken } = await svc.connectors.getConnection('google_analytics');
      const sumRes = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200', {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      let propertyId = '';
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        const props = (sumData.accountSummaries || []).flatMap((a) =>
          (a.propertySummaries || []).map((p) => ({ id: p.property, displayName: p.displayName }))
        );
        const match = props.find((p) => /recycling/i.test(p.displayName || ''));
        propertyId = (match || props[0] || {}).id || '';
      }
      if (!propertyId) throw new Error('No GA4 property found on the connected Google account');
      const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/${propertyId}:runReport`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
          metrics: [{ name: 'sessions' }, { name: 'activeUsers' }, { name: 'engagementRate' }],
        }),
        signal: AbortSignal.timeout(15000),
      });
      const data = await res.json();
      if (!res.ok) throw new Error((data.error && data.error.message) || `GA report failed (${res.status})`);
      const t = data.rows?.[0]?.metricValues?.map((v) => Number(v.value)) || [0, 0, 0];
      ga = {
        property_id: propertyId,
        sessions: t[0] || 0,
        users: t[1] || 0,
        engagement_rate: Math.round((t[2] || 0) * 1000) / 10,
        window: '28daysAgo to today',
      };
      sources.google_analytics = { status: 'success', note: `Property ${propertyId}, last 28 days` };
      logs.push({ source: 'google_analytics', status: 'success', run_date: today, started_at: started, records_upserted: 1, period: '28d', coverage_note: `Sessions ${ga.sessions}, users ${ga.users}.`, next_update_cadence: GA_CADENCE });
    } catch (e) {
      sources.google_analytics = { status: 'failed', note: e.message };
      logs.push({ source: 'google_analytics', status: 'failed', run_date: today, started_at: started, error: e.message, next_update_cadence: GA_CADENCE });
    }

    // ---- Keyword Planner / Trends ----
    const KP_REQUIRED = [
      'GOOGLE_ADS_DEVELOPER_TOKEN', 'GOOGLE_ADS_CUSTOMER_ID', 'GOOGLE_ADS_CLIENT_ID',
      'GOOGLE_ADS_CLIENT_SECRET', 'GOOGLE_ADS_REFRESH_TOKEN',
    ];
    const kpMissing = KP_REQUIRED.filter((n) => !secrets.get(n));
    sources.google_ads_keyword_planner = kpMissing.length === 0
      ? { status: 'skipped', note: 'Google Ads credentials on file; volumes are retrieved monthly by the Keyword Planner Refresh (or on demand in Source Health).' }
      : { status: 'unavailable', note: `Google Ads credentials missing: ${kpMissing.join(', ')}. Verified Keyword Planner exports can also be imported in Market Intelligence > Import Data.` };
    sources.google_trends = {
      status: 'unavailable',
      note: 'Google Trends provides sampled relative-interest indices only. The official API is in a limited alpha (application-based access); until granted, indices come from CSV exports imported in Market Intelligence > Import Data — never presented as search counts.',
    };
    logs.push(
      { source: 'google_ads_keyword_planner', status: kpMissing.length === 0 ? 'skipped' : 'unavailable', run_date: today, started_at: started, coverage_note: kpMissing.length === 0 ? 'Google Ads credentials on file; the monthly Keyword Planner Refresh retrieves volumes.' : `No authorized Google Ads connection (missing: ${kpMissing.join(', ')}).`, next_update_cadence: KP_CADENCE },
      { source: 'google_trends', status: 'unavailable', run_date: today, started_at: started, coverage_note: 'API in limited alpha; sampled indices are imported from CSV exports with their comparison window.', next_update_cadence: 'Manual (export import)' }
    );

    // ---- Recycling OS verified operational records ----
    const [nrCount, bookingCount, completedCount] = await Promise.all([
      svc.entities.NationalRequest.count({ record_type: 'service' }),
      svc.entities.Booking.count({ record_type: 'service' }),
      svc.entities.Booking.count({ record_type: 'service', status: 'completed' }),
    ]);
    const recyclingOs = {
      verified_inquiries: (nrCount || 0) + (bookingCount || 0),
      completed_pickups: completedCount || 0,
    };
    sources.recycling_os = { status: 'success', note: 'Verified service inquiries and completed pickups (internal test records excluded).' };
    logs.push({ source: 'recycling_os', status: 'success', run_date: today, started_at: started, records_upserted: 1, period: 'all-time', coverage_note: `${recyclingOs.verified_inquiries} verified inquiries, ${recyclingOs.completed_pickups} completed pickups.`, next_update_cadence: 'Live (platform records)' });

    // ---- Publish the snapshot ----
    const old = await svc.entities.DemandSnapshot.list({ limit: 100 });
    if (old.items?.length) {
      await svc.entities.DemandSnapshot.deleteMany({ id: { $in: old.items.map((s) => s.id) } });
    }
    await svc.entities.DemandSnapshot.create({
      capture: { gsc, ga, recycling_os: recyclingOs },
      refreshed_at: now.toISOString(),
      sources,
    });

    // ---- Log everything ----
    await svc.entities.DemandSyncLog.bulkCreate(logs);

    // Include the current industry summary for the admin panel.
    const obsPage = await svc.entities.DemandObservation.list({ limit: 500 });
    const industry = summarizeDemand(dedupeObservations(obsPage.items || []));

    return Response.json({
      ok: true,
      refreshed_at: now.toISOString(),
      sources,
      industry,
      period: currentPeriod(now),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}