export default function MarketRankings({ data, onSelect }) {
  return <div className="grid gap-4 lg:grid-cols-2">{[['Highest-demand provinces',data.provinces],['Highest-demand cities',data.cities]].map(([title,rows]) => (
    <section key={title} className="rounded-2xl border border-market-line bg-market-surface p-5">
      <h3 className="font-bold">{title}</h3><p className="mt-1 text-xs text-market-muted">{data.regional_period || data.latest_period || 'No reporting period'} · source-reported estimates for tracked keywords only</p>
      {!rows.length && <p className="py-6 text-sm text-market-muted">No observations at this geography level. National estimates are never projected into regions.</p>}
      <ol className="mt-4 space-y-4">{rows.slice(0,8).map((r) => <li key={r.key}>
        <button className="flex w-full items-start justify-between gap-4 text-left text-sm" onClick={() => onSelect(r)}><span className="font-semibold text-market-ink">{r.name}{r.geo_type === 'city' && r.province_code ? `, ${r.province_code}` : ''}</span><span className="font-bold tabular-nums text-market-accent">{Number(r.value).toLocaleString('en-CA')}</span></button>
        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-market-line"><div className="h-full rounded-full bg-market-accent" style={{width:`${rows[0].value ? r.value/rows[0].value*100 : 0}%`}} /></div>
        <p className="mt-1 text-[11px] text-market-muted">Estimated · {r.sources.join(' · ')} · {r.keywords} keyword groups</p>
      </li>)}</ol>
      <p className="mt-4 text-xs text-market-muted">Rankings reflect recorded keyword coverage, not a census of all searches.</p>
    </section>
  ))}</div>;
}