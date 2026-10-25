import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SERVICES, TYPE_LABELS, CATEGORY_LABELS } from "./serviceCatalog";

// The single search field: "What service are you looking for?"
// Parses a service and optional location ("furniture removal in Kelowna"),
// reads the same live signal engine, and explains what the data shows with
// clear next actions. No registration required.

export default function PulseSearch() {
  const [q, setQ] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const run = async (e) => {
    e.preventDefault();
    const raw = q.trim();
    if (!raw) return;
    setBusy(true);
    const m = raw.match(/^(.*?)\s+(?:in|near|around)\s+(.+)$/i);
    const serviceText = (m ? m[1] : raw).trim();
    const loc = m ? m[2].replace(/,\s*(BC|AB|ON|QC|SK|MB|NS|NB|PE|NL|british columbia|alberta|ontario|quebec)$/i, "").trim() : "";
    const svc = SERVICES.find((s) => serviceText.toLowerCase().includes(s.name.toLowerCase().split(" ")[0]))
      || SERVICES.find((s) => serviceText.toLowerCase().includes(s.cats[0].split("_")[0]))
      || null;

    try {
      const params = { action: "gauge", days: 90 };
      if (loc) params.city = loc;
      const res = await base44.functions.invoke("liveIntelligence", params);
      const data = res?.data ?? res;
      let total = data?.total ?? 0;
      let matched = [];
      if (svc) {
        matched = (data?.rows || []).filter((r) => svc.cats.includes(r.key));
        total = matched.reduce((s, r) => s + r.count, 0);
      }
      setResult({ raw, serviceText, loc, svc, total, matched, cities: data?.cities || [], generated: data?.generated_at });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <form onSubmit={run} className="rounded-[24px] border border-li-steel bg-white p-3 flex flex-col sm:flex-row gap-2 shadow-sm">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="What service are you looking for?"
          aria-label="What service are you looking for?"
          className="flex-1 min-h-[52px] rounded-[16px] border border-li-steel px-5 text-base text-li-carbon placeholder:text-li-slate/70 focus:border-li-infra focus:outline-none focus:ring-2 focus:ring-li-infra/25"
        />
        <button type="submit" disabled={busy} className="min-h-[52px] rounded-[16px] bg-li-infra px-8 font-bold text-white hover:bg-li-forest transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2">
          <Search className="w-4 h-4" /> {busy ? "Checking…" : "Search"}
        </button>
      </form>

      {result && (
        <div className="mt-4 rounded-[24px] border border-li-steel bg-white p-6">
          <h3 className="text-lg font-bold text-li-carbon">
            What the signals show{result.loc ? ` for ${result.loc}` : " nationally"}
          </h3>
          <p className="mt-1.5 text-sm text-li-slate">
            {result.total > 0
              ? `${result.total} verified ${result.svc ? result.svc.name.toLowerCase() + " " : ""}demand signals in the last 90 days${result.loc ? ` in ${result.loc}` : " across Canada"} — real records, each labelled by type.`
              : "No verified signals recorded for this search yet. Demand data here only counts observations the platform can legitimately access and verify — a quiet result means no recorded signal, never a zero guarantee."}
          </p>

          {result.total > 0 && result.matched.length > 0 && (
            <div className="mt-4 space-y-2">
              {result.matched.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-3 rounded-xl bg-li-cloud border border-li-steel px-4 py-2.5">
                  <span className="text-sm font-semibold text-li-carbon">{CATEGORY_LABELS[r.key] || r.key}</span>
                  <span className="font-plex text-xs text-li-infra">
                    {Object.entries(r.demand_types).map(([t, n]) => `${TYPE_LABELS[t] || t}: ${n}`).join(" · ")}
                  </span>
                </div>
              ))}
            </div>
          )}

          {result.svc && (
            <p className="mt-4 text-sm text-li-slate">{result.svc.blurb}</p>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <Link to={`/service-finder?q=${encodeURIComponent(result.raw)}`} className="inline-flex min-h-[48px] items-center gap-2 rounded-[14px] bg-li-infra px-6 font-bold text-white hover:bg-li-forest transition-colors">
              Find matching services <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/request-service" className="inline-flex min-h-[48px] items-center gap-2 rounded-[14px] border border-li-steel bg-li-pale px-6 font-bold text-li-forest hover:border-li-infra transition-colors">
              Book a pickup
            </Link>
            <Link to="/coverage" className="inline-flex min-h-[48px] items-center rounded-[14px] px-4 text-sm font-bold text-li-infra hover:text-li-forest">
              Check coverage
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}