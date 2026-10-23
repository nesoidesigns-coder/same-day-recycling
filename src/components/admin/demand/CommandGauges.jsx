import MarketGauge from '@/components/admin/demand/MarketGauge';

const fmt = (v) => v === null || v === undefined ? '—' : Number(v).toLocaleString('en-CA');

// Fact card for name/count gauges: value, provider, period, last update,
// comparison and availability. No decorative ring — availability is stated.
function FactCard({ title, metric, value, valueLabel, note }) {
  const available = !!metric?.available;
  const mom = metric?.mom_pct;
  return (
    <article className="rounded-2xl border border-market-line bg-market-surface p-5 text-market-ink">
      <h3 className="min-h-10 text-sm font-bold">{title}</h3>
      <div className="my-4">
        {available ? (
          <>
            <p className="text-xl font-extrabold text-market-ink">{value}</p>
            <p className="mt-0.5 text-[11px] text-market-muted">{valueLabel}</p>
          </>
        ) : (
          <>
            <p className="text-xl font-bold text-market-muted">—</p>
            <p className="mt-0.5 text-[11px] text-market-muted">Awaiting market data connection.</p>
          </>
        )}
      </div>
      <dl className="mt-3 space-y-1 text-xs leading-relaxed text-market-muted">
        <div>Period: {metric?.period || 'Unavailable'}</div>
        {mom !== null && mom !== undefined && Number.isFinite(Number(mom)) && (
          <div>vs prior: {Number(mom) > 0 ? '+' : ''}{fmt(mom)}%</div>
        )}
        <div>Source: {metric?.sources?.length ? metric.sources.join(' · ') : 'Awaiting market data connection.'}</div>
        {metric?.updated && <div>Retrieved: {metric.refreshed_at || metric.updated}</div>}
        <div>Status: {available ? 'Available' : 'Data pending'}</div>
      </dl>
      {note && <p className="mt-2 text-[11px] leading-relaxed text-market-muted">{note}</p>}
    </article>
  );
}

// VIEW A — Canadian market demand. Six command gauges over the national scope,
// each with a traceable source, reporting period and availability state.
// Website performance (Search Console) is never mixed in — it lives in
// Private Performance and the Search Authority dashboard.
export default function CommandGauges({ data, loading, error }) {
  const overview = data?.overview || null;
  const topService = (data?.categories || []).filter((c) => c.available).sort((a, b) => (b.value || 0) - (a.value || 0))[0] || null;
  const topCity = (data?.cities || [])[0] || null;
  const opportunities = data?.opportunities || [];
  const daily = overview?.available ? Math.round((Number(overview.value) || 0) / 30) : null;

  return (
    <section aria-label="Command gauges" className="rounded-3xl bg-market-bg p-4 text-market-ink sm:p-6">
      <h2 className="text-lg font-extrabold sm:text-xl">Canadian Market Demand — Command Gauges</h2>
      <p className="mt-1 text-xs text-market-muted">Market-wide estimates only. Same Day Recycling's own site performance is reported separately, never combined.</p>
      {loading && <p role="status" className="flex items-center gap-2 py-8 text-sm text-market-muted"><span className="h-4 w-4 animate-spin rounded-full border-2 border-market-line border-t-market-accent" />Assembling command gauges…</p>}
      {error && !data && <p role="alert" className="py-8 text-sm text-market-muted">Market data could not be loaded right now.</p>}
      {data && (
        <>
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <MarketGauge label="Estimated Monthly Canadian Searches" metric={overview} level="national" />
            <FactCard
              title="Estimated Daily Search Demand"
              metric={overview}
              value={daily !== null ? fmt(daily) : '—'}
              valueLabel="searches/day · derived: monthly estimate ÷ 30"
              note="Derived from the monthly estimate for readability; the underlying source reports monthly, not daily."
            />
            <FactCard
              title="Highest-Demand Service"
              metric={topService}
              value={topService ? topService.label : '—'}
              valueLabel={topService ? `${fmt(topService.value)} est. searches/mo` : 'no service-level estimates on file'}
            />
            <FactCard
              title="Highest-Demand City"
              metric={topCity}
              value={topCity ? `${topCity.name}${topCity.province_code ? `, ${topCity.province_code}` : ''}` : '—'}
              valueLabel={topCity ? `${fmt(topCity.value)} est. searches/mo · city-level estimates` : 'no city-level estimates on file'}
              note={topCity ? undefined : 'National estimates are never projected into cities; city gauges appear when a regional dataset is retrieved.'}
            />
            <MarketGauge label="Market Demand Growth" metric={overview} change />
            <FactCard
              title="Available Market Opportunities"
              metric={overview}
              value={fmt(opportunities.length)}
              valueLabel="tracked terms passing the screening rule"
              note={opportunities.length ? `Top of list: ${opportunities[0].keyword}.` : 'Opportunities appear when keyword estimates with demand are on file.'}
            />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-market-muted">{data.methodology}</p>
        </>
      )}
    </section>
  );
}