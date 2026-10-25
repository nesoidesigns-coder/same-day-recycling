import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { isTestPartner } from '../../shared/coverageStatus.ts';

// Canada's Recycling Pulse: public, aggregated operational metrics.
// Every value is computed from real platform records. Excluded by design:
// internal-test fixtures (record_type = "internal_test"), internal test
// contractors (isTestPartner), and cancelled jobs never count as confirmed.
// Website visits, Google impressions and clicks are never substitutes for
// service inquiries. Only aggregates are returned - no customer or
// contractor personal data ever leaves this function.

const CONFIRMED = ['confirmed', 'contacted', 'scheduled', 'completed'];

const METRIC_KEYS = [
  'service_inquiries',
  'unique_customers',
  'pickup_requests',
  'confirmed_bookings',
  'completed_pickups',
  'available_contractors',
  'verified_service_areas',
];

const count = (rows, fn) => rows.filter(fn).length;

const customerKey = (r) => {
  const phone = String(r.phone || '').replace(/\D/g, '');
  const email = String(r.email || '').toLowerCase().trim();
  if (phone.length >= 10) return 'p' + phone.slice(-10);
  if (email) return 'e' + email;
  return '';
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    const body = await req.json().catch(() => ({}));
    const period = ['today', '7d', '30d'].includes(body?.period) ? body.period : '30d';

    const now = Date.now();
    const dayMs = 86400000;
    let startMs;
    if (period === 'today') {
      startMs = Date.parse(new Date(now).toISOString().slice(0, 10) + 'T00:00:00Z');
    } else {
      startMs = now - (period === '7d' ? 7 : 30) * dayMs;
    }
    const prevStartMs = startMs - (now - startMs);
    const startIso = new Date(startMs).toISOString();
    const prevStartIso = new Date(prevStartMs).toISOString();

    // Anonymous visitors read this dashboard: reads run at service role and
    // return aggregates only. Settings drive visibility and capacity targets.
    const [quoteLeadsPage, requestsPage, requestsTestPage, bookingsPage, partnersPage, settingsList, userResult] =
      await Promise.allSettled([
        base44.asServiceRole.entities.QuoteLead.list({ limit: 500 }),
        base44.asServiceRole.entities.NationalRequest.list({ limit: 500 }),
        base44.asServiceRole.entities.NationalRequest.filter({ record_type: 'internal_test' }, { limit: 500 }),
        base44.asServiceRole.entities.Booking.list({ limit: 500 }),
        base44.asServiceRole.entities.Partner.list({ limit: 500 }),
        base44.asServiceRole.entities.PublicMetricSettings.list({ limit: 1 }),
        base44.auth.me().catch(() => null),
      ]);

    console.log('[publicPulse] pages:', quoteLeadsPage.status, requestsPage.status, requestsTestPage.status, bookingsPage.status, partnersPage.status, settingsList.status);
    if (requestsPage.status === 'rejected') console.log('[publicPulse] requests rejected:', String(requestsPage.reason));
    if (bookingsPage.status === 'rejected') console.log('[publicPulse] bookings rejected:', String(bookingsPage.reason));
    if (partnersPage.status === 'rejected') console.log('[publicPulse] partners rejected:', String(partnersPage.reason));
    const items = (p) => (Array.isArray(p) ? p : p?.items) || [];
    const quoteLeads = items(quoteLeadsPage);
    const serviceRequests = items(requestsPage);
    const testRequests = items(requestsTestPage);
    const allBookings = items(bookingsPage);
    const partners = items(partnersPage);

    let settings = items(settingsList)[0] || null;
    if (!settings) {
      try {
        settings = await base44.asServiceRole.entities.PublicMetricSettings.create({
          metrics_enabled: {},
          targets: {},
          notes: 'Created automatically with defaults: every metric visible, no capacity targets set.',
        });
      } catch (e) {
        settings = null;
      }
    }
    const enabledMap = settings?.metrics_enabled || {};
    const targets = settings?.targets || {};
    const isDisabled = (key) => enabledMap[key] === false;

    // Service inquiries: customer-initiated requests for service - quote
    // calculator leads plus nationwide service requests. Test fixtures and
    // cancelled-intake noise are excluded by the record_type filter itself.
    const inq = (rows) => rows.filter((r) => r.record_type !== 'internal_test');
    const allInquiries = [...quoteLeads, ...inq(serviceRequests)];
    const curInquiries = allInquiries.filter((r) => new Date(r.created_date).getTime() >= startMs);
    const prevInquiries = allInquiries.filter((r) => new Date(r.created_date).getTime() < startMs);

    // Pickup requests / bookings: operational bookings only (never fixtures).
    const serviceBookings = allBookings.filter((b) => b.record_type === 'service');
    const curBookings = serviceBookings.filter((b) => new Date(b.created_date).getTime() >= startMs);
    const prevBookings = serviceBookings.filter((b) => new Date(b.created_date).getTime() < startMs);

    const uniqueIn = (rows) => {
      const seen = new Set();
      for (const r of rows) {
        const k = customerKey(r);
        if (k) seen.add(k);
      }
      return seen.size;
    };
    const curAll = [...curInquiries, ...curBookings];
    const prevAll = [...prevInquiries, ...prevBookings];

    const activePartners = partners.filter((p) => p.active === true && !isTestPartner(p));
    const verifiedAreas = new Set(
      activePartners.filter((p) => p.verified === true).map((p) => String(p.city || '').trim()).filter(Boolean),
    );

    // Contractor capacity is point-in-time, not period-based; the previous
    // window is unavailable for it, so no trend is offered.
    const metrics = {
      service_inquiries: { value: curInquiries.length, prev: prevInquiries.length },
      unique_customers: { value: uniqueIn(curAll), prev: uniqueIn(prevAll) },
      pickup_requests: { value: curBookings.length, prev: prevBookings.length },
      confirmed_bookings: {
        value: count(curBookings, (b) => CONFIRMED.includes(b.status)),
        prev: count(prevBookings, (b) => CONFIRMED.includes(b.status)),
      },
      completed_pickups: {
        value: count(curBookings, (b) => b.status === 'completed'),
        prev: count(prevBookings, (b) => b.status === 'completed'),
      },
      available_contractors: { value: activePartners.length, prev: null },
      verified_service_areas: { value: verifiedAreas.size, prev: null },
    };

    const out = {};
    for (const key of METRIC_KEYS) {
      const m = metrics[key];
      if (!m) {
        out[key] = { value: null, prev: null, available: false };
        continue;
      }
      out[key] = {
        value: m.value,
        prev: m.prev,
        available: m.value !== null && m.value !== undefined,
        target: ['available_contractors', 'verified_service_areas'].includes(key)
          ? (Number(targets[key]) || null)
          : null,
        disabled: isDisabled(key),
      };
    }

    const response = {
      period,
      window: { start: startIso, end: new Date(now).toISOString() },
      refreshed_at: new Date(now).toISOString(),
      metrics: out,
    };

    // Audit block for the System Administration panel: what was excluded and
    // from which sources each metric was computed. Admins only.
    let user = null;
    if (userResult.status === 'fulfilled') user = userResult.value;
    if (user && user.role === 'admin') {
      const testBookings = allBookings.filter((b) => b.record_type === 'internal_test');
      const testPartners = partners.filter((p) => isTestPartner(p));
      response.audit = {
        sources: {
          service_inquiries: 'QuoteLead records + NationalRequest records (record_type = service).',
          unique_customers: 'Distinct normalized phone/email across service inquiries and service bookings in the period.',
          pickup_requests: 'Booking records created in the period (record_type = service).',
          confirmed_bookings: 'Service bookings with status confirmed / contacted / scheduled / completed.',
          completed_pickups: 'Service bookings with status completed.',
          available_contractors: 'Partner records with active = true, excluding internal test contractors.',
          verified_service_areas: 'Distinct cities with at least one active, verified, non-test contractor.',
        },
        excluded: {
          internal_test_national_requests: testRequests.length,
          internal_test_bookings: testBookings.length,
          internal_test_partners: testPartners.length,
          cancelled_service_bookings: count(serviceBookings, (b) => b.status === 'cancelled'),
        },
        totals_all_time: {
          service_inquiries: allInquiries.length,
          pickup_requests: serviceBookings.length,
          available_contractors: activePartners.length,
        },
        targets_active: targets,
        note: 'Verified totals come only from operational records. Visibility toggles and capacity targets are set in Public Metrics; totals themselves cannot be edited.',
      };
    }

    return Response.json(response);
  } catch (error) {
    return Response.json({ error: error.message, metrics: null }, { status: 500 });
  }
}