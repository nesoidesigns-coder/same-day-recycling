import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, ChevronRight, MapPin, FileSignature, CheckCircle2, ArrowRight } from "lucide-react";
import InsightProvenance from "@/components/admin/demand/InsightProvenance";

const SECTIONS = [
  ["high_demand_categories", "High-demand service categories", "category"],
  ["underserved_markets", "Underserved geographic markets", "geography"],
  ["seasonal_opportunities", "Seasonal opportunities", null],
  ["rising_terms", "Rising search terms", "term"],
  ["contractor_recruitment", "Contractor recruitment opportunities", null],
];

// Rex's AI demand analysis. Every item is an AI estimate — clearly labeled,
// never presented as verified data.
export default function DemandInsightsTab() {
  const [latest, setLatest] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const { items } = await base44.entities.DemandInsight.filter({}, { sort: "-created_date", limit: 1 });
    setLatest(items?.[0] || null);
  };

  useEffect(() => { load(); }, []);

  const generate = async () => {
    setGenerating(true);
    setError("");
    try {
      await base44.functions.invoke("demandInsights", {});
      await load();
    } catch (e) {
      setError(e?.response?.data?.error || "Analysis could not be generated.");
    } finally {
      setGenerating(false);
    }
  };

  const analysis = latest?.analysis || {};

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-extrabold text-[#102B2A] text-lg flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#187B65]" /> Rex Demand Analysis
          </h2>
          <p className="text-sm text-slate-500">AI estimates based on the demand database, capture data and contractor coverage. Never presented as verified facts.</p>
        </div>
        <Button onClick={generate} disabled={generating} className="gap-2 bg-[#187B65] hover:bg-[#125C4E]">
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {generating ? "Rex is analyzing…" : "Run new analysis"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {!latest ? (
        <div className="rounded-2xl bg-[#f6f9f8] border border-dashed border-[#187B65]/30 p-6 text-center text-sm text-slate-500">
          No analysis yet — run the first one to get Rex's read on the demand data.
        </div>
      ) : (
        <div>
          <InsightProvenance insight={latest} />
          {latest.summary && (
            <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-5 mb-5 text-sm text-[#102B2A] leading-relaxed">{latest.summary}</div>
          )}
          {(analysis.next_actions || []).length > 0 && (
            <div className="rounded-2xl bg-white border border-[#187B65]/30 p-5 mb-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65] mb-3 flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5" /> Recommended next actions
              </div>
              <ul className="space-y-2">
                {analysis.next_actions.map((n, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                    <span className="text-[#102B2A]">
                      <span className="font-semibold">{n.action}</span>
                      {n.because && <span className="text-slate-500"> — because {n.because}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {(analysis.reliability || []).length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-100 p-5 mb-5">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65] mb-3">How reliable is this</div>
              <ul className="space-y-2">
                {analysis.reliability.map((r, i) => (
                  <li key={i} className="text-sm text-slate-600">
                    <span className="font-semibold text-[#102B2A]">{r.claim}</span>
                    {r.evidence && <span> — evidence: {r.evidence}</span>}
                    {r.confidence && <span className="ml-1.5 rounded-full bg-[#f6f9f8] border border-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{r.confidence}</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <div className="grid md:grid-cols-2 gap-4">
            {SECTIONS.map(([key, label, field]) => (
              (analysis[key] || []).length > 0 && (
                <div key={key} className="rounded-2xl bg-white border border-slate-100 p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65] mb-3">{label}</div>
                  <ul className="space-y-2.5">
                    {analysis[key].map((item, i) =>
                      typeof item === "object" ? (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <ChevronRight className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                          <span><span className="font-semibold text-[#102B2A]">{item[field]}</span>{" "}{item.finding}</span>
                        </li>
                      ) : (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <ChevronRight className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )
            ))}
            {(analysis.landing_page_recommendations || []).length > 0 && (
              <div className="rounded-2xl bg-white border border-slate-100 p-5 md:col-span-2">
                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65] mb-3 flex items-center gap-1.5">
                  <FileSignature className="w-3.5 h-3.5" /> Recommended local landing pages
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {analysis.landing_page_recommendations.map((r, i) => (
                    <div key={i} className="rounded-xl bg-[#f6f9f8] border border-slate-100 p-3">
                      <div className="text-sm font-bold text-[#102B2A] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#187B65]" /> {r.location}
                      </div>
                      <div className="text-xs font-semibold text-[#187B65] mt-0.5">"{r.keyword}"</div>
                      <p className="text-xs text-slate-500 mt-1">{r.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}