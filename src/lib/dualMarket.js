import { base44 } from "@/api/base44Client";

// Dual-market business model, computed from recorded values only.
//
// Market A — Service customers: people and organisations buying removal work.
// Market B — Contractor customers: operators buying the platform (licences,
//            memberships, activation) and/or delivering the work.
//
// Revenue definitions (deliberately non-overlapping):
//   grossJobValue   the customer's full job price — the contractor's money,
//                   not the platform's. Never added to platform revenue.
//   commission      what the platform retains from a job. Realised revenue.
//   activationFees  one-off setup fees collected on licences. Realised revenue.
//   mrr             monthly licence value of subscriptions currently active.
//                   A run-rate, not cash received — reported separately.
// A contractor may appear in both markets: the Partner record is the single
// identity, and licence revenue is matched by email — never counted twice.

const SERVICE = "service";
const isLive = (r) => (r.record_type || SERVICE) !== "internal_test";

const sum = (rows, pick) => rows.reduce((t, r) => t + (Number(pick(r)) || 0), 0);
const money = (n) => Math.round((Number(n) || 0) * 100) / 100;
const normEmail = (e) => String(e || "").trim().toLowerCase();

export async function loadDualMarket() {
  const [bookingPage, licencePage, partners, applications, nationalPage, subscriptionPage] = await Promise.all([
    base44.entities.Booking.filter({}, { sort: "-created_date", limit: 500 }),
    base44.entities.SoftwareLicense.list({ sort: "-created_date", limit: 200 }),
    base44.entities.Partner.filter({}, { limit: 300 }),
    base44.entities.ContractorApplication.count({}),
    base44.entities.NationalRequest.filter({}, { sort: "-created_date", limit: 300 }),
    base44.entities.Subscription.list({ sort: "-created_date", limit: 200 }),
  ]);

  return buildDualMarket({
    bookings: bookingPage.items || [],
    licences: licencePage.items || [],
    partners: partners.items || [],
    applications: Number(applications) || 0,
    national: nationalPage.items || [],
    subscriptions: subscriptionPage.items || [],
  });
}

