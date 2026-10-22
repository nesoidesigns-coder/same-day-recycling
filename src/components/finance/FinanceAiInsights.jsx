import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Send, AlertTriangle, TrendingUp, CircleAlert } from "lucide-react";

const SEV = {
  good: { color: "text-[#54D9AE]", border: "border-[#187B65]/40", icon: TrendingUp },
  watch: { color: "text-[#e2b04a]", border: "border-amber-400/40", icon: CircleAlert },
  action: { color: "text-red-300", border: "border-red-400/40", icon: AlertTriangle },
};

export default function FinanceAiInsights({ tenant }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState("");

  const analyze = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await base44.functions.invoke("financeIntelligence", {});
      setResult(data.insights || null);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not analyze your books.");
    }
    setLoading(false);
  };

  const ask = async (e) => {
    e.preventDefault();
    const q = question.trim();
    if (!q || asking) return;
    setAsking(true); setError("");
    try {
      const { data } = await base44.functions.invoke("financeIntelligence", { question: q });
      setAnswer(data.answer || "");
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not answer that.");
    }
    setAsking(false);
  };

  return (
    <div className="holo-panel holo-panel-deep rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#54D9AE]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">AI financial analyst</h3>
        </div>
        {!result && (
          <button onClick={analyze} disabled={loading} className="rounded-full bg-[#187B65] text-white font-bold px-4 py-2 text-xs disabled:opacity-50">
            {loading ? "Analyzing…" : "Analyze my books"}
          </button>
        )}
      </div>

      {error && <div className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="w-4 h-4 animate-spin text-[#54D9AE]" /> Reading your ledger and computing insights…
        </div>
      )}

      {result && (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-white font-medium">{result.summary}</p>
          {(result.insights || []).map((ins, i) => {
            const sev = SEV[ins.severity] || SEV.watch;
            const Icon = sev.icon;
            return (
              <div key={i} className={"rounded-xl border bg-black/30 px-3 py-2.5 " + sev.border}>
                <div className={"flex items-center gap-1.5 text-xs font-bold " + sev.color}><Icon className="w-3.5 h-3.5" /> {ins.title}</div>
                <div className="mt-1 text-xs text-white/70">{ins.detail}</div>
              </div>
            );
          })}
          {result.tax_note && (
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-xs text-white/60">
              <span className="font-bold text-white/80">Tax note: </span>{result.tax_note}
            </div>
          )}
          <button onClick={analyze} disabled={loading} className="text-[11px] font-bold text-[#54D9AE] hover:underline disabled:opacity-50">Re-analyze</button>
        </div>
      )}

      <form onSubmit={ask} className="mt-4 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={asking ? "Thinking…" : "Ask about your books — e.g. how did profit trend?"}
          className="flex-1 rounded-full bg-black/30 border border-[#187B65]/30 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:border-[#54D9AE] focus:outline-none"
        />
        <button type="submit" disabled={!question.trim() || asking} aria-label="Ask" className="w-10 h-10 rounded-full bg-[#187B65] text-white flex items-center justify-center disabled:opacity-50 shrink-0">
          {asking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      {answer && <div className="mt-3 rounded-xl border border-[#187B65]/40 bg-black/30 px-3 py-2.5 text-sm text-white/80">{answer}</div>}
      {tenant?.business_name && !result && !loading && (
        <p className="mt-2 text-[11px] text-white/40">Answers come only from the {tenant.business_name} ledger records — nothing is invented or estimated.</p>
      )}
    </div>
  );
}