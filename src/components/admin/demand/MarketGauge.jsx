const fmt = (v) => v === null || v === undefined ? '—' : Number(v).toLocaleString('en-CA');

export default function MarketGauge({ label, metric, change = false }) {
  const available = change ? metric.mom_pct !== null && metric.mom_pct !== undefined : metric.available;
  return (
    <article className="rounded-2xl border border-market-line bg-market-surface p-5 text-market-ink">
      <h3 className="min-h-10 text-sm font-bold">{label}</h3>
      <div className="my-4 flex items-center gap-4">
        <svg viewBox="0 0 80 80" className="h-16 w-16 shrink-0" aria-hidden="true">
          <circle cx="40" cy="40" r="33" fill="none" stroke="hsl(var(--market-line))" strokeWidth="5" />
          <circle cx="40" cy="40" r="33" fill="none" stroke="hsl(var(--market-accent))" strokeWidth="5" strokeDasharray={available ? '155 207' : '0 207'} strokeLinecap="round" transform="rotate(-110 40 40)" />
          <circle cx="40" cy="40" r="5" fill="hsl(var(--market-accent))" />
        </svg>
        <div className="min-w-0">
          <div className="text-2xl font-extrabold tabular-nums">{available ? change ? `${metric.mom_pct > 0 ? '+' : ''}${fmt(metric.mom_pct)}%` : fmt(metric.value) : '—'}</div>
          <div className="mt-1 text-xs text-market-muted">{available ? change ? 'Month-over-month' : metric.measure : 'Awaiting verified data'}</div>
        </div>
      </div>
      <dl className="space-y-1 text-xs leading-relaxed text-market-muted">
        <div><dt className="inline">Type: </dt><dd className="inline">{change ? 'Calculated from comparable estimates' : metric.classification || 'Estimated'}</dd></div>
        <div><dt className="inline">Scope: </dt><dd className="inline">{metric.scope}</dd></div>
        <div><dt className="inline">Period: </dt><dd className="inline">{metric.period || 'Unavailable'}{change && metric.previous_period ? ` vs ${metric.previous_period}` : ''}</dd></div>
        <div><dt className="inline">Source: </dt><dd className="inline">{metric.sources?.join(' · ') || 'No source observations on file'}</dd></div>
        {metric.updated && <div>Retrieved: {metric.updated}</div>}
      </dl>
      {change && <p className="mt-2 text-xs text-market-muted">{metric.change_note}</p>}
      <p className="mt-3 text-[11px] text-market-muted">Ring is a status indicator, not market share.</p>
    </article>
  );
}