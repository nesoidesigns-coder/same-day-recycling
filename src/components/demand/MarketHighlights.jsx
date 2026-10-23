export default function MarketHighlights({ data }) {
  const growth = data.fastest_growing, province = data.highest_province;
  const items = [
    ['Fastest-growing service',growth?.label,growth ? `+${growth.mom_pct}% vs previous month` : 'Needs positive growth in comparable monthly keyword cohorts.',growth],
    ['Highest-demand province',province?.name,province ? `${province.value.toLocaleString('en-CA')} estimated searches` : 'Needs matching keyword, source and measure coverage in at least two provinces.',province],
  ];
  return <div className="grid gap-4 sm:grid-cols-2">{items.map(([label,value,note,metric]) => <article key={label} className="rounded-2xl border border-market-line bg-market-surface p-5">
    <h3 className="text-sm font-bold text-market-muted">{label}</h3>
    <p className="mt-3 text-xl font-extrabold text-market-ink">{value || 'Awaiting comparable data'}</p>
    <p className="mt-2 text-xs text-market-accent">{note}</p>
    {metric && <p className="mt-3 text-[11px] leading-relaxed text-market-muted">Calculated from estimates · {metric.sources.join(' · ')} · {metric.scope} · {metric.period} · retrieved {metric.refreshed_at || metric.updated || 'not supplied'}</p>}
    {province && label === 'Highest-demand province' && <p className="mt-2 text-[11px] text-market-muted">Highest among recorded comparable provinces only, not necessarily all Canada.</p>}
  </article>)}</div>;
}