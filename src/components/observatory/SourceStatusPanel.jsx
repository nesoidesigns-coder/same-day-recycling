import { SOURCE_STATUS_META, fmtTime } from './useObservatory';

const STATUS_ORDER = { connected: 0, synchronizing: 1, delayed: 2, historical_data_only: 3, unavailable: 4 };

// Source connection panel: status, cadence and the last successful
// synchronization time for every data source the Observatory draws on.
export default function SourceStatusPanel({ data }) {
  const sources = [...(data?.sources || [])].sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9));

  return (
    <div className="rounded-3xl border border-market-line bg-market-surface p-4 sm:p-6">
      <h3 className="text-sm font-extrabold text-market-ink">Data Source Connections</h3>
      <p className="mt-0.5 text-xs text-market-muted">Status reflects the last successful synchronization against each source's real cadence.</p>
      <div className="mt-4 space-y-2">
        {sources.map((s) => {
          const meta = SOURCE_STATUS_META[s.status] || SOURCE_STATUS_META.unavailable;
          return (
            <div key={s.key} className="flex flex-wrap items-center gap-2 rounded-2xl border border-market-line bg-market-bg px-3.5 py-2.5">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} aria-hidden="true" />
              <span className={`text-xs font-bold ${meta.text}`}>{meta.label}</span>
              <span className="text-xs font-semibold text-market-ink flex-1 min-w-[160px]">{s.label}</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-market-muted">{s.layer}</span>
              <span className="text-[11px] text-market-muted">Last sync: {fmtTime(s.last_sync)}</span>
              <span className="text-[10px] text-market-muted">({s.cadence})</span>
              {s.note && <p className="w-full text-[11px] leading-snug text-market-muted pl-4">{s.note}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}