import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, MapPin, BarChart3, Clock, ChevronDown, ShieldCheck, Truck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { LIVE_CATEGORIES } from "@/lib/liveCategories";

// Interactive Vancouver market-intelligence dashboard for the homepage. Real
// platform records only (liveIntelligence), each figure labelled by demand type
// and source. Period toggle + clickable category drill-down, no live-traffic claims.

const PERIODS = [
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
  { value: 365, label: "12 mo" },
];

const BC_CITIES = ["Vancouver", "Burnaby", "Surrey", "Richmond", "Coquitlam", "Victoria", "Kelowna"];

const DEMAND_TYPE_LABELS = {
  observed_public_request: "Observed public requests",
  platform_inquiry: "Platform inquiries",
  confirmed_booking: "Confirmed bookings",
  search_interest: "Search interest",
  qualified_opportunity: "Qualified opportunities",
};

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function VancouverIntelDashboard() {
  const cov = useCoverageStatus();
  const [city, setCity] = useState("Vancouver");
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [openCategory, setOpenCategory] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    base44.functions.invoke("liveIntelligence", { action: "gauge", days, city })
      .then((res) => {
        if (!alive) return;
        setData(res.data);
        setError(false);
      })
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, [city, days]);

  const rows = (data?.rows || []).filter((r) => r.count > 0);
  const total = data?.total ?? 0;
  const typeTotals = {};
  for (const r of rows) {
    for (const [t, n] of Object.entries(r.demand_types || {})) typeTotals[t] = (typeTotals[t] || 0) + n;
  }
  const trend = data?.trend || [];
  const trendMax = Math.max(...trend.map((t) => t.count), 1);
  const coverage = cov.loaded ? cov.capacityFor(city) : null;
  const status = cov.loaded ? cov.statusFor(city) : null;
  const refreshedAt = data?.generated_at ? new Date(data.generated_at).toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit" }) : null;
  const statusLabel = {
    same_day: "Verified provider on duty",
    currently_unavailable: "Verified coverage · capacity varies",
    matching: "Contractor matching active",
    recruiting: "New contractors onboarding",
  }[status] || "Coverage status pending";

  return (
    <section id="vancouver-intel" className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#187B65]/10 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-[#187B65] uppercase">
              <BarChart3 className="w-3.5 h-3.5" /> Live market intelligence
            </div>
            <h2 className="mt-3 text-2xl md:text-4xl font-bold tracking-tight text-[#102B2A]">
              Vancouver Pickup Demand, in Real Time
            </h2>
            <p className="mt-2 text-slate-600">Real records from our own platform — every pickup request, inquiry and verified booking, labelled by type. Not estimates, not simulations.</p>
          </div>
          <div className="flex gap-2">
            <select value={city} onChange={(e) => { setCity(e.target.value); setOpenCategory(null); }} aria-label="City" className="input !py-2.5 text-sm font-semibold">
              {BC_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <div className="flex rounded-xl border border-slate-200 overflow-hidden" role="group" aria-label="Reporting period">
              {PERIODS.map((p) => (
                <button key={p.value} onClick={() => setDays(p.value)}
                  className={`px-3 py-2.5 text-xs font-bold transition-colors ${days === p.value ? "bg-[#187B65] text-white" : "bg-white text-slate-500 hover:text-[#187B65]"}`}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-2xl bg-[#f4f7f5] border border-slate-200 p-6 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading demand records…
          </div>
        ) : error ? (
          <div className="mt-6 rounded-2xl bg-[#f4f7f5] border border-slate-200 p-6 text-sm text-slate-500">
            Demand intelligence is unavailable right now. Please try again shortly.
          </div>
        ) : (
          <div className="mt-6 grid md:grid-cols-5 gap-4">
            {/* Demand by category — click to drill down */}
            <div className="md:col-span-3 rounded-2xl bg-[#f4f7f5] border border-slate-200 p-5">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-bold text-[#102B2A]">Demand by service category</h3>
                <span className="text-xs font-bold text-[#187B65] tabular-nums">{total} record{total === 1 ? "" : "s"}</span>
              </div>
              {rows.length === 0 ? (
                <p className="mt-4 text-sm text-slate-500">{data?.empty_note || "Insufficient observations for this selection."}</p>
              ) : (
                <div className="mt-4 space-y-2">
                  {rows.map((r) => {
                    const pct = Math.round((r.count / total) * 100);
                    const open = openCategory === r.key;
                    return (
                      <div key={r.key} className="rounded-xl bg-white border border-slate-100 overflow-hidden">
                        <button onClick={() => setOpenCategory(open ? null : r.key)}
                          className="w-full flex items-center gap-3 px-3.5 py-3 text-left hover:bg-slate-50/70" aria-expanded={open}>
                          <span className="flex-1 min-w-0 text-sm font-bold text-[#102B2A] truncate">{LIVE_CATEGORIES[r.key] || r.key.replace(/_/g, " ")}</span>
                          <span className="hidden sm:block flex-1 max-w-[140px] h-2 rounded-full bg-slate-100 overflow-hidden" aria-hidden="true">
                            <span className="block h-full rounded-full bg-[#187B65]" style={{ width: `${Math.max(6, pct)}%` }} />
                          </span>
                          <span className="text-sm font-bold text-[#187B65] tabular-nums w-7 text-right">{r.count}</span>
                          <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
                        </button>
                        {open && (
                          <div className="px-3.5 pb-3 grid grid-cols-2 gap-1.5">
                            {Object.entries(r.demand_types || {}).map(([t, n]) => (
                              <span key={t} className="rounded-lg bg-[#f4f7f5] px-2.5 py-1.5 text-[11px] font-semibold text-slate-600">
                                {DEMAND_TYPE_LABELS[t] || t}: <span className="text-[#102B2A] tabular-nums">{n}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="mt-4 flex flex-wrap gap-1.5">
                {Object.entries(typeTotals).map(([t, n]) => (
                  <span key={t} className="rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-500">
                    {DEMAND_TYPE_LABELS[t] || t}: <span className="text-[#102B2A] tabular-nums">{n}</span>
                  </span>
                ))}
              </div>
            </div>

            <div className="md:col-span-2 flex flex-col gap-4">
              {/* Trend */}
              <div className="rounded-2xl bg-[#f4f7f5] border border-slate-200 p-5">
                <h3 className="font-bold text-[#102B2A]">Service trend</h3>
                {trend.filter((t) => t.count > 0).length >= 2 ? (
                  <>
                    <div className="mt-3 flex items-end gap-1.5 h-24">
                      {trend.map((t) => (
                        <div key={t.month} className="flex-1 flex flex-col items-center justify-end gap-1 min-w-0" title={`${t.month}: ${t.count}`}>
                          <span className="text-[10px] font-bold text-[#102B2A] tabular-nums">{t.count}</span>
                          <div className="w-full rounded-t bg-[#187B65]" style={{ height: `${Math.max(4, (t.count / trendMax) * 100)}%` }} aria-hidden="true" />
                        </div>
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] text-slate-400">Records per month · {city}</p>
                  </>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">Not enough history yet — observations accumulate month by month.</p>
                )}
              </div>

              {/* Verified coverage */}
              <div className="rounded-2xl bg-[#f4f7f5] border border-slate-200 p-5">
                <h3 className="flex items-center gap-2 font-bold text-[#102B2A]"><ShieldCheck className="w-4 h-4 text-[#187B65]" /> Verified coverage</h3>
                {!cov.loaded ? (
                  <p className="mt-2 text-sm text-slate-500 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking coverage records…</p>
                ) : (
                  <>
                    <p className="mt-2 text-sm font-semibold text-[#102B2A]">{city}: {statusLabel}</p>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                      {typeof coverage?.available === "number" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1">
                          <Truck className="w-3.5 h-3.5 text-[#187B65]" /> {coverage.available} pickup slot{coverage.available === 1 ? "" : "s"} open today
                        </span>
                      )}
                      {typeof cov.contractorCounts?.[city] === "number" && (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-2.5 py-1">
                          <MapPin className="w-3.5 h-3.5 text-[#187B65]" /> {cov.contractorCounts[city]} verified contractor{cov.contractorCounts[city] === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>
                  </>
                )}
                <Link to="/live" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-[#187B65] hover:underline">
                  Explore the full LIVE centre <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400">
          <span className="inline-flex items-center gap-1.5"><Clock className="w-3 h-3" />{refreshedAt ? `Refreshed ${refreshedAt}` : "Refreshed automatically"}</span>
          <span>Source: verified platform demand records (service records only; test fixtures excluded).</span>
          <span>Counts of real records — never a projection of live traffic.</span>
        </p>
      </div>
    </section>
  );
}