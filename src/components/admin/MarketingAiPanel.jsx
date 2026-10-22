import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Zap, PenLine, ArrowRight, CircleAlert } from "lucide-react";

const PRIORITY = {
  high: { text: "text-red-600", bg: "bg-red-50 border-red-200", label: "High priority" },
  medium: { text: "text-amber-600", bg: "bg-amber-50 border-amber-200", label: "Medium" },
  low: { text: "text-slate-500", bg: "bg-slate-50 border-slate-200", label: "Low" },
};

export default function MarketingAiPanel({ onOpenCocreator }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [drafting, setDrafting] = useState("");
  const [drafted, setDrafted] = useState("");
  const [chasing, setChasing] = useState(false);
  const [chaseResult, setChaseResult] = useState("");

  const analyze = async () => {
    setLoading(true); setError("");
    try {
      const { data } = await base44.functions.invoke("marketingIntelligence", {});
      setPlan(data);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not analyze marketing.");
    }
    setLoading(false);
  };

  const draftIdea = async (idea) => {
    setDrafting(idea.title); setDrafted("");
    try {
      await base44.functions.invoke("coCreator", { action: "draft", topic: idea.title + " — " + idea.angle });
      setDrafted(idea.title);
      if (onOpenCocreator) onOpenCocreator();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not draft that idea.");
    }
    setDrafting("");
  };

  const chasePending = async () => {
    const pending = (plan?.pending || []).slice(0, 8);
    if (!pending.length || chasing) return;
    setChasing(true); setChaseResult("");
    let sent = 0;
    for (const p of pending) {
      try {
        const { data } = await base44.functions.invoke("leadChase", { kind: p.kind, id: p.id });
        if (data && !data.skipped) sent += 1;
      } catch {}
    }
    setChaseResult(`AI chased ${sent} lead${sent === 1 ? "" : "s"} — drafts and owner alerts were emailed.`);
    setChasing(false);
    analyze();
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center"><Sparkles className="w-4.5 h-4.5" /></span>
          <div>
            <h3 className="font-bold text-[#102B2A]">AI Marketing Command</h3>
            <p className="text-xs text-slate-500">Advisor, content drafts and auto-outreach in one place</p>
          </div>
        </div>
        {!plan && (
          <button onClick={analyze} disabled={loading} className="rounded-full bg-[#102B2A] text-[#187B65] font-bold px-5 py-2 text-sm disabled:opacity-50">
            {loading ? "Analyzing…" : "Analyze marketing"}
          </button>
        )}
      </div>

      {error && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      {loading && <div className="mt-4 flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Reading your traffic, leads and customer questions…</div>}

      {plan && (
        <div className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-600">
            <span className="rounded-full bg-slate-100 px-3 py-1">{plan.metrics?.visits_last_7d ?? 0} visits last 7 days</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">{plan.metrics?.bookings_last_30d ?? 0} bookings last 30 days</span>
            <span className="rounded-full bg-slate-100 px-3 py-1">{plan.metrics?.quote_leads_last_30d ?? 0} quote leads last 30 days</span>
          </div>

          <p className="text-sm font-medium text-[#102B2A]">{plan.plan?.summary}</p>

          <div className="space-y-2">
            {(plan.plan?.recommendations || []).map((r, i) => {
              const p = PRIORITY[r.priority] || PRIORITY.medium;
              return (
                <div key={i} className={"rounded-xl border px-3 py-2.5 " + p.bg}>
                  <div className={"flex items-center gap-1.5 text-xs font-bold " + p.text}><CircleAlert className="w-3.5 h-3.5" /> {r.title} · {p.label}</div>
                  <div className="mt-1 text-xs text-slate-600">{r.detail}</div>
                </div>
              );
            })}
          </div>

          {(plan.plan?.content_ideas || []).length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Content ideas</h4>
              <div className="mt-2 space-y-2">
                {plan.plan.content_ideas.map((idea, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-[#102B2A] truncate">{idea.title}</div>
                      <div className="text-xs text-slate-500">{idea.angle}</div>
                    </div>
                    <button onClick={() => draftIdea(idea)} disabled={!!drafting} className="shrink-0 rounded-full bg-[#102B2A] text-[#187B65] font-bold px-3 py-1.5 text-xs disabled:opacity-50">
                      {drafting === idea.title ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><PenLine className="w-3.5 h-3.5 inline mr-1" />Draft it</>}
                    </button>
                  </div>
                ))}
              </div>
              {drafted && (
                <button onClick={onOpenCocreator} className="mt-2 flex items-center gap-1 text-xs font-bold text-[#187B65]">
                  "{drafted}" drafted — open AI Co-Creator to review &amp; publish <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          <div className="rounded-xl border border-[#187B65]/30 bg-[#f4f7f5] px-3 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold text-slate-600">
                <span className="inline-flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-[#187B65]" /> Pending outreach: {(plan.pending || []).length} new lead{(plan.pending || []).length === 1 ? "" : "s"} not yet chased
                </span>
              </div>
              {(plan.pending || []).length > 0 && (
                <button onClick={chasePending} disabled={chasing} className="rounded-full bg-[#187B65] text-white font-bold px-3 py-1.5 text-xs disabled:opacity-50">
                  {chasing ? "Chasing…" : "Chase them now"}
                </button>
              )}
            </div>
            {(plan.pending || []).map((p) => (
              <div key={p.kind + p.id} className="mt-1.5 text-[11px] text-slate-500">{p.label}: {p.name}</div>
            ))}
            {chaseResult && <div className="mt-2 text-xs font-semibold text-[#187B65]">{chaseResult}</div>}
          </div>

          <button onClick={analyze} disabled={loading} className="text-xs font-bold text-[#187B65] hover:underline disabled:opacity-50">Re-analyze</button>
        </div>
      )}
    </div>
  );
}