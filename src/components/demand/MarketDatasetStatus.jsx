export default function MarketDatasetStatus({ data }) {
  const status = data.data_status;
  return <div role="status" className="mt-5 rounded-xl border border-market-line px-4 py-3 text-xs leading-relaxed text-market-muted">
    <strong className="text-market-accent">{data.connection_status}</strong>
    <p className="mt-2">{status?.note}</p>
    <span className="mt-2 block">Latest source period: {data.latest_period || 'Not retrieved'} · Scope: {data.scope}</span>
    <span className="block">Dataset retrieved: {data.overview.refreshed_at || 'Not yet retrieved'}</span>
    <span className="block">Source: {data.overview.sources.join(' · ') || 'Historical provider retrieval pending'} · {data.overview.available ? data.overview.measure : 'No verified measure loaded'}{data.overview.cadences?.length > 0 ? ` · Cadence: ${data.overview.cadences.join(' · ')}` : ''}</span>
    <p className="mt-2">Provider-published estimates, not live searches. The Canadian market predates this website.</p>
  </div>;
}