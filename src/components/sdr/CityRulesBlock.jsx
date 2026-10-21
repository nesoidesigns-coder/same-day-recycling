import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Recycle, Loader2, HandHeart, Info } from "lucide-react";

// Dynamic content block: pulls and displays local recycling & donation rules
// for a given city (web-researched, cached server-side).
export default function CityRulesBlock({ city, province }) {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!city) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("cityRules", { city, province });
        if (!cancelled) setData(res?.data?.rules?.length ? res.data : null);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => { cancelled = true; };
  }, [city, province]);

  if (failed || (data === null && !failed)) {
    if (failed) return null;
    return (
      <div className="rounded-3xl border border-slate-100 bg-white p-6 flex items-center gap-3 text-slate-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Loading {city} recycling rules…
      </div>
    );
  }
  if (!data) return null;

  return (
    <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8">
      <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3 flex items-center gap-2">
        <Recycle className="w-4 h-4" /> Local rules
      </div>
      <h3 className="text-2xl font-bold tracking-tight text-[#102B2A]">
        Recycling &amp; donation rules in {city}
      </h3>
      <div className="mt-6 grid md:grid-cols-2 gap-4">
        {data.rules.map((r) => (
          <div key={r.title} className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-5">
            <div className="font-bold text-[#102B2A]">{r.title}</div>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{r.detail}</p>
          </div>
        ))}
      </div>
      {data.donation_programs?.length > 0 && (
        <div className="mt-8">
          <div className="text-sm font-bold text-[#102B2A] flex items-center gap-2">
            <HandHeart className="w-4 h-4 text-[#187B65]" /> Donation pickup &amp; drop-off in {city}
          </div>
          <div className="mt-4 grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {data.donation_programs.map((p) => (
              <div key={p.name} className="rounded-2xl border border-[#187B65]/20 bg-[#f4f7f5] p-4">
                <div className="font-semibold text-[#102B2A] text-sm">{p.name}</div>
                <div className="text-xs text-slate-500 mt-1">{p.accepts}</div>
              </div>
            ))}
          </div>
        </div>
      )}
      {data.source_note && (
        <p className="mt-6 text-xs text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5" /> Sources: {data.source_note}. Rules can change — confirm with your municipality.
        </p>
      )}
    </div>
  );
}