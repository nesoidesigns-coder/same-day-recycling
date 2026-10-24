import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, RefreshCw, ArrowLeft, Sliders, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import GaugeCard from "@/components/admin/gauges/GaugeCard";
import SpeedometerGauge from "@/components/admin/gauges/SpeedometerGauge";
import ProgressRing from "@/components/admin/gauges/ProgressRing";
import StatusGauge from "@/components/admin/gauges/StatusGauge";
import TrendBadge from "@/components/admin/gauges/TrendBadge";
import StatCard from "@/components/admin/gauges/StatCard";
import EmptyGauge from "@/components/admin/gauges/EmptyGauge";
import OwnerActivityDashboard from "@/components/admin/OwnerActivityDashboard";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const vanToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
const addDays = (ymd, n) => {
  const t = new Date(ymd + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "custom", label: "Custom" },
];

const paramsFor = (p, custom) => {
  const today = vanToday();
  if (p === "today") return { start: today, end: today };
  if (p === "7d") return { start: addDays(today, -6), end: today };
  if (p === "30d") return { start: addDays(today, -29), end: today };
  if (custom.start && custom.end) return { start: custom.start, end: custom.end };
  return null;
};

const updatedTime = (iso) =>
  iso ? new Date(iso).toLocaleTimeString("en-CA", { timeZone: "America/Vancouver", hour: "2-digit", minute: "2-digit" }) : "";

const SECTION_TITLE = "text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 mt-10 first:mt-0";

const DETAIL_CONFIG = {
  revenue: { entity: "Booking", headers: ["Customer", "City", "Status", "Date", "Value"] },
  bookings: { entity: "Booking", headers: ["Customer", "City", "Status", "Date", "Value"] },
  today: { entity: "Booking", headers: ["Customer", "City", "Status", "Date", "Value"] },
  attention: { entity: "Booking", headers: ["Customer", "City", "Status", "Date", "Value"] },
  conversion: { entity: "QuoteLead", headers: ["Name", "City", "Status", "Received", "Estimate"] },
  quotes_outstanding: { entity: "QuoteLead", headers: ["Name", "City", "Status", "Received", "Estimate"] },
  reviews: { entity: "Review", headers: ["Customer", "Rating", "City", "Review"] },
};

