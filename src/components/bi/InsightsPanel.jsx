import { useState } from "react";
import { Loader2, Sparkles, ShieldCheck, Sigma, TrendingUp, AlertTriangle } from "lucide-react";
import { base44 } from "@/api/base44Client";

// AI insight panel for the Live BI dashboard. Sends the verified summary the
// dashboard already renders to the biInsights function; every returned insight
// carries a kind badge so verified data is never confused with estimates or
// predictions.
const KIND = {
  verified_data: { label: "Verified data", icon: ShieldCheck, chip: "bg-[#187B65]/10 text-[#187B65]" },
  estimate: { label: "Estimate", icon: Sigma, chip: "bg-amber-100 text-amber-800" },
  prediction: { label: "AI prediction", icon: TrendingUp, chip: "bg-slate-100 text-slate-600" },
};
const PRIORITY = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-slate-100 text-slate-600",
};

export default function InsightsPanel({ data }) {
  const [insights, setInsights] = useState([]);
  const [generatedAt, setGeneratedAt] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      // Only verified, already-rendered metrics are sent — no raw records, no PII.
      const summary = {
        window_days: data.window_days,
        acquisition: data.acquisition,
        traffic: {
          sessions: data.traffic?.sessions,
          returning_visitors: data.traffic?.returning_visitors,
          attributed_pct: data.traffic?.attributed_pct,
          sources: (data.traffic?.sources || []).slice(0, 6),
          top_services: (data.traffic?.top_services || []).slice(0, 6),
          city_demand: data.traffic?.city_demand,
          daily: data.traffic?.daily,
          owner_bot: data.traffic?.owner_bot,
        },
        performance: data.performance,
        integrity: {
          error_count: data.integrity?.error_count,
          warning_count: data.integrity?.warning_count,
          checks: (data.integrity?.checks || []).map((c) => ({ check: c.check, severity: c.severity, summary: c.summary })),
        },
      };
      const res = await base44.functions.invoke("biInsights", { summary });
      setInsights(res.data.insights || []);
      setGeneratedAt(res.data.generated_at);
    } catch (e) {
      setError(e?.message || "Could not generate insights.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#187B65]" /> AI business insights</h2>
            <p className="mt-1 text-[11px] text-slate-500 max-w-xl">Analyzes only the verified metrics shown on this dashboard. Every insight is labelled: verified data, estimate, or AI prediction — and none are stored as facts.</p>
          </div>
          <button onClick={generate} disabled={loading} className="inline-flex items-center gap-2 rounded-full bg-[#102B2A] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-[#54D9AE]" />}
            {loading ? "Analyzing…" : insights.length ? "Regenerate" : "Generate insights"}
          </button>
        </div>
        {error && <p className="mt-3 rounded-xl bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700">{error}</p>}
        {generatedAt && !loading && (
          <p className="mt-2 text-[10px] text-slate-400">Generated {new Date(generatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })} from the metrics loaded at refresh time.</p>
        )}
      </div>

      {insights.length > 0 && (
        <div className="space-y-3">
          {insights.map((ins, i) => {
            const k = KIND[ins.kind] || KIND.estimate;
            return (
              <div key={i} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <k.icon className="w-3.5 h-3.5 text-[#187B65]" />
                  <span className="text-xs font-bold text-[#102B2A]">{ins.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${k.chip}`}>{k.label}</span>
                  {ins.priority && <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${PRIORITY[ins.priority] || PRIORITY.low}`}>{ins.priority} priority</span>}
                  {ins.area && <span className="text-[10px] text-slate-400">{ins.area}</span>}
                </div>
                <p className="mt-2 text-xs text-slate-600 leading-relaxed">{ins.finding}</p>
                <p className="mt-1.5 text-[11px] text-slate-500"><strong className="text-slate-600">Evidence:</strong> {ins.evidence}</p>
                <p className="mt-1.5 rounded-xl bg-[#eef4f0] px-3 py-2 text-[11px] text-[#102B2A]"><strong>Recommended next step:</strong> {ins.recommendation}</p>
              </div>
            );
          })}
        </div>
      )}

      {!loading && insights.length === 0 && !error && (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-8 text-center text-xs text-slate-500">
          <AlertTriangle className="mx-auto w-5 h-5 text-slate-300 mb-2" />
          No insights yet — press "Generate insights" to analyze the current verified metrics.
        </div>
      )}
    </div>
  );
}