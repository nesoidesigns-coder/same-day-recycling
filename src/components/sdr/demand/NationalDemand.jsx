import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Globe2, MapPin, Search, MousePointerClick, CheckCircle2, Recycle, TrendingUp, Loader2, Info } from "lucide-react";
import PulseRing, { useCountUp, formatCount } from "@/components/sdr/pulse/PulseRing";
import LazySection from "@/components/sdr/LazySection";

const AnimatedNumber = ({ value, animate = true, className = "" }) => {
  const display = useCountUp(Number(value) || 0, { animate });
  return <span className={className}>{formatCount(display)}</span>;
};

const BasisChip = ({ basis, sources }) => {
  const label = basis?.includes("keyword_planner")
    ? "Google Keyword Planner estimates"
    : basis?.includes("published_estimate")
      ? "Published industry estimates"
      : sources?.[0] || "Verified source data";
  return (
    <span className="rounded-full bg-[#187B65]/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.1em] text-[#187B65]">
      {label}
    </span>
  );
};

// National Recycling Demand — homepage intelligence section. Two clearly
// separated layers: estimated Canadian search demand (industry-wide, labeled
// with its source basis) and Same Day Recycling's own verified capture.
export default function NationalDemand() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

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

  const industry = data?.industry;
  const capture = data?.capture;
  const loading = !data && !error;

  return (
    <LazySection minHeight={520}>
      <section id="demand" className="bg-[#f6f9f8] border-y border-[#187B65]/10 py-14 sm:py-18">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#187B65]/20 px-4 py-1.5 text-xs font-bold tracking-[0.12em] uppercase text-[#187B65] mb-3">
              <Globe2 className="w-3.5 h-3.5" /> National Demand Intelligence
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-[#102B2A] tracking-tight">Canada's Recycling Demand</h2>
            <p className="mt-3 text-slate-600">
              What Canadians search for across the whole industry — and what Same Day Recycling captures. Two separate
              intelligence layers, each labeled with its real data source.
            </p>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-16 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#187B65]" /> Loading verified demand intelligence…
            </div>
          )}

          {error && (
            <div className="max-w-2xl mx-auto rounded-3xl bg-white border border-slate-100 p-8 text-center text-slate-600">
              <Info className="w-8 h-8 text-[#187B65] mx-auto mb-2" />
              Demand intelligence is temporarily unavailable — please check back shortly.
            </div>
          )}

          {data && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Layer 1 — industry demand */}
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-extrabold text-[#102B2A] text-lg flex items-center gap-2">
                    <Search className="w-5 h-5 text-[#187B65]" /> Industry Demand
                  </h3>
                  {industry?.available && <BasisChip basis={industry.volume_basis} sources={industry.sources} />}
                </div>
                {industry?.available ? (
                  <>
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                      <PulseRing value={industry.total_est_monthly_searches} size={170} palette="emerald">
                        <div>
                          <div className="text-3xl font-extrabold text-[#102B2A]">
                            <AnimatedNumber value={industry.total_est_monthly_searches} />
                          </div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mt-1">
                            Est. monthly searches
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{industry.latest_period} · Canada</div>
                        </div>
                      </PulseRing>
                      <div className="flex-1 w-full">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2">Top requested services</div>
                        <div className="space-y-2">
                          {(industry.by_category || []).slice(0, 4).map((c) => (
                            <div key={c.category} className="flex items-center gap-3">
                              <span className="w-40 shrink-0 text-sm font-semibold text-[#102B2A] truncate">{c.label}</span>
                              <div className="flex-1 h-2 rounded-full bg-[#f4f7f5] overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-[#54D9AE] to-[#187B65]"
                                  style={{ width: `${Math.max(4, Math.round((c.volume / (industry.by_category[0]?.volume || 1)) * 100))}%` }}
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-600 tabular-nums">{formatCount(c.volume)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {(industry.fastest_growing || []).length > 0 && (
                      <div className="mt-6 pt-4 border-t border-slate-100">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2 flex items-center gap-1.5">
                          <TrendingUp className="w-3.5 h-3.5 text-[#187B65]" /> Fastest-growing categories (vs prior period)
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {industry.fastest_growing.map((g) => (
                            <span key={g.category} className="rounded-full bg-[#f4f7f5] border border-[#187B65]/20 px-3 py-1 text-xs font-bold text-[#102B2A]">
                              {g.label} <span className={g.growth_pct >= 0 ? "text-[#187B65]" : "text-amber-600"}>
                                {g.growth_pct >= 0 ? "+" : ""}{g.growth_pct}%
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(industry.by_province || []).length > 0 && (
                      <div className="mt-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-2 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[#187B65]" /> Regional demand index
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {industry.by_province.slice(0, 6).map((p) => (
                            <div key={p.province_code} className="rounded-xl bg-[#f6f9f8] border border-slate-100 px-3 py-2">
                              <div className="text-xs font-bold text-[#102B2A] truncate">{p.province}</div>
                              <div className="text-[10px] text-slate-500">index {p.index} · {formatCount(p.volume)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="mt-4 text-[11px] text-slate-400">
                      Estimates, not exact counts. Trend indices express relative interest only.
                    </p>
                  </>
                ) : (
                  <div className="rounded-2xl bg-[#f6f9f8] border border-dashed border-[#187B65]/30 p-6 text-center">
                    <Search className="w-8 h-8 text-[#187B65] mx-auto mb-2" />
                    <div className="font-bold text-[#102B2A]">Industry-wide estimates pending verification</div>
                    <p className="text-sm text-slate-500 mt-1">{industry?.note}</p>
                  </div>
                )}
              </div>

              {/* Layer 2 — our capture */}
              <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 sm:p-8">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-extrabold text-[#102B2A] text-lg flex items-center gap-2">
                    <Recycle className="w-5 h-5 text-[#187B65]" /> Our Market Capture
                  </h3>
                  {capture?.available && (
                    <span className="text-[10px] text-slate-400">
                      Updated {new Date(capture.refreshed_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
                    </span>
                  )}
                </div>
                {capture?.available ? (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { icon: Search, label: "Search impressions", value: capture.gsc?.impressions ?? 0, palette: "emerald" },
                        { icon: MousePointerClick, label: "Organic clicks", value: capture.gsc?.clicks ?? 0, palette: "mint" },
                        { icon: Recycle, label: "Verified inquiries", value: capture.recycling_os?.verified_inquiries ?? 0, palette: "emerald" },
                        { icon: CheckCircle2, label: "Completed pickups", value: capture.recycling_os?.completed_pickups ?? 0, palette: "gold" },
                      ].map((m) => (
                        <PulseRing key={m.label} value={m.value} size={116} palette={m.palette}>
                          <m.icon className="w-4 h-4 text-[#187B65] mb-1" />
                          <div className="text-lg font-extrabold text-[#102B2A]"><AnimatedNumber value={m.value} /></div>
                          <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-slate-500 text-center leading-tight">{m.label}</div>
                        </PulseRing>
                      ))}
                    </div>
                    <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-[#f6f9f8] border border-slate-100 px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Google visibility (CTR)</div>
                        <div className="text-xl font-extrabold text-[#102B2A]">{capture.gsc ? `${capture.gsc.ctr}%` : "—"}</div>
                        <div className="text-[10px] text-slate-400">avg position {capture.gsc?.position ?? "—"} · Canada-filtered</div>
                      </div>
                      <div className="rounded-xl bg-[#f6f9f8] border border-slate-100 px-4 py-3">
                        <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Site engagement</div>
                        <div className="text-xl font-extrabold text-[#102B2A]">{capture.ga ? formatCount(capture.ga.sessions) : "—"}</div>
                        <div className="text-[10px] text-slate-400">sessions, 28 days · {capture.ga ? `${capture.ga.engagement_rate}% engaged` : "GA pending"}</div>
                      </div>
                    </div>
                    <p className="mt-4 text-[11px] text-slate-400">
                      Verified platform records only: Search Console (Canada), Google Analytics, Recycling OS. Internal test records excluded.
                    </p>
                  </>
                ) : (
                  <div className="rounded-2xl bg-[#f6f9f8] border border-dashed border-[#187B65]/30 p-6 text-center text-sm text-slate-500">
                    {capture?.note || "Capture data pending first sync."}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="text-center mt-8">
            <Link
              to="/demand"
              className="inline-flex items-center gap-2 rounded-full bg-[#102B2A] text-white font-bold px-6 py-3 text-sm hover:bg-[#125C4E] transition-colors"
            >
              <Globe2 className="w-4 h-4" /> Explore national demand by province & city
            </Link>
          </div>
        </div>
      </section>
    </LazySection>
  );
}