import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldCheck, MapPin, Globe, ArrowRight, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { CATEGORY_LABELS } from "@/lib/recyclingTaxonomy";

export default function FeaturedProviders() {
  const [providers, setProviders] = useState(null);

  useEffect(() => {
    let active = true;
    base44.entities.Provider
      .filter({ verification: "verified" }, { sort: "-created_date", limit: 6 })
      .then((res) => active && setProviders(res.items || res))
      .catch(() => active && setProviders([]));
    return () => { active = false; };
  }, []);

  return (
    <section className="bg-[#f4f7f5] py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
          <div className="max-w-2xl">
            <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Featured</div>
            <h2 className="text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">Verified providers</h2>
            <p className="mt-3 text-slate-600 text-lg">
              Confirmed members of the national network, with accepted materials and booking options on every listing.
            </p>
          </div>
          <Link
            to="/recycling"
            className="inline-flex items-center gap-2 rounded-full bg-[#102B2A] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#0a3020] transition-colors shrink-0"
          >
            Full directory <ArrowRight className="w-4 h-4 text-[#187B65]" />
          </Link>
        </div>

        {providers === null ? (
          <div className="flex items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading providers…
          </div>
        ) : providers.length === 0 ? (
          <p className="text-center text-sm text-slate-500 py-10">
            No verified providers listed yet — the network grows weekly.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {providers.map((p) => (
              <article key={p.id} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex items-start justify-between gap-3">
                  <Link to={`/provider/${p.id}`} className="font-bold text-[#102B2A] hover:text-[#187B65] leading-tight">
                    {p.name}
                  </Link>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 text-[10px] font-bold shrink-0">
                    <ShieldCheck className="w-3 h-3" /> Verified
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {[p.city, p.province].filter(Boolean).join(", ") || "Canada"}
                </div>
                {p.accepted_categories?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {p.accepted_categories.slice(0, 3).map((k) => (
                      <span key={k} className="rounded-full bg-[#f4f7f5] text-[#102B2A] px-2.5 py-1 text-[10px] font-bold">
                        {CATEGORY_LABELS[k] || k}
                      </span>
                    ))}
                    {p.accepted_categories.length > 3 && (
                      <span className="rounded-full bg-slate-100 text-slate-500 px-2.5 py-1 text-[10px] font-bold">
                        +{p.accepted_categories.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <Link to={`/provider/${p.id}`} className="font-bold text-[#187B65] hover:underline">View details</Link>
                  {p.website && (
                    <a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-slate-500 hover:text-[#187B65]">
                      <Globe className="w-3.5 h-3.5" /> Website
                    </a>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}