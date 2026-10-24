import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw, Users, MousePointerClick, Repeat, DollarSign, ClipboardCheck, TrendingUp, MapPin, Ban } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { FunnelPanel, RevenuePanel, DataQualityPanel, AiBusinessMasterPanel, ExcludedPanel } from "./AcquisitionPanels";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const fmtPct = (v) => (v === null || v === undefined ? "—" : `${v}%`);

const WINDOW_KEYS = [
  { key: "today", label: "Today" },
  { key: "24h", label: "24 hours" },
  { key: "7d", label: "7 days" },
  { key: "30d", label: "30 days" },
  { key: "all", label: "All time" },
];

const CHANNEL_COLORS = {
  google_organic: "#187B65", bing_organic: "#0e9e7f", other_search: "#4c9e8b",
  facebook: "#2d7dd2", instagram: "#b5568c", other_social: "#8b7ec8",
  ai_referral: "#7c5cd6", google_business: "#f59e0b", referral: "#54D9AE",
  paid: "#e0762c", direct: "#102B2A", unknown: "#94a3b8", unlinked: "#94a3b8",
};

function KpiCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <Icon className="w-3.5 h-3.5 text-[#187B65]" /> {label}
      </div>
      <div className="mt-1 text-2xl font-extrabold text-[#102B2A]">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>
    </div>
  );
}

