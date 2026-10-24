import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { buildTrafficReport, loadVisits, loadLeads, loadBookings } from '../../shared/trafficIntel.ts';

// Canonical traffic-intelligence endpoint. Every dashboard reads this report —
// one metric + one date range produces identical totals everywhere. All
// windows are defined in the business time zone (America/Vancouver); rolling
// and calendar windows are reported separately. Historical records are never
// rewritten: gaps are labeled (legacy, unclassified, unattributed).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const [v, l, b] = await Promise.all([loadVisits(base44), loadLeads(base44), loadBookings(base44)]);
    const report = buildTrafficReport(v.rows, l.rows, b.rows);
    report.data_quality.truncated = { visits: v.truncated, quote_leads: l.truncated, bookings: b.truncated };
    report.data_quality.record_counts = { visits: v.rows.length, quote_leads: l.rows.length, bookings: b.rows.length };

    const { compat, ...intelligence } = report;
    // Backward-compatible top-level fields for dashboards built on the
    // previous response shape.
    return Response.json({ ...intelligence, ...compat });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}