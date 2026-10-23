export default function MarketImportPreview({ records }) {
  if (!records?.length) return null;
  return <section className="mt-4 rounded-xl border border-border p-4">
    <h3 className="text-sm font-bold">Review before publication: {records.length} observations</h3>
    <p className="mt-1 text-xs text-muted-foreground">Check values against the original export, especially spreadsheet extraction. Nothing is published until confirmed. Re-imports update matching observations.</p>
    <div className="mt-3 max-h-80 overflow-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead><tr>{['Keyword','Engine','Geography','Period','Measure','Value'].map((h) => <th className="p-2" key={h}>{h}</th>)}</tr></thead><tbody>{records.map((r,i) => <tr key={i} className="border-t border-border"><td className="p-2">{r.keyword}</td><td className="p-2">{r.search_engine}</td><td className="p-2">{r.geo_type}: {r.geo_key}{r.province_code ? `, ${r.province_code}` : ''}</td><td className="p-2">{r.period}</td><td className="p-2">{r.metric_type}</td><td className="p-2 font-bold">{r.metric_type === 'relative_interest' ? r.trend_index : r.metric_type.startsWith('estimated_') ? r.estimated_clicks : r.est_monthly_volume}</td></tr>)}</tbody></table></div>
  </section>;
}