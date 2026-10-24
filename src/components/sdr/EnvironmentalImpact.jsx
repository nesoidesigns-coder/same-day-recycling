import { useEffect, useState } from "react";
import { ExternalLink, Leaf, Zap, PackageCheck, ShieldCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { RECYCLING_FACTS } from "@/lib/recyclingFacts";

const HIGHLIGHTS = [
  { key: "canada_diversion_rate", icon: Leaf, title: "Waste diverted from landfills" },
  { key: "aluminum_energy", icon: Zap, title: "Energy saved" },
  { key: "ewaste_global", icon: PackageCheck, title: "Materials recovered" },
];

const SUPPORTING_KEYS = ["landfill_methane", "plastics_canada", "ns_leadership"];

export default function EnvironmentalImpact() {
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

  const byKey = {};
  for (const f of facts) byKey[f.key] = f;
  const highlights = HIGHLIGHTS.map((h) => ({ ...h, fact: byKey[h.key] })).filter((h) => h.fact);
  const supporting = SUPPORTING_KEYS.map((k) => byKey[k]).filter(Boolean);
  const latestVerified = facts.reduce((max, f) => (f.verified_date && f.verified_date > max ? f.verified_date : max), "");

  return (
    <section id="environmental-impact" className="bg-[#f4f7f5]">
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">
              <ShieldCheck className="w-4 h-4" /> Our environmental impact
            </div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Real impact, measured by science</h2>
            <p className="mt-4 text-slate-600">
              Every load we sort is measured against the published research on what recycling actually achieves:
              waste kept out of landfills, energy saved, and valuable materials recovered instead of buried.
            </p>
          </div>
          <p className="text-xs text-slate-400 md:text-right md:max-w-[220px]">
            All figures from official government and UN research, refreshed automatically each month.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {highlights.map(({ key, icon: Icon, title, fact }) => (
            <div key={key} className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-8 flex flex-col">
              <span className="w-11 h-11 rounded-2xl bg-[#187B65]/15 text-[#187B65] flex items-center justify-center mb-5">
                <Icon className="w-5 h-5" />
              </span>
              <div className="text-5xl font-extrabold text-[#187B65] tracking-tight">{fact.stat}</div>
              <div className="mt-2 font-bold text-[#102B2A]">{title}</div>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed flex-1">{fact.label}. {fact.detail}</p>
              <div className="mt-5 pt-4 border-t border-slate-100">
                {fact.source_url ? (
                  <a href={fact.source_url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-[#102B2A] hover:text-[#187B65] transition-colors inline-flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-[#187B65]" /> {fact.source_name}
                  </a>
                ) : (
                  <span className="text-xs font-bold text-[#102B2A]">{fact.source_name}</span>
                )}
                {fact.verified_date && <span className="block text-[10px] font-semibold text-slate-400 mt-1">Verified {fact.verified_date}</span>}
              </div>
            </div>
          ))}
        </div>

        {supporting.length > 0 && (
          <div className="mt-5 grid md:grid-cols-3 gap-5">
            {supporting.map((f) => (
              <div key={f.key} className="rounded-2xl border border-slate-200 bg-white/60 p-5">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-[#102B2A]">{f.stat}</span>
                  <span className="text-xs font-bold text-slate-500">{f.label}</span>
                </div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{f.detail}</p>
                {f.source_url && (
                  <a href={f.source_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-[#187B65] transition-colors">
                    <ExternalLink className="w-3 h-3 text-[#187B65]" /> {f.source_name}
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        <p className="mt-6 text-xs text-slate-400">
          Figures verified {latestVerified}. Sources: Environment and Climate Change Canada, International Aluminium Institute, UN Global E-waste Monitor.
        </p>
      </div>
    </section>
  );
}