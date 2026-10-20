import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const DATA_API = 'https://analyticsdata.googleapis.com/v1beta';
const ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';

async function runRealtimeReport(accessToken, propertyId, body) {
  const res = await fetch(`${DATA_API}/${propertyId}:runRealtimeReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data.error && data.error.message) || `GA realtime report failed (${res.status})`);
  }
  return data;
}

// Admin-only: Google Analytics 4 Realtime overview (last 30 minutes).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('google_analytics');

    let payload = {};
    try { payload = await req.json(); } catch {}
    let propertyId = String(payload.propertyId || '').trim();

    if (!propertyId) {
      const sumRes = await fetch(`${ADMIN_API}/accountSummaries?pageSize=200`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        const properties = (sumData.accountSummaries || []).flatMap((a) =>
          (a.propertySummaries || []).map((p) => ({ id: p.property, displayName: p.displayName }))
        );
        const match = properties.find((p) => /recycling/i.test(p.displayName || ''));
        if (match) propertyId = match.id;
        else if (properties.length) propertyId = properties[0].id;
      }
    }
    if (!propertyId) {
      return Response.json({ error: 'No GA4 properties found on the connected Google account' }, { status: 404 });
    }

    const fmt = (r) => (r.rows || []).map((row) => ({
      values: (row.metricValues || []).map((v) => Number(v.value)),
      dim: (row.dimensionValues || []).map((d) => d.value),
    }));

    const total = await runRealtimeReport(accessToken, propertyId, {
      metrics: [{ name: 'activeUsers' }],
      limit: 1,
    });

    const perMinute = await runRealtimeReport(accessToken, propertyId, {
      dimensions: [{ name: 'minutesAgo' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 30,
    });

    const devices = await runRealtimeReport(accessToken, propertyId, {
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 5,
    });

    const countries = await runRealtimeReport(accessToken, propertyId, {
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    });

    // Active pages: which URLs visitors are on right now.
    let pages = null;
    let pagesError = '';
    try {
      pages = await runRealtimeReport(accessToken, propertyId, {
        dimensions: [{ name: 'unifiedPagePathScreen' }],
        metrics: [{ name: 'activeUsers' }],
        orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
        limit: 8,
      });
    } catch {
      // Some GA4 properties only expose the screen-name realtime dimension.
      try {
        pages = await runRealtimeReport(accessToken, propertyId, {
          dimensions: [{ name: 'unifiedScreenName' }],
          metrics: [{ name: 'activeUsers' }],
          orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
          limit: 8,
        });
      } catch (e) {
        pagesError = e.message;
      }
    }

    // Build a full 30-minute series (minutesAgo 29 -> 0), filling gaps with 0.
    const byMinute = new Map(fmt(perMinute).map((r) => [Number(r.dim[0]), r.values[0]]));
    const series = [];
    for (let m = 29; m >= 0; m--) {
      series.push({ minutes_ago: m, users: byMinute.get(m) || 0 });
    }

    const t = total.rows && total.rows[0] ? Number(total.rows[0].metricValues[0].value) : 0;

    return Response.json({
      propertyId,
      users_30min: t,
      per_minute: series,
      devices: fmt(devices).map((r) => ({ device: r.dim[0], users: r.values[0] })),
      countries: fmt(countries).map((r) => ({ country: r.dim[0], users: r.values[0] })),
      pages: pages ? fmt(pages).map((r) => ({ path: r.dim[0] || '(not set)', viewers: r.values[0] })) : [],
      pages_error: pagesError,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}