import { useState } from "react";
import { Loader2, TrendingUp, Lightbulb } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SeoInsightsTab() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const analyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const kwRes = await base44.functions.invoke("searchConsoleKeywords", {});
      const keywords = (kwRes.data?.keywords || []).slice(0, 100);
      if (!keywords.length) {
        setError("No search data yet. Google Search Console needs a few days of traffic before insights appear.");
        setLoading(false);
        return;
      }
      const res = await base44.functions.invoke("seoInsights", { keywords });
      setResult(res.data || null);
    } catch (e) {
      setError(e?.message || "SEO analysis failed");
    }
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-slate-100 p-5">
      <h2 className="font-bold text-[#0c3b24] flex items-center gap-2 mb-2">
        <TrendingUp className="w-4 h-4 text-[#1d9e56]" /> SEO booster
      </h2>
      <p className="text-sm text-slate-500 mb-4">
        Pulls your real Google search data, then the AI turns it into concrete wins: better page titles, metas and content ideas for every city page.
      </p>
      <button
        onClick={analyze}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-full bg-[#1d9e56] text-white font-bold px-6 py-3 text-sm hover:bg-[#17a04c] transition-colors disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
        {loading ? "Analyzing…" : "Analyze with latest search data"}
      </button>
      {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

      {result && (
        <div className="mt-6 flex flex-col gap-5">
          {result.quick_wins?.length > 0 && (
            <div>
              <h3 className="font-bold text-[#0c3b24] text-sm mb-2">Quick wins (ranked 4-15, worth pushing to page 1)</h3>
              <div className="flex flex-col gap-2">
                {result.quick_wins.map((q, i) => (
                  <div key={i} className="rounded-xl bg-[#f4f7f5] p-3 text-sm">
                    <p className="font-semibold text-[#0c3b24]">&ldquo;{q.query}&rdquo; &rarr; {q.page}</p>
                    <p className="text-slate-600">{q.why}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {result.page_recommendations?.map((r, i) => (
            <div key={i} className="rounded-xl border border-slate-100 p-4">
              <p className="font-bold text-[#0c3b24] text-sm">{r.page}</p>
              {r.focus_keywords?.length > 0 && (
                <p className="text-xs text-slate-500 mt-1">Target: {r.focus_keywords.join(", ")}</p>
              )}
              <p className="text-sm text-slate-700 mt-2"><strong>Title:</strong> {r.title_suggestion}</p>
              <p className="text-sm text-slate-700 mt-1"><strong>Meta:</strong> {r.meta_suggestion}</p>
              {r.content_ideas?.length > 0 && (
                <ul className="list-disc pl-5 mt-2 text-sm text-slate-600">
                  {r.content_ideas.map((idea, j) => (
                    <li key={j}>{idea}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
          {result.notes && <p className="text-sm text-slate-600 border-t border-slate-100 pt-4">{result.notes}</p>}
        </div>
      )}
    </div>
  );
}