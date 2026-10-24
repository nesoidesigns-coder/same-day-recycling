import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { SESSION_FILTER } from '../../shared/analytics.ts';

// Marketing Command Center — contractor funnel, marketing costs and software
// revenue, computed ONLY from real records. Bots, owner testing and
// unclassified traffic never enter the funnel. Nothing here is estimated;
// projections live in their own clearly-labelled panels elsewhere.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const days = [7, 30, 90].includes(Number(body?.days)) ? Number(body.days) : 30;
    const now = Date.now();
    const dayMs = 86400000;
    const startMs = now - days * dayMs;
    const startIso = new Date(startMs).toISOString();
    const prevStartIso = new Date(now - 2 * days * dayMs).toISOString();
    const inCur = (iso) => new Date(iso || 0).getTime() >= startMs;
    const items = (p) => (Array.isArray(p) ? p : p?.items) || [];
    const inWin = (rows, cur) => rows.filter((r) => (cur ? inCur(r.created_date) : !inCur(r.created_date)));
    const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : null);
    const jobValue = (b) => Number(b.final_invoice) || Number(b.job_value) || 0;

    const [appsPage, subsPage, inquiriesPage, licensesPage, partnersPage, bookingsPage, mktCurAgg, mktPrevAgg] = await Promise.all([
      base44.entities.ContractorApplication.filter({ created_date: { $gte: prevStartIso } }, { limit: 500 }),
      base44.entities.Subscription.filter({ created_date: { $gte: prevStartIso } }, { limit: 500 }),
      base44.entities.SoftwareInquiry.filter({ created_date: { $gte: prevStartIso } }, { limit: 500 }),
      base44.entities.SoftwareLicense.list({ limit: 200 }),
      base44.entities.Partner.filter({}, { limit: 500 }),
      base44.entities.Booking.filter({ record_type: 'service', created_date: { $gte: prevStartIso } }, { limit: 500 }),
      base44.entities.FinancialTx.aggregate({ query: { category: 'marketing', kind: 'expense', owner_type: 'sdr_admin', created_date: { $gte: startIso } }, groupBy: 'category', sum: ['amount'] }),
      base44.entities.FinancialTx.aggregate({ query: { category: 'marketing', kind: 'expense', owner_type: 'sdr_admin', created_date: { $gte: prevStartIso, $lt: startIso } }, groupBy: 'category', sum: ['amount'] }),
    ]);

    const apps = items(appsPage);
    const subs = items(subsPage);
    const inquiries = items(inquiriesPage);
    const licenses = items(licensesPage);
    const partners = items(partnersPage);
    const bookings = items(bookingsPage);

    // Contractor discovery: paginated human contractor visits, distinct
    // browser sessions (sid) as the denominator — same definition as the
    // consumer funnel so the two are comparable.
    const contractorRows = [];
    let cursor;
    for (let i = 0; i < 8; i++) {
      const page = await base44.entities.Visit.filter(
        { created_date: { $gte: prevStartIso }, traffic_class: 'contractor', ...SESSION_FILTER },
        cursor ? { sort: '-created_date', limit: 500, cursor } : { sort: '-created_date', limit: 500 });
      contractorRows.push(...items(page));
      cursor = page?.next_cursor;
      if (!page?.has_more || !cursor) break;
    }
    const sessionsCur = new Set(contractorRows.filter((v) => inCur(v.created_date)).map((v) => v.sid)).size;
    const sessionsPrev = new Set(contractorRows.filter((v) => !inCur(v.created_date)).map((v) => v.sid)).size;

    const appsCur = inWin(apps, true);
    const appsPrev = inWin(apps, false);
    const interestCur = inWin(inquiries, true).length + inWin(subs, true).length + inWin(partners, true).length;
    const interestPrev = inWin(inquiries, false).length + inWin(subs, false).length + inWin(partners, false).length;
    const demoCur = inWin(licenses, true).length;
    const demoPrev = inWin(licenses, false).length;

    const verified = partners.filter((p) => p.verified);
    const verifiedCount = verified.length;
    const completedBookings = bookings.filter((b) => b.status === 'completed');
    const completedCur = completedBookings.filter((b) => inCur(b.created_date));
    const completedPrev = completedBookings.filter((b) => !inCur(b.created_date));
    const completedPartnerIds = new Set(completedBookings.map((b) => b.partner_id).filter(Boolean));
    const activated = verified.filter((p) => p.active && completedPartnerIds.has(p.id)).length;
    const prevJobPartnerIds = new Set(completedPrev.map((b) => b.partner_id).filter(Boolean));
    const curJobPartnerIds = new Set(completedCur.map((b) => b.partner_id).filter(Boolean));
    const retained = verified.filter((p) => p.active && prevJobPartnerIds.has(p.id) && curJobPartnerIds.has(p.id)).length;

    const appsByStatus = { new: 0, ai_reviewed: 0, approved: 0, declined: 0 };
    for (const a of apps) if (a.status in appsByStatus) appsByStatus[a.status] += 1;

    const mktCur = (mktCurAgg?.rows || []).reduce((a, r) => a + (Number(r.sum_amount) || 0), 0);
    const mktPrev = (mktPrevAgg?.rows || []).reduce((a, r) => a + (Number(r.sum_amount) || 0), 0);

    const activeLicenses = licenses.filter((l) => l.status === 'active');
    const recurringMonthly = activeLicenses.reduce(
      (a, l) => a + (l.billing_cycle === 'annual' ? (Number(l.monthly_fee) || 0) / 12 : Number(l.monthly_fee) || 0), 0);
    const setupCollected = licenses
      .filter((l) => l.status !== 'provisioning')
      .reduce((a, l) => a + (Number(l.setup_fee) || 0), 0);

    const avgJobsPerActive = activeLicenses.length || partners.length
      ? Math.round((completedBookings.length / Math.max(1, verified.filter((p) => p.active).length)) * 10) / 10
      : null;

    return Response.json({
      days,
      generated_at: new Date().toISOString(),
      basis: 'All figures are observed from app records. Unclassified and bot traffic never enter the funnel; cancelled and internal-test bookings are excluded from job counts.',
      contractor_funnel: [
        { stage: 'discovery', label: 'Contractor discovery (visitor sessions)', current: sessionsCur, previous: sessionsPrev },
        { stage: 'interest', label: 'Partnership interest (inquiries + memberships + signups)', current: interestCur, previous: interestPrev },
        { stage: 'demo', label: 'Software license / onboarding starts', current: demoCur, previous: demoPrev },
        { stage: 'application', label: 'Contractor applications', current: appsCur.length, previous: appsPrev.length },
        { stage: 'verification', label: 'Verified contractors (roster)', current: verifiedCount, previous: null },
        { stage: 'activation', label: 'Activated (verified + completed job)', current: activated, previous: null },
        { stage: 'jobs', label: 'Completed jobs (window)', current: completedCur.length, previous: completedPrev.length },
        { stage: 'retention', label: 'Repeat contractors (jobs in both windows)', current: retained, previous: null },
      ],
      applications_by_status: appsByStatus,
      partners: { total: partners.length, active: partners.filter((p) => p.active).length, verified: verifiedCount, activated },
      jobs: {
        completed_current: completedCur.length,
        completed_previous: completedPrev.length,
        value: completedBookings.reduce((a, b) => a + jobValue(b), 0),
        commission: completedBookings.reduce((a, b) => a + (Number(b.commission_earned) || 0), 0),
      },
      money: {
        marketing_expense_current: Math.round(mktCur * 100) / 100,
        marketing_expense_previous: Math.round(mktPrev * 100) / 100,
        completed_job_value: completedBookings.reduce((a, b) => a + jobValue(b), 0),
        commission_earned: completedBookings.reduce((a, b) => a + (Number(b.commission_earned) || 0), 0),
        software_active_licenses: activeLicenses.length,
        software_recurring_monthly: Math.round(recurringMonthly * 100) / 100,
        software_setup_collected: setupCollected,
      },
      rates: {
        discovery_to_interest_pct: pct(interestCur, sessionsCur),
        interest_to_application_pct: pct(appsCur.length, interestCur),
        application_to_approval_pct: pct(appsByStatus.approved, appsCur.length),
        verification_to_activation_pct: pct(activated, verifiedCount),
        avg_completed_jobs_per_active_contractor: avgJobsPerActive,
      },
      confidence: {
        discovery: sessionsCur >= 30 ? 'medium' : 'low',
        interest_to_application: interestCur >= 30 ? 'medium' : 'low',
        verification_to_activation: verifiedCount >= 10 ? 'medium' : 'low',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}