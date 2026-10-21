import { useEffect, useState } from "react";
import { ExternalLink, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { RECYCLING_FACTS } from "@/lib/recyclingFacts";

export default function WhyRecycling() {
  const [facts, setFacts] = useState(RECYCLING_FACTS);

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.RecyclingFact.filter({}, { sort: "-verified_date", limit: 12 });
        if (items && items.length) setFacts(items);
      } catch {
        // keep curated facts if the fact database is unreachable
      }
    })();
  }, []);

  const latestVerified = facts.reduce((max, f) => (f.verified_date && f.verified_date > max ? f.verified_date : max), facts[0]?.verified_date || "");

  return (
    <section id="why-recycling" className="bg-white">
      <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">
            <ShieldCheck className="w-4 h-4" /> The evidence
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Why recycling matters, by the numbers</h2>
          <p className="mt-4 text-slate-600">
            Every pickup we run is a real diversion opportunity. These figures come from published government and
            United Nations research — not marketing claims — and they're checked and refreshed automatically.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {facts.map((f) => (
            <div key={f.key} className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-7 flex flex-col">
              <div className="text-4xl md:text-5xl font-extrabold text-[#1d9e56] tracking-tight">{f.stat}</div>
              <div className="mt-2 font-bold text-[#0c3b24] leading-snug">{f.label}</div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed flex-1">{f.detail}</p>
              <div className="mt-5 pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
                {f.source_url ? (
                  <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#0c3b24] hover:text-[#1d9e56] transition-colors inline-flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-[#1d9e56]" /> {f.source_name}
                  </a>
                ) : (
                  <span className="text-xs font-bold text-[#0c3b24]">{f.source_name}</span>
                )}
                {f.verified_date && <span className="text-[10px] font-semibold text-slate-400 whitespace-nowrap">Verified {f.verified_date}</span>}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-400">
          Figures verified {latestVerified} and refreshed automatically each month from official sources. Sources: Environment and Climate Change Canada, International Aluminium Institute, UN Global E-waste Monitor.
        </p>
      </div>
    </section>
  );
}