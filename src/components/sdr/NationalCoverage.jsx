import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, Rocket, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { REGIONS } from "@/lib/regions";
import { CITIES } from "@/lib/cities";

export default function NationalCoverage() {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    let active = true;
    base44.entities.Provider
      .aggregate({ query: { verification: "verified" }, groupBy: "province" })
      .then((res) => {
        if (!active) return;
        const map = {};
        for (const row of res.rows || []) map[row.province] = row.count;
        setCounts(map);
      })
      .catch(() => active && setCounts({}));
    return () => { active = false; };
  }, []);

  return (
    <section id="national-coverage" className="bg-white py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mb-10">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Coverage</div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0c3b24] tracking-tight">
            Provinces and territories
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            Built for all 10 provinces and 3 territories. Verified listings and live service are shown only where
            confirmed — everywhere else, partner applications are open.
          </p>
        </div>

        {counts === null ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Checking coverage…
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {REGIONS.map((r) => {
              const n = counts[r.code] || 0;
              return (
                <div
                  key={r.code}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <MapPin className={`w-5 h-5 ${n > 0 ? "text-[#1d9e56]" : "text-slate-300"}`} />
                      <div>
                        <div className="font-bold text-[#0c3b24] leading-tight">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.capital}</div>
                      </div>
                    </div>
                    {n > 0 ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold shrink-0">
                        <ShieldCheck className="w-3 h-3" /> {n} verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 border border-slate-200 px-2.5 py-1 text-[10px] font-bold shrink-0">
                        <Rocket className="w-3 h-3" /> Expanding
                      </span>
                    )}
                  </div>

                  {r.code === "BC" && n > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {CITIES.slice(0, 5).map((c) => (
                        <Link
                          key={c.slug}
                          to={`/junk-removal-${c.slug}`}
                          className="rounded-full bg-[#f4f7f5] text-[#0c3b24] px-2.5 py-1 text-[10px] font-bold hover:bg-[#1d9e56]/10 transition-colors"
                        >
                          {c.name} · same-day
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      {n > 0 ? "Verified directory listings available" : "No verified listings yet"}
                    </span>
                    {n > 0 ? (
                      <Link
                        to={`/recycling?loc=${encodeURIComponent(r.name)}`}
                        className="inline-flex items-center gap-1 font-bold text-[#1d9e56] hover:underline shrink-0"
                      >
                        Browse <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <Link
                        to="/contractors"
                        className="inline-flex items-center gap-1 font-bold text-slate-600 hover:text-[#1d9e56] shrink-0"
                      >
                        Apply <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}