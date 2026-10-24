import { LAYER_META, fmtTime } from './useObservatory';

const BAR = { live: 'bg-[#54D9AE]', recent: 'bg-amber-300', historical: 'bg-market-muted' };

// Live service-demand counters. Every value is a verified record count —
// zero is shown when the verified count is zero, never a placeholder.
export default function ObservatoryCounters({ data }) {
  const counters = Object.values(data?.counters || {});
  const max = Math.max(...counters.map((c) => c.value || 0), 1);
  const signals = data?.historical_signals || [];

  return (
    <div className="rounded-3xl border border-market-line bg-market-surface p-4 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-extrabold text-market-ink">Live Service Demand Counters</h3>
        <span className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Verified records only</span>
      </div>
      <p className="mt-0.5 text-xs text-market-muted">Zero means zero. No value is ever estimated or padded.</p>

      <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
        {counters.map((c) => {
          const layer = LAYER_META[c.layer] || LAYER_META.recent;
          return (
            <div key={c.label} className="rounded-2xl border border-market-line bg-market-bg px-3.5 py-3">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest ${layer.tone}`}>{layer.label}</span>
              <p className="mt-1.5 text-2xl font-extrabold text-market-ink">{c.value}</p>
              <p className="mt-0.5 text-[11px] leading-snug text-market-muted">{c.label}</p>
            </div>
          );
        })}
      </div>

      <h4 className="mt-6 text-xs font-extrabold uppercase tracking-widest text-market-muted">Historical search-interest indicators</h4>
      <p className="mt-1 text-[11px] text-market-muted">
        Google Trends relative interest (0–100 index within its own window) and provider-reported volumes, exactly as the source published them. Indexes are never converted into invented search volumes.
      </p>
      {signals.length ? (
        <div className="mt-3 space-y-2.5">
          {signals.map((s) => (
            <div key={s.keyword}>
              <div className="flex items-baseline justify-between gap-2 text-xs">
                <span className="font-bold text-market-ink">{s.keyword}</span>
                <span className="text-market-muted">{s.measure === 'monthly_volume' ? `${Number(s.value).toLocaleString('en-CA')} searches/mo · ${s.period}` : `index ${s.value} · ${s.period}`} · retrieved {fmtTime(s.retrieved_at)}</span>
              </div>
              <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                <div className={`h-1.5 rounded-full ${BAR.historical}`} style={{ width: `${Math.min(100, Math.max(3, Math.round((Number(s.value) / (s.measure === 'monthly_volume' ? max || 1 : 100)) * 100)))}%` }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-xs text-market-muted">No verified search-interest dataset is available yet. This section stays empty rather than showing estimates.</p>
      )}
    </div>
  );
}