export function buildDualMarket({ bookings, licences, partners, applications, national, subscriptions }) {
  // ---------- Market A: service customers ----------
  const allBookings = bookings || [];
  const liveJobs = allBookings.filter(isLive);
  const testRecords = allBookings.length - liveJobs.length;
  const liveNational = (national || []).filter(isLive);
  const completed = liveJobs.filter((j) => j.status === "completed");
  const cancelled = liveJobs.filter((j) => j.status === "cancelled");
  const activeJobs = liveJobs.filter((j) => ["new", "confirmed", "contacted", "scheduled"].includes(j.status || "new"));
  const openAge = (j) => (Date.now() - new Date(j.created_date || Date.now()).getTime()) / 86400000;
  const unassigned = activeJobs.filter((j) => ["unassigned", "declined", undefined, null, ""].includes(j.assignment_status));

  // Every inbound request captured in the system: a service request, or a
  // booking created directly by the customer. Conversion is bookings against
  // that total, so a job is never counted as its own inquiry twice.
  const qualifiedInquiries = liveNational.filter((r) => r.status !== "cancelled").length + liveJobs.length;

  const jobPrice = (j) => Number(j.final_invoice) || Number(j.approved_quote_amount) || Number(j.job_value) || 0;
  const grossJobValue = sum(completed, jobPrice);
  const commissionEarned = sum(completed, (j) => j.commission_earned);

  // Recurring business pickup plans (property managers, offices) — Market A
  // repeat purchasing, kept separate from contractor licence revenue.
  const businessPlans = (subscriptions || []).filter((s) => s.status === "active");
  const service = {
    qualifiedInquiries,
    requests: liveNational.length,
    bookings: liveJobs.length,
    activeJobs: activeJobs.length,
    completedJobs: completed.length,
    cancelledJobs: cancelled.length,
    grossJobValue: money(grossJobValue),
    commissionEarned: money(commissionEarned),
    conversionRate: liveJobs.length > 0 ? Math.round((liveJobs.length / Math.max(qualifiedInquiries, 1)) * 100) : null,
    unmatchedRequests: unassigned.length + liveNational.filter((r) => (r.dispatch_status || "awaiting_contractor") === "awaiting_contractor").length,
    cities: [...new Set(liveJobs.map((j) => j.city).filter(Boolean))],
    testRecordsExcluded: testRecords,
    businessPlans: businessPlans.length,
    // Explainable flags for missing evidence.
    notes: [
      completed.length === 0 && liveJobs.length > 0 ? "No completed service job yet — gross value and commission are $0 until one closes." : null,
      liveJobs.length === 0 ? "No live service jobs recorded. Test records are excluded from every figure." : null,
      completed.filter((j) => jobPrice(j) === 0).length > 0
        ? `${completed.filter((j) => jobPrice(j) === 0).length} completed job${completed.filter((j) => jobPrice(j) === 0).length === 1 ? " has" : "s have"} no recorded price, so gross value understates the work done.`
        : null,
      completed.length > 0 && commissionEarned === 0 ? "No commission recorded on completed jobs — check the agreement terms for those jobs." : null,
      liveNational.some((r) => !r.quote_amount) ? "Some requests carry no quote amount yet, so job value is unconfirmed." : null,
    ].filter(Boolean),
  };

  // ---------- Market B: contractor customers ----------
  const allLicences = licences || [];
  const paidStatus = ["setup_paid", "active", "provisioning", "cancelled"];
  const payingLicences = allLicences.filter((l) => paidStatus.includes(l.status) && (l.status === "setup_paid" || l.status === "active"));
  const activeLicences = allLicences.filter((l) => l.status === "active");
  const cancelledLicences = allLicences.filter((l) => l.status === "cancelled");
  const mrr = sum(activeLicences, (l) => l.monthly_fee);
  const activationRevenue = sum(
    allLicences.filter((l) => ["setup_paid", "active"].includes(l.status)),
    (l) => l.setup_fee,
  );

  const partnerRows = partners || [];
  const verifiedPartners = partnerRows.filter((p) => p.verified && p.active !== false);
  const contractorEmails = new Set(partnerRows.map((p) => normEmail(p.email)).filter(Boolean));
  const licenceEmails = new Set(allLicences.map((l) => normEmail(l.email)).filter(Boolean));
  const bothMarkets = [...contractorEmails].filter((e) => licenceEmails.has(e)).length;

  const capacity = sum(verifiedPartners, (p) => p.truck_capacity || 1);
  const coverageCities = new Set();
  verifiedPartners.forEach((p) => {
    if (p.city) coverageCities.add(p.city.toLowerCase());
    (p.service_cities || []).forEach((c) => c && coverageCities.add(String(c).toLowerCase()));
  });

  const contractor = {
    accounts: allLicences.length,
    payingAccounts: payingLicences.length,
    activeSubscriptions: activeLicences.length,
    mrr: money(mrr),
    activationRevenue: money(activationRevenue),
    churnRate: allLicences.length ? Math.round((cancelledLicences.length / allLicences.length) * 100) : null,
    cancelled: cancelledLicences.length,
    acquisitionApplications: applications || 0,
    arpc: activeLicences.length ? money(mrr / activeLicences.length) : null,
    contractsOnFile: 0,
    partners: partnerRows.length,
    verifiedPartners: verifiedPartners.length,
    bothMarkets,
    notes: [
      allLicences.length > 0 && activeLicences.length === 0
        ? `${allLicences.length} licence${allLicences.length === 1 ? "" : "s"} on file, none yet on an active monthly subscription — MRR is $0 rather than projected.`
        : null,
      applications === 0 ? "No contractor applications recorded." : null,
      allLicences.length === 0 ? "No software licences recorded." : null,
    ].filter(Boolean),
  };

  // ---------- Combined platform ----------
  // Realised revenue = commission actually earned + activation fees actually
  // collected. MRR is a run-rate and is never added to cash figures.
  const realisedRevenue = money(commissionEarned + activationRevenue);
  const combined = {
    realisedRevenue,
    mrr: money(mrr),
    grossTransactionValue: money(grossJobValue),
    serviceCustomers: new Set(liveJobs.map((j) => normEmail(j.email) || j.name).filter(Boolean)).size,
    organizations: new Set([...contractorEmails, ...licenceEmails]).size,
    coverageCities: coverageCities.size,
    capacity,
    unmatchedRequests: service.unmatchedRequests,
    demandToCapacity:
      capacity > 0 ? `${service.unmatchedRequests} open request${service.unmatchedRequests === 1 ? "" : "s"} against ${capacity} truck${capacity === 1 ? "" : "s"} of verified capacity` : "No verified capacity on file",
  };

  // ---------- Contractor accounts needing attention (explainable only) ----------
  const attention = [];
  allLicences
    .filter((l) => ["provisioning", "setup_paid"].includes(l.status))
    .slice(0, 3)
    .forEach((l) => {
      const days = l.created_date ? Math.round((Date.now() - new Date(l.created_date).getTime()) / 86400000) : null;
      attention.push({
        name: l.company || l.email,
        reason: l.status === "provisioning" ? "Provisioning not completed" : "Activation paid, monthly plan not started",
        detail: days !== null ? `recorded ${days} day${days === 1 ? "" : "s"} ago` : "no date recorded",
        href: "/admin/software",
      });
    });
  verifiedPartners
    .filter((p) => !liveJobs.some((j) => j.partner_id === p.id || (j.partner_name && j.partner_name === p.name)))
    .slice(0, 2)
    .forEach((p) =>
      attention.push({
        name: p.name,
        reason: "Verified contractor with no job assigned",
        detail: `${p.city || "city not set"} · capacity ${p.truck_capacity || 1}`,
        href: "/admin/partners",
      }),
    );
  const staleUnassigned = unassigned.filter((j) => openAge(j) > 2);
  if (staleUnassigned.length) {
    attention.push({
      name: `${staleUnassigned.length} unassigned job${staleUnassigned.length === 1 ? "" : "s"} over 2 days old`,
      reason: "Customer request without a contractor",
      detail: "Check verified capacity in that city",
      href: "/admin/assignments",
    });
  }

  return { service, contractor, combined, attention };
}