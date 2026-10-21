import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, ArrowRight, Loader2, ClipboardCheck, UserSearch, Recycle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { REGIONS } from "@/lib/regions";

// National coverage grid — service requests are open in every province and
// territory. The verified-listing count is live directory data only; it is
// never shown as contractor coverage. Contractor recruitment is a separate
// action from customer service requests.
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
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Coverage</div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">
            Recycling &amp; Junk Removal Requests Across Canada
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            Service requests are open in all 10 provinces and 3 territories — cities, towns, rural
            communities and remote locations. Tell us what needs to go and we'll work to connect you
            with a qualified local service provider.
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
                      <MapPin className="w-5 h-5 text-[#187B65]" />
                      <div>
                        <div className="font-bold text-[#102B2A] leading-tight">{r.name}</div>
                        <div className="text-xs text-slate-500">{r.capital}</div>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold shrink-0">
                      <ClipboardCheck className="w-3 h-3" /> Service Requests Open
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#187B65] shrink-0" />
                      {n > 0
                        ? `${n} verified directory listing${n === 1 ? "" : "s"} available`
                        : "No verified directory listings yet — requests still accepted"}
                    </div>
                    <div className="mt-3 flex flex-col gap-1.5">
                      <Link
                        to={`/request-service?province=${r.code}`}
                        className="inline-flex items-center justify-between rounded-xl bg-[#187B65] text-white font-bold px-4 py-2.5 text-xs hover:bg-[#125C4E] transition-colors"
                      >
                        Request Service <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <div className="flex gap-1.5">
                        <Link
                          to="/contractors"
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 text-slate-700 font-semibold px-3 py-2 text-[11px] hover:border-[#187B65] hover:text-[#187B65] transition-colors"
                        >
                          <UserSearch className="w-3.5 h-3.5" /> Find Local Contractor
                        </Link>
                        <Link
                          to={`/recycling?loc=${encodeURIComponent(r.name)}`}
                          className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl border border-slate-200 text-slate-700 font-semibold px-3 py-2 text-[11px] hover:border-[#187B65] hover:text-[#187B65] transition-colors"
                        >
                          <Recycle className="w-3.5 h-3.5" /> Recycling Directory
                        </Link>
                      </div>
                    </div>
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