export default function AdminAnalytics() {
  const [period, setPeriod] = useState("30d");
  const [custom, setCustom] = useState({ start: "", end: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);
  const [targets, setTargets] = useState([]);
  const [showTargets, setShowTargets] = useState(false);
  const [savingTargets, setSavingTargets] = useState(false);
  const [tab, setTab] = useState("customer");
  const [activity, setActivity] = useState(null);

  // Per-category activity counts for the selected period, computed from real
  // records only. Owner activity is tracked separately and never inflates
  // customer or contractor statistics.
  const loadActivity = async (params) => {
    try {
      const range = { created_date: { $gte: `${params.start}T00:00:00Z`, $lt: `${addDays(params.end, 1)}T00:00:00Z` } };
      const [classRows, ownerPaths, ownerSessions, searchRows, swInq, wlLeads, apps, licenses, subs, testBookings] = await Promise.all([
        base44.entities.Visit.aggregate({ query: range, groupBy: "traffic_class" }),
        base44.entities.Visit.aggregate({ query: { ...range, traffic_class: "owner" }, groupBy: "path", sort: "-count", limit: 200 }),
        base44.entities.Visit.aggregate({ query: { ...range, traffic_class: "owner" }, groupBy: "sid", limit: 1000 }),
        base44.entities.Visit.count({ ...range, traffic_class: "customer", source: "search" }),
        base44.entities.SoftwareInquiry.count(range),
        base44.entities.WhiteLabelLead.count(range),
        base44.entities.ContractorApplication.count(range),
        base44.entities.SoftwareLicense.count(range),
        base44.entities.Subscription.count(range),
        base44.entities.Booking.count({ ...range, record_type: "internal_test" }),
      ]);
      const byClass = {};
      for (const r of classRows?.rows || []) byClass[r.traffic_class || "customer"] = r.count || 0;
      setActivity({
        customer_visits: byClass.customer || 0,
        contractor_visits: byClass.contractor || 0,
        owner_visits: byClass.owner || 0,
        customer_searches: searchRows || 0,
        owner_pages: (ownerPaths?.rows || []).length,
        owner_paths: ownerPaths?.rows || [],
        owner_sessions: (ownerSessions?.rows || []).filter((r) => r.sid).length,
        test_bookings: testBookings || 0,
        software_inquiries: swInq || 0,
        licensing_inquiries: wlLeads || 0,
        registrations: apps || 0,
        subscriptions: (licenses || 0) + (subs || 0),
      });
    } catch {
      setActivity(null);
    }
  };

  const load = async (p = period, c = custom) => {
    setLoading(true);
    setError(null);
    try {
      const params = paramsFor(p, c);
      if (!params) { setData(null); setLoading(false); return; }
      const res = await base44.functions.invoke("dashboardMetrics", params);
      setData(res.data);
      loadActivity(params);
    } catch (e) {
      setError(e?.message || "Could not load metrics");
    }
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      try {
        const t = await base44.entities.MetricTargets.filter({});
        setTargets(t || []);
      } catch {
        setTargets([]);
      }
    })();
  }, []);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const openDetail = async (key, title) => {
    setDetail({ title, loading: true, records: [], headers: DETAIL_CONFIG[key]?.headers || [] });
    try {
      const cfg = DETAIL_CONFIG[key];
      if (!cfg) { setDetail(null); return; }
      const res = await base44.entities[cfg.entity].filter({}, { sort: "-created_date", limit: 200 });
      let records = res.items || res;
      if (cfg.entity === "Booking") {
        const start = data?.period?.start, end = data?.period?.end, today = data?.today;
        const van = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
        if (key === "today") records = records.filter((b) => b.preferred_date === today);
        else if (key === "attention") records = records.filter((b) => b.status === "new" || (["confirmed", "scheduled"].includes(b.status) && (b.assignment_status || "unassigned") === "unassigned"));
        else if (key === "revenue") records = records.filter((b) => b.status === "completed" && start && van(b.created_date) >= start && van(b.created_date) <= end);
        else if (start) records = records.filter((b) => van(b.created_date) >= start && van(b.created_date) <= end);
      } else if (cfg.entity === "QuoteLead") {
        const start = data?.period?.start, end = data?.period?.end;
        const van = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/Vancouver" });
        if (key === "quotes_outstanding") records = records.filter((q) => q.status === "new");
        else if (start) records = records.filter((q) => q.status !== "lost" && van(q.created_date) >= start && van(q.created_date) <= end);
      }
      setDetail({ title, records, headers: cfg.headers });
    } catch {
      setDetail({ title, records: [], headers: DETAIL_CONFIG[key]?.headers || [] });
    }
  };

  const saveTargets = async () => {
    setSavingTargets(true);
    try {
      await Promise.all(targets.map((t) => base44.entities.MetricTargets.update(t.id, { target: Number(t.target) || 0, warning: Number(t.warning) || 0 })));
      await load();
      setShowTargets(false);
    } catch {
      // keep panel open on failure
    }
    setSavingTargets(false);
  };

  const b = data?.business, o = data?.operations, env = data?.environmental, x = data?.experience;
  const updated = updatedTime(data?.last_updated);
  const periodLabel = data?.period ? `${data.period.start} → ${data.period.end}` : "";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <TopBar />
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 mb-2">
              <ArrowLeft className="w-3.5 h-3.5" /> Control Center
            </Link>
            <h1 className="text-3xl font-bold tracking-tight">Operations Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">
              {periodLabel} · Updated {updated || "—"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowTargets(!showTargets)} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 hover:border-emerald-300">
              <Sliders className="w-4 h-4" /> Targets
            </button>
            <button onClick={() => load()} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-emerald-500 text-white font-bold px-4 py-2 text-sm hover:bg-emerald-600 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mb-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-full px-4 py-2 text-sm font-bold border transition-colors ${period === p.key ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"}`}
            >
              {p.label}
            </button>
          ))}
        </div>
        {period === "custom" && (
          <div className="flex flex-wrap items-end gap-2 mb-2">
            <label className="text-xs font-semibold text-slate-500">Start
              <input type="date" value={custom.start} onChange={(e) => setCustom({ ...custom, start: e.target.value })} className="input !py-2 mt-1 block" />
            </label>
            <label className="text-xs font-semibold text-slate-500">End
              <input type="date" value={custom.end} onChange={(e) => setCustom({ ...custom, end: e.target.value })} className="input !py-2 mt-1 block" />
            </label>
            <button onClick={() => load("custom", custom)} className="rounded-full bg-emerald-500 text-white font-bold px-5 py-2.5 text-sm hover:bg-emerald-600">Apply</button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2 mt-4 mb-6" role="tablist" aria-label="Activity categories">
          {[["customer", "Customer Activity"], ["contractor", "Contractor Activity"], ["owner", "Owner Activity"]].map(([k, label]) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              role="tab"
              aria-selected={tab === k}
              className={`rounded-full px-4 py-2 text-sm font-bold border transition-colors ${tab === k ? "bg-emerald-500 text-white border-emerald-500" : "bg-white text-slate-600 border-slate-200 hover:border-emerald-400"}`}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-500 mb-6">Residential / commercial / recurring filters will appear once booking records track service type.</p>

        {showTargets && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-slate-800">Targets &amp; warning levels</h2>
              <button onClick={() => setShowTargets(false)} aria-label="Close targets"><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {targets.map((t, i) => (
                <div key={t.id || i} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="text-xs font-bold text-slate-700 mb-2">{t.label || t.metric} <span className="text-slate-500 font-semibold">({t.unit})</span></div>
                  <div className="flex gap-2">
                    <input type="number" step="any" value={t.target ?? ""} onChange={(e) => setTargets(targets.map((tt, j) => (j === i ? { ...tt, target: e.target.value } : tt)))} className="input !py-2 text-sm" aria-label={`${t.label || t.metric} target`} />
                    <input type="number" step="any" value={t.warning ?? ""} onChange={(e) => setTargets(targets.map((tt, j) => (j === i ? { ...tt, warning: e.target.value } : tt)))} className="input !py-2 text-sm" aria-label={`${t.label || t.metric} warning level`} />
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1.5">target · warning</div>
                </div>
              ))}
            </div>
            <button onClick={saveTargets} disabled={savingTargets} className="mt-4 rounded-full bg-emerald-500 text-white font-bold px-6 py-2.5 text-sm hover:bg-emerald-600 disabled:opacity-50">
              {savingTargets ? "Saving…" : "Save targets"}
            </button>
          </div>
        )}

        {loading && !data ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="w-8 h-8 text-emerald-500 animate-spin" /></div>
        ) : error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 font-semibold">{error}</div>
        ) : !data ? (
          <div className="text-sm text-slate-500 py-10 text-center">Choose a period to load metrics.</div>
        ) : (
          <>
            {tab === "customer" && (
              <>
            {activity && (
              <div className="grid sm:grid-cols-3 gap-4 mb-2">
                <StatCard title="Independent visitors" value={activity.customer_visits} sub="Customer sessions in period" tone="emerald" />
                <StatCard title="Service searches" value={activity.customer_searches} sub="Search-engine arrivals" tone="slate" />
                <StatCard title="Quote requests" value={b.conversion.eligible ?? "—"} sub="Received in period" tone="slate" />
              </div>
            )}
            <h2 className={SECTION_TITLE}>Business performance</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <GaugeCard title="Revenue vs target" status="Verified" updated={`Period ${data.period.start} → ${data.period.end}`} onOpen={() => openDetail("revenue", "Revenue bookings")}
                tooltip="Sum of job value across completed bookings in the selected period. Target is configurable under Targets.">
                <ProgressRing value={b.revenue.value} target={b.revenue.target} display={money(b.revenue.value)} targetDisplay={money(b.revenue.target)} label="Revenue vs target" />
                <div className="mt-3"><TrendBadge delta={b.revenue.delta} label="vs previous" /></div>
              </GaugeCard>
              <GaugeCard title="Quote-to-booking conversion" status="Verified" updated={`Updated ${updated}`} onOpen={() => openDetail("conversion", "Quote requests")}
                tooltip="Quote requests marked booked ÷ eligible quote requests (excludes lost) created in the period. Attribution window = the selected period.">
                {b.conversion.value == null ? (
                  <EmptyGauge title="Quote-to-booking conversion" reasons="No eligible quote requests in this period yet" />
                ) : (
                  <>
                    <SpeedometerGauge value={b.conversion.value} unit="%" target={b.conversion.target} warning={b.conversion.warning} display={`${b.conversion.value}%`} />
                    <div className="mt-2"><TrendBadge delta={b.conversion.delta} label="vs previous" /></div>
                  </>
                )}
              </GaugeCard>
              <GaugeCard title="Repeat customer rate" status="Verified" updated={`Updated ${updated}`}
                tooltip="Share of booked customers (by email) with more than one booking in the period.">
                {b.repeat_rate.value == null ? (
                  <EmptyGauge title="Repeat customer rate" reasons="No customer emails on bookings in this period yet" />
                ) : (
                  <>
                    <SpeedometerGauge value={b.repeat_rate.value} unit="%" target={b.repeat_rate.target} warning={b.repeat_rate.warning} display={`${b.repeat_rate.value}%`} />
                    <div className="mt-2"><TrendBadge delta={b.repeat_rate.delta} label="vs previous" /></div>
                  </>
                )}
              </GaugeCard>
              <StatCard title="Total bookings" value={b.bookings_total.value} sub={`${b.confirmed_bookings.value} confirmed or scheduled`} delta={b.bookings_total.delta} tone="emerald" />
              <StatCard title="Average booking value" value={b.avg_value.value == null ? "—" : money(b.avg_value.value)} sub="Completed jobs only" delta={b.avg_value.delta} tone="slate" />
              <GaugeCard title="Outstanding quote requests" status="Verified" updated={`Updated ${updated}`} onOpen={() => openDetail("quotes_outstanding", "Outstanding quotes")}
                tooltip="Quote requests still in 'new' status across all time, against all quotes on record.">
                {b.quotes_outstanding.total_quotes > 0 ? (
                  <StatusGauge
                    max={b.quotes_outstanding.total_quotes}
                    segments={[{ label: "Awaiting response", value: b.quotes_outstanding.value, color: "bg-emerald-500" }, { label: "Handled", value: b.quotes_outstanding.total_quotes - b.quotes_outstanding.value, color: "bg-slate-200" }]}
                  />
                ) : (
                  <EmptyGauge title="Outstanding quote requests" reasons="No quote requests on record yet" />
                )}
              </GaugeCard>
            </div>

            <h2 className={SECTION_TITLE}>Operations</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <GaugeCard title="Today's pickups" status="Verified" updated={`Updated ${updated}`} onOpen={() => openDetail("today", "Today's pickups")}
                tooltip="Bookings with a preferred date of today: completed vs still scheduled.">
                {b ? (o.scheduled_today.value + o.completed_today.value === 0 ? (
                  <EmptyGauge title="Today's pickups" reasons="No pickups scheduled for today yet" />
                ) : (
                  <StatusGauge
                    max={o.scheduled_today.value + o.completed_today.value}
                    segments={[{ label: "Completed", value: o.completed_today.value, color: "bg-emerald-500" }, { label: "Remaining today", value: o.scheduled_today.value, color: "bg-emerald-300" }]}
                  />
                )) : null}
              </GaugeCard>
              <GaugeCard title="Service completion rate" status="Verified" updated={`Updated ${updated}`} onOpen={() => openDetail("bookings", "Period bookings")}
                tooltip="Completed ÷ (completed + cancelled) bookings in the period. Rescheduled jobs stay eligible until closed.">
                {o.completion.value == null ? (
                  <EmptyGauge title="Service completion rate" reasons="No closed bookings in this period yet" />
                ) : (
                  <>
                    <SpeedometerGauge value={o.completion.value} unit="%" target={o.completion.target} warning={o.completion.warning} display={`${o.completion.value}%`} />
                    <div className="mt-2"><TrendBadge delta={o.completion.delta} label="vs previous" /></div>
                  </>
                )}
              </GaugeCard>
              <GaugeCard title="Jobs needing attention" status="Verified" updated={`Updated ${updated}`} onOpen={() => openDetail("attention", "Jobs needing attention")}
                tooltip="Bookings still unconfirmed, or confirmed/scheduled without an assigned partner.">
                {b.bookings_total.value > 0 ? (
                  <StatusGauge
                    max={b.bookings_total.value}
                    segments={[{ label: "Needs attention", value: o.attention.value, color: "bg-amber-400" }, { label: "On track", value: Math.max(0, b.bookings_total.value - o.attention.value), color: "bg-emerald-500" }]}
                  />
                ) : (
                  <EmptyGauge title="Jobs needing attention" reasons="No bookings in this period yet" />
                )}
              </GaugeCard>
              <EmptyGauge
                title="Remaining capacity, on-time arrival & request-to-confirmation"
                reasons={[o.capacity.reason, o.on_time.reason, o.request_to_confirm.reason]}
              />
            </div>

            <h2 className={SECTION_TITLE}>Recycling &amp; environmental impact</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <EmptyGauge
                title="Recycled weight, reused weight, recycling rate & monthly target"
                reasons={[env.recycled_kg.reason, env.reused_kg.reason, env.recycling_rate.reason, env.monthly_performance.reason]}
              />
              <div className="sm:col-span-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
                <div className="text-sm font-bold text-emerald-800 mb-2">How these will turn on</div>
                <p className="text-xs text-emerald-900/70 leading-relaxed">
                  When crews record material weights per job (recycled, reused or donated, and total), these gauges activate automatically with your configured monthly target. Until then nothing here is estimated or invented — every environmental number shown will come from documented records only.
                </p>
              </div>
            </div>

            <h2 className={SECTION_TITLE}>Customer experience</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <GaugeCard title="Verified customer rating" status="Verified" updated={`Updated ${updated}`} onOpen={() => openDetail("reviews", "Verified reviews")}
                tooltip="Average rating across approved customer reviews. Target configurable under Targets.">
                {x.rating.value == null ? (
                  <EmptyGauge title="Verified customer rating" reasons="No approved reviews yet" />
                ) : (
                  <>
                    <ProgressRing value={x.rating.value} target={x.rating.target} display={`${x.rating.value}★`} targetDisplay={`${x.rating.target}★`} label="Customer rating" />
                    <div className="mt-3"><TrendBadge delta={null} label="vs previous" /></div>
                  </>
                )}
              </GaugeCard>
              <StatCard title="Genuine reviews" value={x.reviews_count.value} sub="Approved reviews only" tone="emerald" />
              <EmptyGauge
                title="Complaints, booking abandonment & response time"
                reasons={[x.complaints.reason, x.abandonment.reason, x.response_time.reason]}
              />
            </div>
              </>
            )}

            {tab === "contractor" && (
              <>
                <h2 className={SECTION_TITLE}>Contractor activity</h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <StatCard title="Contractor visits" value={activity ? activity.contractor_visits : "—"} sub="Software & licensing explorers" tone="emerald" />
                  <StatCard title="Software inquiries" value={activity ? activity.software_inquiries : "—"} sub="Recycling OS interest in period" tone="slate" />
                  <StatCard title="Licensing inquiries" value={activity ? activity.licensing_inquiries : "—"} sub="White-label leads in period" tone="slate" />
                  <StatCard title="Registrations" value={activity ? activity.registrations : "—"} sub="Contractor applications in period" tone="slate" />
                  <StatCard title="Subscriptions & licenses" value={activity ? activity.subscriptions : "—"} sub="New in period" tone="slate" />
                  {activity && activity.contractor_visits === 0 && activity.software_inquiries === 0 && activity.licensing_inquiries === 0 && activity.registrations === 0 && activity.subscriptions === 0 && (
                    <div className="sm:col-span-2 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs text-slate-600 leading-relaxed">
                      No contractor activity recorded in this period yet. Contractor sessions are identified automatically from how visitors arrive and what they explore; registrations, inquiries and subscriptions are counted from real records only.
                    </div>
                  )}
                </div>
              </>
            )}

            {tab === "owner" && (data ? <OwnerActivityDashboard activity={activity} params={data.period} /> : (
              <div className="text-sm text-slate-500 py-10 text-center">Choose a period to load owner activity metrics.</div>
            ))}
          </>
        )}
      </div>

      {detail && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 p-0 sm:p-6" onClick={() => setDetail(null)}>
          <div className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">{detail.title}</h3>
              <button onClick={() => setDetail(null)} aria-label="Close details" className="p-2 rounded-full hover:bg-slate-100"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            {detail.loading ? (
              <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
            ) : detail.records.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No records for this metric in the selected period.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[10px] uppercase tracking-wider text-slate-500 border-b border-slate-100">
                    {detail.headers.map((h) => <th key={h} className="py-2 pr-3 font-bold">{h}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {detail.records.slice(0, 100).map((r) => (
                    <tr key={r.id} className="border-b border-slate-50">
                      {detail.headers.map((h) => {
                        const keyMap = {
                          Customer: r.name, Name: r.name, City: r.city, Status: r.status, Date: r.preferred_date,
                          Value: r.job_value != null ? money(r.job_value) : "—", Received: (r.created_date || "").slice(0, 10),
                          Estimate: r.estimate || "—", Rating: `${r.rating}★`, Review: (r.text || "").slice(0, 80),
                        };
                        return <td key={h} className="py-2.5 pr-3 text-slate-700">{keyMap[h] ?? "—"}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}