import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Wand2, Loader2, CheckCircle2, History } from "lucide-react";

// Auto SEO runner: runs the scheduled AI strategist on demand and shows the
// recent Auto SEO analysis history saved by the weekly workflow.
export default function AutoSeoRunner() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);

  const loadHistory = async () => {
    try {
      const { items } = await base44.entities.ResearchResult.filter({}, { sort: "-created_date", limit: 50 });
      setHistory(items.filter((r) => (r.topic || "").startsWith("Auto SEO")).slice(0, 5));
    } catch { /* history is best-effort */ }
  };
  useEffect(() => { loadHistory(); }, []);

  const run = async () => {
    setBusy(true); setError(""); setResult(null);
    try {
      const res = await base44.functions.invoke("autoSeo", {});
      if (res.data?.error) setError(res.data.error);
      else setResult(res.data);
      await loadHistory();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Run failed");
    }
    setBusy(false);
  };

  return (
    <div className="holo-panel-deep rounded-2xl border border-[#54D9AE]/15 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Wand2 className="w-5 h-5 text-[#54D9AE]" /> Auto SEO analysis</h2>
        <button
          onClick={run}
          disabled={busy}
          className="self-start inline-flex items-center gap-2 rounded-full bg-[#187B65] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {busy ? "Analyzing…" : "Run analysis now"}
        </button>
      </div>
      <p className="mt-2 text-sm text-slate-400">Pulls fresh Search Console queries, runs the SEO strategist AI, and files the report. Also runs automatically every week via the Auto SEO workflow.</p>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}
      {result && (
        <div className="mt-5 space-y-2 text-sm">
          {result.notes && <p className="text-slate-300">{result.notes}</p>}
          {(result.quick_wins || []).map((w, i) => (
            <div key={`w${i}`} className="rounded-xl bg-black/20 border border-white/5 p-3 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#54D9AE] shrink-0 mt-0.5" />
              <span className="text-slate-200">{w}</span>
            </div>
          ))}
          {(result.actions || []).map((a, i) => (
            <div key={`a${i}`} className="rounded-xl bg-black/20 border border-white/5 p-3 flex items-start gap-2">
              <span className="w-4 shrink-0" />
              <span className="text-slate-300">{a}</span>
            </div>
          ))}
        </div>
      )}
      {history.length > 0 && (
        <div className="mt-6 border-t border-white/5 pt-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Recent reports</div>
          <div className="mt-3 space-y-2">
            {history.map((h) => (
              <div key={h.id} className="rounded-xl bg-black/20 border border-white/5 p-3 text-xs">
                <div className="font-bold text-[#54D9AE]">{h.topic}</div>
                {h.summary && <p className="mt-1 text-slate-400 line-clamp-2">{h.summary}</p>}
                {(h.key_takeaways || []).slice(0, 2).map((t, i) => <p key={i} className="mt-0.5 text-slate-500">• {t}</p>)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}