import { useState } from "react";
import { BarChart3, ExternalLink, Leaf, TrendingUp, Info } from "lucide-react";
import { PROVINCE_IMPACT, CANADA_AVERAGE, IMPACT_SOURCE } from "@/lib/provinceStats";

const pctDelta = (now, then) => Math.round((now - then) * 10) / 10;

export default function ProvinceImpact() {
  const [selected, setSelected] = useState(PROVINCE_IMPACT.find((p) => p.code === "BC"));

  const ranked = [...PROVINCE_IMPACT]
    .filter((p) => !p.notTracked)
    .sort((a, b) => b.rate - a.rate);

  return (
    <section className="bg-white py-10 md:py-20" aria-label="Provincial recycling impact statistics">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65]/10 px-4 py-1.5 text-sm font-semibold text-[#102B2A]">
            <BarChart3 className="w-4 h-4 text-[#187B65]" />
            Data-driven network
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">
            Recycling impact, province by province
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            We benchmark every market we serve against the most recent federal solid waste data — so partners and
            customers can see exactly where each province stands.
          </p>
        </div>

        {/* Province selector */}
        <div className="mt-8 flex gap-2 overflow-x-auto pb-2 -mx-4 px-4" role="tablist" aria-label="Choose a province">
          {PROVINCE_IMPACT.map((p) => (
            <button
              key={p.code}
              role="tab"
              aria-selected={selected.code === p.code}
              onClick={() => setSelected(p)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                selected.code === p.code
                  ? "bg-[#187B65] text-white"
                  : "bg-[#f4f7f5] text-[#102B2A] hover:bg-[#187B65]/10"
              }`}
            >
              {p.code}
            </button>
          ))}
        </div>

        {/* Selected province detail */}
        <div className="mt-4 rounded-3xl bg-[#f4f7f5] border border-[#187B65]/20 p-5 md:p-8">
          {selected.notTracked ? (
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[#187B65] mt-0.5 shrink-0" />
              <div>
                <h3 className="text-xl font-bold text-[#102B2A]">{selected.name}</h3>
                <p className="mt-2 text-slate-600 text-sm max-w-lg">
                  Not tracked — Statistics Canada and Environment Canada do not report solid waste diversion
                  figures for {selected.name}. We will publish its numbers the moment federal data becomes available.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">{selected.name}</h3>
                  <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-[#187B65]">
                    <TrendingUp className="w-4 h-4" />
                    {pctDelta(selected.rate, selected.rate2002)} points better than 2002
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-5xl md:text-6xl font-bold text-[#187B65] tracking-tight">
                    {selected.rate}%
                  </div>
                  <div className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500 mt-1">
                    Waste diverted (2022)
                  </div>
                </div>
              </div>

              <div className="mt-6 grid sm:grid-cols-2 gap-3">
                <div className="rounded-2xl bg-white border border-slate-100 p-4">
                  <div className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500">Diverted per person</div>
                  <div className="mt-1 text-2xl font-bold text-[#102B2A]">{selected.diverted} kg</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Canada: {CANADA_AVERAGE.diverted} kg · {selected.diverted >= CANADA_AVERAGE.diverted ? "above" : "below"} national average
                  </div>
                </div>
                <div className="rounded-2xl bg-white border border-slate-100 p-4">
                  <div className="text-xs font-bold tracking-[0.15em] uppercase text-slate-500">Sent to landfill</div>
                  <div className="mt-1 text-2xl font-bold text-[#102B2A]">{selected.disposed} kg</div>
                  <div className="text-xs text-slate-500 mt-1">
                    Canada: {CANADA_AVERAGE.disposed} kg · {selected.disposed <= CANADA_AVERAGE.disposed ? "below" : "above"} national average
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Ranked diversion rates */}
        <div className="mt-6 rounded-3xl bg-[#102B2A] p-5 md:p-8">
          <div className="flex items-center gap-2 mb-5">
            <Leaf className="w-4 h-4 text-[#54D9AE]" />
            <h3 className="font-bold text-white">Diversion rate leaderboard · 2022</h3>
          </div>
          <div className="space-y-2.5">
            {ranked.map((p) => (
              <button
                key={p.code}
                onClick={() => setSelected(p)}
                className="w-full flex items-center gap-3 text-left group"
              >
                <span className="w-24 md:w-32 shrink-0 text-sm font-semibold text-emerald-100/80 group-hover:text-white truncate">
                  {p.name}
                </span>
                <div className="flex-1 h-2.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selected.code === p.code ? "bg-[#54D9AE]" : "bg-[#187B65]"}`}
                    style={{ width: `${Math.max((p.rate / 45) * 100, 3)}%` }}
                  />
                </div>
                <span className={`w-14 text-right text-sm font-bold ${selected.code === p.code ? "text-[#54D9AE]" : "text-white"}`}>
                  {p.rate}%
                </span>
              </button>
            ))}
          </div>
          <div className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-emerald-100/60">
              National average: {CANADA_AVERAGE.rate}% diverted · Prince Edward Island and the three territories: not tracked
            </span>
            <a
              href={IMPACT_SOURCE.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#54D9AE] hover:underline"
            >
              {IMPACT_SOURCE.name.split(" — ")[0]} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-400">
          Source: {IMPACT_SOURCE.name}. Diversion rate = share of generated solid waste diverted from disposal.
        </p>
      </div>
    </section>
  );
}