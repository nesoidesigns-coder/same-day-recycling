import { MARKET_PROVIDERS } from '@/lib/marketProviders';

export default function ProviderOptions({ onImport }) {
  return <section className="rounded-2xl border border-market-line bg-market-surface p-5 text-market-ink">
    <h3 className="font-bold">Independent market data sources</h3>
    <p className="mt-2 text-sm text-market-muted">No advertising campaign is required. These are alternative sources, not accounts whose campaign performance defines the market. Exports are supported now; a provider is not connected merely because it appears here.</p>
    <div className="mt-4 grid gap-3 md:grid-cols-2">{MARKET_PROVIDERS.map((p) => <article key={p.id} className="rounded-xl border border-market-line p-4">
      <h4 className="font-bold">{p.label} <span className="ml-2 text-[10px] uppercase tracking-wider text-market-muted">Source export supported</span></h4>
      <p className="mt-2 text-xs leading-relaxed text-market-muted">{p.note}</p>
      <p className="mt-2 text-xs leading-relaxed text-market-muted">{p.requirements}</p>
      <p className="mt-2 text-[11px] text-market-muted">Cadence: {p.cadence}</p>
      {p.url && <a href={p.url} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-bold text-market-accent underline">Provider requirements</a>}
    </article>)}</div>
    {onImport && <button onClick={onImport} className="mt-4 rounded-xl border border-market-accent px-4 py-2 text-sm font-bold text-market-accent">Import a licensed market dataset</button>}
  </section>;
}