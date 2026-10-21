import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import KpiCard from "@/components/admin/KpiCard";
import RingGauge from "@/components/admin/RingGauge";
import AlertCentre from "@/components/admin/AlertCentre";
import AdminTrendChart from "@/components/admin/AdminTrendChart";
import StatusBar from "@/components/admin/StatusBar";
import CoveragePanel from "@/components/admin/CoveragePanel";
import { Loader2 } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const ACTIVE = ["new", "confirmed", "scheduled"];
const PARTNER_SHARE = 0.75;

export default function AdminOverview() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      const [bookingsPage, partnersPage, quoteNew, approvedReviews, reviewPending, unpaidAgg, paidAgg] = await Promise.all([
        base44.entities.Booking.filter({}, { sort: "-created_date", limit: 500 }),
        base44.entities.Partner.filter({}, {}),
        base44.entities.QuoteLead.count({ status: "new" }),
        base44.entities.Review.filter({ approved: true }, { limit: 100 }),
        base44.entities.Review.count({ approved: false }),
        base44.entities.Booking.aggregate({ query: { assignment_status: "completed", payout_paid: false }, groupBy: "partner_name", sum: ["job_value"] }),
        base44.entities.Booking.aggregate({ query: { assignment_status: "completed", payout_paid: true }, groupBy: "partner_name", sum: ["job_value"] }),
      ]);
      setData({
        bookings: bookingsPage.items || [],
        partners: partnersPage.items || [],
        quoteNew: Number(quoteNew) || 0,
        reviews: approvedReviews.items || [],
        reviewPending: Number(reviewPending) || 0,
        pendingPayouts: (unpaidAgg.rows || []).reduce((s, r) => s + (r.sum_job_value || 0) * PARTNER_SHARE, 0),
        paidPayouts: (paidAgg.rows || []).reduce((s, r) => s + (r.sum_job_value || 0) * PARTNER_SHARE, 0),
      });
    })().catch(() => setFailed(true));
  }, []);

  if (failed) {
    return <p className="rounded-2xl bg-red-50 text-red-700 p-6 font-semibold">Could not load dashboard data. Refresh the page or check System Health.</p>;
  }
  if (!data) {
    return <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-20" />;
  }

  const { bookings, partners, quoteNew, reviews, reviewPending, pendingPayouts, paidPayouts } = data;
  const today = new Date().toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10);
  const twoWeeksAgo = new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10);

  const active = bookings.filter((b) => ACTIVE.includes(b.status || "new"));
  const newBookings = bookings.filter((b) => (b.status || "new") === "new");
  const awaiting = active.filter((b) => ["unassigned", "declined", undefined, null, ""].includes(b.assignment_status));
  const inProgress = active.filter((b) => ["assigned", "accepted"].includes(b.assignment_status));
  const completed = bookings.filter((b) => b.status === "completed");
  const cancelled = bookings.filter((b) => b.status === "cancelled");
  const closed = completed.length + cancelled.length;
  const completionRate = closed > 0 ? Math.round((completed.length / closed) * 100) : null;
  const thisWeek = bookings.filter((b) => (b.created_date || "").slice(0, 10) >= weekAgo).length;
  const prevWeek = bookings.filter((b) => (b.created_date || "").slice(0, 10) >= twoWeeksAgo && (b.created_date || "").slice(0, 10) < weekAgo).length;
  const weekDelta = prevWeek > 0 ? Math.round(((thisWeek - prevWeek) / prevWeek) * 100) : null;
  const activePartners = partners.filter((p) => p.active !== false);
  const rating = reviews.length ? Math.round((reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / reviews.length) * 10) / 10 : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">Operations Overview</h1>
        <p className="text-sm text-slate-500 mt-1">Live network status across all Canadian service cities · all figures from real records</p>
      </div>

      <AlertCentre bookings={bookings} partners={partners} reviewPending={reviewPending} />

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Total bookings" value={bookings.length} sub={`${thisWeek} in the last 7 days`} delta={weekDelta} href="/admin/jobs" />
        <KpiCard label="New leads" value={newBookings.length + quoteNew} sub={`${quoteNew} unworked quote leads`} tone="emerald" href="/admin/leads" />
        <KpiCard label="Awaiting assignment" value={awaiting.length} sub="Active jobs without a partner" tone={awaiting.length ? "amber" : "forest"} href="/admin/jobs" />
        <KpiCard label="Jobs in progress" value={inProgress.length} sub="Assigned or accepted" href="/admin/jobs" />
        <KpiCard label="Completed jobs" value={completed.length} sub={completionRate === null ? "No closed jobs yet" : `${completionRate}% completion rate`} href="/admin/jobs" />
        <KpiCard label="Partners available" value={activePartners.length} sub={partners.length > activePartners.length ? `${partners.length - activePartners.length} inactive` : "Across the network"} tone="emerald" href="/admin/partners" />
        <KpiCard label="Pending payouts" value={pendingPayouts > 0 ? money(pendingPayouts) : "$0.00"} sub={`${money(paidPayouts)} paid to date`} tone={pendingPayouts > 0 ? "amber" : "forest"} href="/admin/payouts" />
        <KpiCard label="Customer rating" value={rating === null ? "—" : `${rating} ★`} sub={reviews.length ? `${reviews.length} approved review${reviews.length === 1 ? "" : "s"}` : "No approved reviews yet"} tone="emerald" href="/admin/reviews" />
      </div>

      <div className="grid md:grid-cols-2 gap-3 md:gap-4">
        <RingGauge
          label="Completion rate"
          value={completionRate === null ? undefined : completionRate}
          sub={completionRate === null ? "No completed or cancelled jobs yet" : `${completed.length} completed of ${closed} closed`}
        />
        <RingGauge
          label="Average rating"
          value={rating === null ? undefined : rating}
          max={5}
          sub={rating === null ? "No approved reviews yet" : `${reviews.length} approved review${reviews.length === 1 ? "" : "s"}`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-3 md:gap-4">
        <AdminTrendChart bookings={bookings} />
        <StatusBar bookings={bookings} />
      </div>

      <CoveragePanel />
    </div>
  );
}