import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Sparkles, BarChart3, Lightbulb } from 'lucide-react';
import { fmtTime } from './useObservatory';

// AI market intelligence — extends the Business Master analysis over verified
// Observatory observations. Statistical evidence and AI recommendations are
// always visually distinguished, and numbers come only from the evidence given.
export default function AiInsights() {
  const [insights, setInsights] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const generate = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await base44.functions.invoke('observatoryFeed', { action: 'ai_insights' });
      setInsights({ list: res.data.insights || [], at: res.data.generated_at });
    } catch (e) {
      setError(e?.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  return (
    <div className="rounded-3xl border border-market-line bg-market-surface p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-market-ink">AI Market Intelligence</h3>
          <p className="mt-0.5 text-xs text-market-muted">Analysis of verified Observatory observations. Evidence and recommendations are labelled separately.</p>
        </div>
        <button onClick={generate} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white hover:bg-[#125C4E] disabled:opacity-60">
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} {busy ? 'Analyzing…' : insights ? 'Re-analyze' : 'Generate insights'}
        </button>
      </div>

      {error && <p className="mt-3 text-xs text-red-300">{error}</p>}

      {insights && (
        <>
          <p className="mt-2 text-[10px] text-market-muted">Analysis generated {fmtTime(insights.at)} from verified records only.</p>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {insights.list.length === 0 && <p className="text-xs text-market-muted">The analyst returned no insights for the current evidence set.</p>}
            {insights.list.map((ins, i) => {
              const evidence = ins.kind === 'statistical_evidence';
              return (
                <div key={i} className="rounded-2xl border border-market-line bg-market-bg px-3.5 py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest ${evidence ? 'bg-[#187B65]/20 text-[#54D9AE]' : 'bg-amber-400/15 text-amber-300'}`}>
                    {evidence ? <BarChart3 className="h-3 w-3" /> : <Lightbulb className="h-3 w-3" />}
                    {evidence ? 'Statistical evidence' : 'AI recommendation'}
                  </span>
                  <p className="mt-1.5 text-sm font-bold text-market-ink">{ins.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-market-muted">{ins.detail}</p>
                  {ins.evidence && <p className="mt-1.5 text-[11px] text-market-muted"><span className="font-bold text-market-ink">Evidence:</span> {ins.evidence}</p>}
                  {(ins.region || ins.service) && (
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-market-muted">{[ins.region, ins.service].filter(Boolean).join(' · ')}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!insights && !busy && !error && (
        <p className="mt-3 text-xs text-market-muted">Generate to analyze current verified demand, coverage and discovery observations.</p>
      )}
    </div>
  );
}