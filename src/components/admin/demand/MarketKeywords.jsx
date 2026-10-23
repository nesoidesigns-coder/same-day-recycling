import { CATEGORY_LABELS } from '@/lib/demandShared';
export default function MarketKeywords({ data }) {
  return <section className="rounded-2xl border border-market-line bg-market-surface p-5">
    <h3 className="font-bold">High-opportunity service keywords</h3>
    <p className="mt-1 text-xs leading-relaxed text-market-muted">Screening rule: rising monthly demand first, then low advertising competition, then larger recorded volume. Not a revenue forecast, SEO score or measure of contractor competition.</p>
    {!data.opportunities.length ? <p className="py-8 text-sm text-market-muted">Awaiting sourced keyword estimates; no opportunity rankings are invented.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm">
      <thead className="border-b border-market-line text-xs text-market-muted"><tr>{['Keyword / included variations','Service','Estimated searches','MoM','Ad competition','Source / period / scope'].map((h) => <th key={h} className="p-3 font-semibold">{h}</th>)}</tr></thead>
      <tbody>{data.opportunities.map((r) => <tr className="border-b border-market-line" key={r.keyword}>
        <td className="p-3 font-semibold">{r.keyword}{r.variants.length > 0 && <span className="mt-1 block text-xs font-normal text-market-muted">Includes: {r.variants.join(', ')}; counted once</span>}</td>
        <td className="p-3 text-xs text-market-muted">{CATEGORY_LABELS[r.category]}</td><td className="p-3 font-bold tabular-nums text-market-accent">{r.value.toLocaleString('en-CA')}<span className="block text-[11px] font-normal text-market-muted">{r.measure === 'monthly_volume' ? 'Monthly estimate' : 'Average / unspecified basis'}</span></td>
        <td className="p-3">{r.mom_pct === null ? '—' : `${r.mom_pct > 0 ? '+' : ''}${r.mom_pct}%`}</td><td className="p-3 capitalize">{r.competition}</td>
        <td className="p-3 text-xs text-market-muted">{r.sources.join(' · ')}<span className="block">{r.period} · {r.scope}</span><span className="block">Retrieved {r.updated}</span></td>
      </tr>)}</tbody>
    </table></div>}
  </section>;
}