export default function AcquisitionDashboard() {
  const [windowKey, setWindowKey] = useState("7d");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updated, setUpdated] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("visitStats", {});
      setReport(res.data);
      setUpdated(new Date());
    } catch (e) {
      setError(e?.message || "Could not load traffic intelligence");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const win = report?.windows?.[windowKey];
  const windowLabel = win?.label || "—";
  const dailyChart = (report?.daily || []).slice(windowKey === "today" || windowKey === "24h" ? -7 : -30);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#102B2A]">Live Customer Acquisition</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            Where customers come from, what they explore, and how many become paying customers. Owner testing and bots are tracked separately and excluded from every customer metric.
          </p>
          <p className="text-[11px] text-slate-500 mt-1.5">
            Reporting time zone: <span className="font-bold text-slate-700">America/Vancouver (Pacific)</span>
            {win?.rolling ? " · rolling window" : " · calendar days"} · {win ? `${win.start.slice(0, 10)} → ${win.end.slice(0, 10)}` : ""}
          </p>
        </div>
        <button onClick={load} disabled={loading} className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#187B65] transition-colors" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-[#102B2A] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Window switcher: calendar days vs rolling window, clearly separated */}
      <div className="mt-5 inline-flex flex-wrap rounded-full bg-white border border-slate-200 p-1 gap-1">
        {WINDOW_KEYS.map((w) => (
          <button
            key={w.key}
            onClick={() => setWindowKey(w.key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${windowKey === w.key ? "bg-[#102B2A] text-white" : "text-slate-600 hover:text-[#102B2A]"}`}
          >
            {w.label}
          </button>
        ))}
      </div>
      {win && (
        <p className="mt-2 text-[11px] text-slate-500">
          {windowLabel} · confidence on key denominators: sessions {win.confidence?.sessions}, bookings {win.confidence?.bookings}
        </p>
      )}

      {loading && !report ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading traffic intelligence…
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl bg-white border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>
      ) : win && report ? (
        <>
          {/* KPI row */}
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard icon={Users} label="Verified sessions" value={win.sessions.toLocaleString("en-CA")} sub={`${win.legacy_pageviews.toLocaleString("en-CA")} legacy page views without a session key`} />
            <KpiCard icon={MousePointerClick} label="Page views (human)" value={win.page_views.human.toLocaleString("en-CA")} sub={`${win.page_views.total_recorded.toLocaleString("en-CA")} total recorded incl. owner & bots`} />
            <KpiCard icon={Repeat} label="New vs returning" value={`${win.new_visitors.toLocaleString("en-CA")} / ${win.returning_visitors.toLocaleString("en-CA")}`} sub="Distinct sessions in this window" />
            <KpiCard icon={DollarSign} label="Verified revenue" value={money(win.revenue.verified_revenue)} sub={`${money(win.revenue.external_pending_value)} external pending reconciliation`} />
            <KpiCard icon={ClipboardCheck} label="Booking requests" value={win.bookings.requests.toLocaleString("en-CA")} sub={`${win.bookings.confirmed} confirmed · ${win.bookings.tests_excluded} tests excluded`} />
            <KpiCard icon={ClipboardCheck} label="Completed jobs" value={win.bookings.completed.toLocaleString("en-CA")} sub={`${win.quote_requests} quote requests received`} />
            <KpiCard icon={TrendingUp} label="Visit → booking" value={fmtPct(win.funnel.rates.find((r) => r.to === "booking_confirmed")?.pct)} sub="Sessions to confirmed bookings" />
            <KpiCard icon={MapPin} label="Top demand city" value={win.cities[0]?.city || "—"} sub={win.cities[0] ? `${win.cities[0].requests} request(s)` : "No booking requests yet"} />
          </div>

          {/* Traffic composition */}
          <div className="mt-5 grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Customer vs contractor traffic</h2>
              <div className="space-y-4">
                {[["customer", "Customer sessions", win.classes.customer, "#187B65", "Exploring services & requesting quotes"],
                  ["contractor", "Contractor sessions", win.classes.contractor, "#54D9AE", "Providers exploring partnerships & software"]].map(([key, label, value, color, note]) => {
                  const total = win.page_views.human || 1;
                  const p = Math.round((value / total) * 100);
                  return (
                    <div key={key}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-sm font-bold text-[#102B2A]">{label}</span>
                        <span className="text-sm font-extrabold text-[#187B65]">{value.toLocaleString("en-CA")}</span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p}%`, backgroundColor: color }} />
                      </div>
                      <div className="mt-1 text-[11px] text-slate-500">{note}</div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-[11px] text-slate-600 leading-relaxed">
                Excluded here but tracked: {win.classes.owner.toLocaleString("en-CA")} owner page views · {win.classes.bot.toLocaleString("en-CA")} bot page views · {win.classes.unclassified.toLocaleString("en-CA")} unclassified (legacy records keep their recorded class).
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Acquisition channels</h2>
              {win.channels.length === 0 ? (
                <p className="text-sm text-slate-500">No human traffic recorded in this window yet.</p>
              ) : (
                <div className="space-y-3">
                  {win.channels.map((c) => {
                    const total = win.page_views.human || 1;
                    const p = Math.round((c.count / total) * 100);
                    return (
                      <div key={c.key}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-sm font-bold text-[#102B2A]">{c.label}</span>
                          <span className="text-sm font-extrabold text-[#187B65]">{c.count.toLocaleString("en-CA")}</span>
                        </div>
                        <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.max(p, 1)}%`, backgroundColor: CHANNEL_COLORS[c.key] || "#94a3b8" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <p className="mt-3 text-[11px] text-slate-500">
                Attribution uses recorded evidence only: UTM campaign tags and the HTTP referrer. Unlabeled arrivals stay Direct — they are reported as unattributed, never guessed. Bookings by channel: {win.bookings_by_channel.slice(0, 4).map((b) => `${b.label}: ${b.count}`).join(" · ") || "no linked bookings yet"}.
              </p>
            </div>
          </div>

          {/* Daily trend */}
          <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Daily trend — Pacific calendar days</h2>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChart} margin={{ top: 4, right: 4, bottom: 0, left: -18 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2f0" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fontSize: 10, fill: "#94a3b8" }} interval="preserveStartEnd" />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip formatter={(v, name) => [v, name === "pageviews" ? "Page views (human)" : "Sessions"]}/>
                  <Bar dataKey="pageviews" fill="#187B65" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="sessions" fill="#54D9AE" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-slate-500">Dark = human page views · light = distinct sessions. Days before session tracking existed show only page views (labeled legacy in the data-quality panel).</p>
          </div>

          {/* Funnel + landing pages */}
          <div className="mt-5 grid md:grid-cols-2 gap-5">
            <FunnelPanel window={win} />
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Top landing pages</h2>
              {win.top_pages.length === 0 ? (
                <p className="text-sm text-slate-500">No page views in this window.</p>
              ) : (
                <ul className="space-y-2">
                  {win.top_pages.map((p) => (
                    <li key={p.path} className="flex justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate font-mono text-[#102B2A]">{p.path}</span>
                      <span className="font-extrabold text-[#187B65]">{p.count.toLocaleString("en-CA")}</span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-[11px] text-slate-500">Service-intent page views in this window: {win.intent_visits.toLocaleString("en-CA")} (service, pricing, quote or tracking pages).</p>
            </div>
          </div>

          {/* Revenue + geography */}
          <div className="mt-5 grid md:grid-cols-2 gap-5">
            <RevenuePanel window={win} />
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 inline-flex items-center gap-2"><MapPin className="w-4 h-4 text-[#187B65]" />Geographic demand</h2>
              {win.cities.length === 0 ? (
                <p className="text-sm text-slate-500">No booking requests in this period yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2 pr-4">City</th>
                      <th className="py-2 pr-4">Requests</th>
                      <th className="py-2 pr-4">Confirmed</th>
                      <th className="py-2">Completed value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {win.cities.map((c) => (
                      <tr key={c.city} className="border-t border-slate-100">
                        <td className="py-2.5 pr-4 font-semibold text-[#102B2A]">{c.city}{c.province_code ? `, ${c.province_code}` : ""}</td>
                        <td className="py-2.5 pr-4">{c.requests}</td>
                        <td className="py-2.5 pr-4">{c.confirmed}</td>
                        <td className="py-2.5 font-semibold text-[#187B65]">{money(c.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <p className="mt-4 text-[11px] text-slate-500">Visitors by country (timezone-inferred): Canada {win.countries.CA.toLocaleString("en-CA")} · outside Canada {win.countries.other.toLocaleString("en-CA")}.</p>
            </div>
          </div>

          {/* Preserved owner & bot activity */}
          <div className="mt-5">
            <ExcludedPanel window={win} />
          </div>

          {/* AI Business Master + data quality */}
          <div className="mt-5 space-y-5">
            <AiBusinessMasterPanel />
            <DataQualityPanel report={report} />
          </div>
        </>
      ) : null}
    </div>
  );
}