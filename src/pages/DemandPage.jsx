import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Globe2, MapPin, Search, Users, Loader2, Info, CalendarClock, CheckCircle2, ArrowLeft } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useSEO } from "@/lib/seo";
import { COVERAGE } from "@/lib/coverage";
import PulseRing, { formatCount, useCountUp } from "@/components/sdr/pulse/PulseRing";

const AnimatedNumber = ({ value, className = "" }) => {
  const display = useCountUp(Number(value) || 0);
  return <span className={className}>{formatCount(display)}</span>;
};

const CATEGORY_LABELS = {
  junk_removal: "Junk Removal", furniture_removal: "Furniture Removal", appliance_removal: "Appliance Removal",
  electronics: "Electronics Recycling", recycling: "Recycling", waste_disposal: "Waste Disposal",
  estate_cleanout: "Estate Cleanouts", construction_debris: "Construction Debris", other: "Other Services",
};

// National Demand Intelligence — public geographic explorer. Industry demand
// figures (source-labeled estimates) and operational service coverage are
// always shown as separate layers; contractor availability is never implied
// from search demand.
export default function DemandPage() {
  useSEO({
    title: "National Recycling Demand Intelligence | Same Day Recycling",
    description: "Estimated Canadian search demand for junk removal, furniture and appliance removal, recycling and waste disposal by province and city, alongside Same Day Recycling's verified market capture.",
    path: "/demand",
  });
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [geo, setGeo] = useState({ type: "national", key: "Canada" });

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("demandReport", {});
        if (alive) setData(res.data);
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const rows = useMemo(() => data?.series || [], [data]);

  const geoRows = useMemo(() => {
    if (geo.type === "national") return rows;
    if (geo.type === "province") return rows.filter((r) => r.geo_type === "province" && (r.province_code || "") === geo.key);
    return rows.filter((r) => r.geo_type === "city" && String(r.city || "").toLowerCase() === geo.key.toLowerCase());
  }, [rows, geo]);

  const latestPeriod = useMemo(() => {
    const ps = geoRows.map((r) => r.period).filter(Boolean).sort();
    return ps[ps.length - 1] || "";
  }, [geoRows]);

  const geoSummary = useMemo(() => {
    if (!geoRows.length) return null;
    const inLatest = latestPeriod ? geoRows.filter((r) => r.period === latestPeriod) : geoRows;
    const total = inLatest.reduce((a, r) => a + (Number(r.est_monthly_volume) || 0), 0);
    const byCat = {};
    for (const r of inLatest) byCat[r.service_category] = (byCat[r.service_category] || 0) + (Number(r.est_monthly_volume) || 0);
    const categories = Object.entries(byCat).map(([c, v]) => ({ category: c, label: CATEGORY_LABELS[c] || "Other", volume: v })).sort((a, b) => b.volume - a.volume);
    const byPeriod = {};
    for (const r of geoRows) byPeriod[r.period] = (byPeriod[r.period] || 0) + (Number(r.est_monthly_volume) || 0);
    const seasonal = Object.entries(byPeriod).sort().map(([period, volume]) => ({ period, volume }));
    const topKeywords = [...inLatest].sort((a, b) => (b.est_monthly_volume || 0) - (a.est_monthly_volume || 0)).slice(0, 8);
    const cityCoverage = geo.type === "city"
      ? COVERAGE.find((c) => c.name.toLowerCase() === geo.key.toLowerCase())
      : null;
    return { total, categories, seasonal, topKeywords, cityCoverage, period: latestPeriod };
  }, [geoRows, latestPeriod, geo]);

  const coverage = data?.coverage;
  const industry = data?.industry;
  const capture = data?.capture;
  const loading = !data && !error;

  const cities = industry?.by_city || [];
  const provinces = data?.provinces || [];
  const provincesWithData = new Set((industry?.by_province || []).map((p) => p.province_code));

  return (
    <div className="min-h-screen bg-[#f6f9f8]">
      <div className="bg-[#102B2A] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#54D9AE] hover:underline mb-4">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to home
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold tracking-[0.12em] uppercase text-[#54D9AE] mb-3">
            <Globe2 className="w-3.5 h-3.5" /> Demand Intelligence
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">Canadian Recycling Demand</h1>
          <p className="mt-3 text-slate-300 max-w-2xl">
            Estimated search demand for removal and recycling services across Canada, by province and city — shown
            separately from Same Day Recycling's verified service coverage. Demand figures are source-labeled estimates;
            contractor availability is operational capacity on file, never implied from search volume.
          </p>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-10">
        {loading && (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#187B65]" /> Loading demand intelligence…
          </div>
        )}
        {error && (
          <div className="rounded-3xl bg-white border border-slate-100 p-10 text-center text-slate-600">
            <Info className="w-8 h-8 text-[#187B65] mx-auto mb-2" /> Demand intelligence is temporarily unavailable.
          </div>
        )}

        {data && (
          <>
            {/* National summary */}
            <div className="grid sm:grid-cols-3 gap-4 mb-10">
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">Industry demand</div>
                {industry?.available ? (
                  <>
                    <div className="text-3xl font-extrabold text-[#102B2A]"><AnimatedNumber value={industry.total_est_monthly_searches} /></div>
                    <div className="text-xs text-slate-500">est. monthly searches · {industry.latest_period}</div>
                    <div className="mt-2 text-[10px] text-slate-400">{(industry.volume_basis || []).join(" · ") || "Verified source data"}</div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">Awaiting a verified volume source. Estimates appear once imported and labeled in the admin panel.</p>
                )}
              </div>
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">Our market capture</div>
                {capture?.available ? (
                  <>
                    <div className="text-3xl font-extrabold text-[#102B2A]">{capture.gsc ? formatCount(capture.gsc.impressions) : "—"}</div>
                    <div className="text-xs text-slate-500">organic impressions · {capture.gsc?.window?.split(" to ")[1] || "28 days"}</div>
                    <div className="mt-2 text-[10px] text-slate-400">{formatCount(capture.gsc?.clicks || 0)} clicks · {formatCount(capture.recycling_os?.verified_inquiries || 0)} verified inquiries</div>
                  </>
                ) : (
                  <p className="text-sm text-slate-500">{capture?.note}</p>
                )}
              </div>
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#187B65]" /> Contractor availability
                </div>
                <div className="text-3xl font-extrabold text-[#102B2A]">{coverage ? coverage.available_contractors : "—"}</div>
                <div className="text-xs text-slate-500">active verified contractors on the platform</div>
                <div className="mt-2 text-[10px] text-slate-400">Operational capacity — independent of search demand.</div>
              </div>
            </div>

            {/* Geography selector */}
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 sm:p-8">
              <h2 className="font-extrabold text-[#102B2A] text-lg mb-1">Geographic demand explorer</h2>
              <p className="text-sm text-slate-500 mb-4">Select a province or city to see local demand, service interest and seasonal patterns.</p>

              <div className="mb-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Provinces & territories</div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setGeo({ type: "national", key: "Canada" })}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${
                      geo.type === "national" ? "bg-[#102B2A] text-white border-[#102B2A]" : "bg-white text-slate-600 border-slate-200 hover:border-[#187B65]"
                    }`}
                  >
                    All Canada
                  </button>
                  {provinces.map(([code, name]) => {
                    const hasData = provincesWithData.has(code);
                    return (
                      <button
                        key={code}
                        onClick={() => setGeo({ type: "province", key: code })}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${
                          geo.type === "province" && geo.key === code ? "bg-[#102B2A] text-white border-[#102B2A]" : "bg-white text-slate-600 border-slate-200 hover:border-[#187B65]"
                        }`}
                        title={hasData ? "Demand data on file" : "No demand observations on file yet"}
                      >
                        {name}
                        {hasData && <span className="ml-1 inline-block w-1.5 h-1.5 rounded-full bg-[#187B65]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {cities.length > 0 && (
                <div className="mb-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Cities with recorded demand data</div>
                  <div className="flex flex-wrap gap-2">
                    {cities.slice(0, 24).map((c) => (
                      <button
                        key={c.city}
                        onClick={() => setGeo({ type: "city", key: c.city })}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${
                          geo.type === "city" && geo.key.toLowerCase() === c.city.toLowerCase() ? "bg-[#187B65] text-white border-[#187B65]" : "bg-[#f6f9f8] text-slate-600 border-slate-200 hover:border-[#187B65]"
                        }`}
                      >
                        {c.city}{c.province_code ? `, ${c.province_code}` : ""}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {geo.type !== "national" && !geoSummary && (
                <div className="rounded-2xl bg-[#f6f9f8] border border-dashed border-[#187B65]/30 p-6 text-center text-sm text-slate-500">
                  No demand observations on file for this geography yet. Verified estimates appear here once a volume source covering {geo.key} is imported.
                </div>
              )}

              {geoSummary && (
                <div className="mt-2">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 mb-4">
                    <h3 className="font-extrabold text-[#102B2A] text-xl">{geo.key === "Canada" ? "All Canada" : geo.key}</h3>
                    {geoSummary.period && <span className="text-xs text-slate-400">data period {geoSummary.period}</span>}
                  </div>

                  <div className="grid lg:grid-cols-3 gap-6">
                    <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-5">
                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3 flex items-center gap-1.5">
                        <Search className="w-3.5 h-3.5 text-[#187B65]" /> Local estimated demand
                      </div>
                      <div className="text-3xl font-extrabold text-[#102B2A]"><AnimatedNumber value={geoSummary.total} /></div>
                      <div className="text-xs text-slate-500 mt-1">est. monthly searches</div>
                    </div>

                    <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-5">
                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3">Most searched services</div>
                      {geoSummary.categories.length ? (
                        <div className="space-y-2">
                          {geoSummary.categories.slice(0, 5).map((c) => (
                            <div key={c.category} className="flex items-center justify-between text-sm">
                              <span className="font-semibold text-[#102B2A]">{c.label}</span>
                              <span className="font-bold text-slate-600 tabular-nums">{formatCount(c.volume)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">Index-only observations on file — no volume breakdown yet.</p>
                      )}
                    </div>

                    <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-5">
                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#187B65]" /> Service coverage
                      </div>
                      {geo.type === "city" ? (
                        geoSummary.cityCoverage ? (
                          <div>
                            <div className="font-bold text-[#102B2A] text-sm">Requests open — service territory</div>
                            <p className="text-xs text-slate-500 mt-1">
                              Customers in {geoSummary.cityCoverage.name} can submit service requests nationwide; a booking
                              is confirmed once a contractor accepts the job.
                            </p>
                          </div>
                        ) : (
                          <div>
                            <div className="font-bold text-[#102B2A] text-sm">Not an operator city</div>
                            <p className="text-xs text-slate-500 mt-1">
                              Requests from here are still accepted nationwide — the dispatch team sources contractors in
                              response to demand.
                            </p>
                          </div>
                        )
                      ) : (
                        <div>
                          <div className="font-bold text-[#102B2A] text-sm">{coverage ? coverage.available_contractors : "—"} active contractors</div>
                          <p className="text-xs text-slate-500 mt-1">
                            {coverage ? coverage.verified_service_areas.length : 0} verified service areas on file. Availability is
                            operational capacity, never derived from search demand.
                          </p>
                        </div>
                      )}
                      <Link to="/request-service" className="inline-block mt-3 text-xs font-bold text-[#187B65] hover:underline">Request service →</Link>
                    </div>
                  </div>

                  {geoSummary.seasonal.length >= 2 && (
                    <div className="mt-6 rounded-2xl bg-white border border-slate-100 p-5">
                      <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-3 flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-[#187B65]" /> Seasonal demand changes
                      </div>
                      <div className="h-52">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={geoSummary.seasonal} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f0" />
                            <XAxis dataKey="period" tick={{ fontSize: 11, fill: "#64748b" }} />
                            <YAxis tick={{ fontSize: 11, fill: "#64748b" }} width={44} />
                            <Tooltip formatter={(v) => [formatCount(v), "Est. searches"]} labelStyle={{ fontWeight: 700 }} />
                            <Line type="monotone" dataKey="volume" stroke="#187B65" strokeWidth={2.5} dot={{ r: 3, fill: "#187B65" }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {geoSummary.topKeywords.length > 0 && (
                    <div className="mt-6">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Top keywords on file</div>
                      <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full text-sm">
                          <thead className="bg-[#f6f9f8] text-left">
                            <tr>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Keyword</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Service</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Est. monthly</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Trend</th>
                              <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Source</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {geoSummary.topKeywords.map((k, i) => (
                              <tr key={`${k.keyword}-${i}`} className="bg-white">
                                <td className="px-4 py-2.5 font-semibold text-[#102B2A]">{k.keyword}</td>
                                <td className="px-4 py-2.5 text-slate-600">{k.label}</td>
                                <td className="px-4 py-2.5 font-bold text-[#102B2A] tabular-nums">{k.volume ? formatCount(k.volume) : "—"}</td>
                                <td className="px-4 py-2.5 text-slate-600 capitalize">{k.trend_direction}</td>
                                <td className="px-4 py-2.5 text-xs text-slate-400 max-w-[220px] truncate" title={k.source}>{k.source}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 rounded-3xl bg-white border border-slate-100 p-6 text-xs text-slate-500 leading-relaxed">
              <div className="font-bold text-[#102B2A] text-sm mb-1 flex items-center gap-2"><Info className="w-4 h-4 text-[#187B65]" /> Methodology</div>
              {data?.methodology?.industry} {data?.methodology?.capture} {data?.methodology?.updates} {data?.market_share_note}
            </div>
          </>
        )}
      </main>
    </div>
  );
}