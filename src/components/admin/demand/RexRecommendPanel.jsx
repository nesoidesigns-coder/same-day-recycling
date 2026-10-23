import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2, Sparkles } from "lucide-react";

// Rex's demand interpretation, embedded in the dashboard. Compact view: the
// executive summary plus the most actionable lists. Every output is an AI
// estimate, clearly labeled — never presented as verified data.
export default function RexRecommendPanel({ onOpenFull }) {
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

  const a = latest?.analysis || {};
  const topLists = [
    ["high_demand_categories", "Services that deserve attention", "category"],
    ["underserved_markets", "Cities & provinces to watch", "geography"],
    ["contractor_recruitment", "Contractor recruitment priorities", null],
  ].filter(([key]) => (a[key] || []).length > 0);

  return (
    <div className="mt-6 rounded-2xl border border-[#187B65]/25 bg-[#f6f9f8] p-5">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65] flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Rex demand interpretation
        </div>
        <span className="rounded-full bg-amber-100 text-amber-900 px-2.5 py-0.5 text-[10px] font-bold uppercase">AI estimate</span>
        <div className="ml-auto flex items-center gap-2">
          {onOpenFull && (
            <button onClick={onOpenFull} className="text-xs font-bold text-[#187B65] hover:underline">Full analysis →</button>
          )}
          <Button onClick={generate} disabled={generating} size="sm" className="gap-1.5 bg-[#187B65] hover:bg-[#125C4E]">
            {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            {generating ? "Rex is analyzing…" : latest ? "Re-run" : "Run analysis"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      {!latest ? (
        <p className="text-sm text-slate-500">
          No Rex analysis yet. Run one and Rex will interpret the demand database and recommend which services and
          cities deserve attention.
        </p>
      ) : (
        <div>
          <div className="text-[10px] text-slate-400 mb-3">
            Data period {latest.period || "—"} · generated {new Date(latest.created_date).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
          </div>
          {latest.summary && <p className="text-sm text-[#102B2A] leading-relaxed mb-4">{latest.summary}</p>}
          <div className="grid md:grid-cols-3 gap-4">
            {topLists.map(([key, label, field]) => (
              <div key={key} className="rounded-xl bg-white border border-slate-100 p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-2">{label}</div>
                <ul className="space-y-2">
                  {a[key].slice(0, 3).map((item, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-slate-600">
                      <ChevronRight className="w-3.5 h-3.5 text-[#187B65] shrink-0 mt-0.5" />
                      <span>
                        {typeof item === "object" && field ? <><span className="font-semibold text-[#102B2A]">{item[field]}</span>{" "}</> : null}
                        {typeof item === "object" ? item.finding : item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}