import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Send, Quote, ListChecks } from "lucide-react";

// Ask Rex Intelligence: owner-only natural-language Q&A over funnel, Search
// Console and market data. Rex cites its sources and recommends actions;
// it cannot publish, spend, or change settings.
export default function RexIntelligenceAsk() {
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");

  const ask = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    setBusy(true);
    setError("");
    setAnswer(null);
    try {
      const res = await base44.functions.invoke("rexIntelligence", { question });
      setAnswer(res.data);
    } catch (err) {
      setError(err?.response?.data?.error || "Rex couldn't answer right now.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl bg-[#102B2A] text-emerald-50 p-5 md:p-7">
      <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#54D9AE] mb-4 inline-flex items-center gap-2">
        <Quote className="w-4 h-4" /> Ask Rex Intelligence
      </h2>
      <form onSubmit={ask} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Which market should I recruit a contractor in next, and why?"
          className="flex-1 rounded-full bg-[#0a3d31] border border-[#187B65]/40 px-5 py-3 text-sm text-white placeholder:text-emerald-100/40 focus:outline-none focus:border-[#54D9AE]"
        />
        <button type="submit" disabled={busy} className="rounded-full bg-[#187B65] text-white font-bold px-5 py-3 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-60 inline-flex items-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-amber-300">{error}</p>}
      {answer && (
        <div className="mt-5 space-y-4">
          <p className="text-sm leading-relaxed text-emerald-50">{answer.answer}</p>
          {answer.findings?.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#54D9AE] mb-1.5">Findings (cited)</div>
              <ul className="space-y-1.5 text-xs text-emerald-100/90">
                {answer.findings.slice(0, 6).map((f, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-[#54D9AE] mt-0.5">•</span>
                    <span><span className="font-semibold text-white">{f.claim}</span> <span className="text-emerald-100/60">— {f.source}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {answer.actions?.length > 0 && (
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#54D9AE] mb-1.5 inline-flex items-center gap-1.5">
                <ListChecks className="w-3.5 h-3.5" /> Recommended actions
              </div>
              <ul className="space-y-1.5 text-xs text-emerald-100/90">
                {answer.actions.slice(0, 6).map((a, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase shrink-0 mt-0.5 ${a.priority === "highest" ? "bg-[#54D9AE] text-[#102B2A]" : "bg-[#187B65]/30 text-emerald-100"}`}>
                      {a.priority}
                    </span>
                    <span><span className="font-semibold text-white">{a.action}</span> <span className="text-emerald-100/60">— {a.rationale}</span></span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {answer.data_windows && (
            <p className="text-[10px] text-emerald-100/40">
              Data windows: funnel {answer.data_windows.funnel} · search {answer.data_windows.search}
            </p>
          )}
        </div>
      )}
    </div>
  );
}