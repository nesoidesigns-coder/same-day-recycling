import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const DATA_API = 'https://analyticsdata.googleapis.com/v1beta';
const ADMIN_API = 'https://analyticsadmin.googleapis.com/v1beta';

async function runReport(accessToken, propertyId, body) {
  const res = await fetch(`${DATA_API}/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data.error && data.error.message) || `GA report failed (${res.status})`);
  }
  return data;
}

// Admin-only: pulls live Google Analytics (GA4) traffic data for the site.
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

    let properties = [];
    if (!propertyId) {
      const sumRes = await fetch(`${ADMIN_API}/accountSummaries?pageSize=200`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (sumRes.ok) {
        const sumData = await sumRes.json();
        properties = (sumData.accountSummaries || []).flatMap((a) =>
          (a.propertySummaries || []).map((p) => ({ id: p.property, displayName: p.displayName }))
        );
      }
      if (!properties.length) {
        return Response.json({ error: 'No GA4 properties found on the connected Google account' }, { status: 404 });
      }
      // Prefer the business's own property, else the first available
      const match = properties.find((p) => /recycling/i.test(p.displayName || ''));
      propertyId = (match || properties[0]).id;
    }

    const totals = await runReport(accessToken, propertyId, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'sessions' },
        { name: 'engagementRate' },
      ],
    });

    const daily = await runReport(accessToken, propertyId, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'date' }],
      metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }, { name: 'sessions' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }],
      limit: 40,
    });

    const pages = await runReport(accessToken, propertyId, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'pagePath' }],
      metrics: [{ name: 'screenPageViews' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
      limit: 10,
    });

    const sources = await runReport(accessToken, propertyId, {
      dateRanges: [{ startDate: '28daysAgo', endDate: 'today' }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'sessions' }, { name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }],
      limit: 8,
    });

    const fmtRows = (r) => (r.rows || []).map((row) => ({
      values: (row.metricValues || []).map((v) => v.value),
      dim: (row.dimensionValues || []).map((d) => d.value),
    }));

    const t = totals.rows && totals.rows[0]
      ? totals.rows[0].metricValues.map((v) => Number(v.value))
      : [0, 0, 0, 0];

    return Response.json({
      propertyId,
      properties,
      totals: {
        users: t[0] || 0,
        pageviews: t[1] || 0,
        sessions: t[2] || 0,
        engagement_rate: Math.round((t[3] || 0) * 1000) / 10,
      },
      daily: fmtRows(daily).map((r) => ({
        date: `${r.dim[0].slice(0, 4)}-${r.dim[0].slice(4, 6)}-${r.dim[0].slice(6, 8)}`,
        users: Number(r.values[0]),
        pageviews: Number(r.values[1]),
        sessions: Number(r.values[2]),
      })),
      top_pages: fmtRows(pages).map((r) => ({
        path: r.dim[0],
        pageviews: Number(r.values[0]),
        sessions: Number(r.values[1]),
      })),
      sources: fmtRows(sources).map((r) => ({
        channel: r.dim[0],
        sessions: Number(r.values[0]),
        users: Number(r.values[1]),
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}