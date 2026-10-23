import { lazy, Suspense, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2, Globe2, ChevronDown, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MarketGauge from '@/components/admin/demand/MarketGauge';
import MarketHighlights from '@/components/demand/MarketHighlights';
import MarketDatasetStatus from '@/components/demand/MarketDatasetStatus';
const MarketArchive = lazy(() => import('@/components/admin/demand/MarketArchive'));

// Automated observatory: no date selectors, reporting-range controls or engine
// toggles on public surfaces. The report endpoint determines the latest verified
// reporting period itself, compares it against the prior month in the
// background, and the source's published cadence governs when new data arrives
// (this view only revalidates a stored report — it never implies new provider
// data). Geography defaults to national; province exploration is optional.
const PROVINCE_NAMES = { AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick', NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories', NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec', SK: 'Saskatchewan', YT: 'Yukon' };

const chipCls = 'inline-flex items-center gap-1.5 rounded-full border border-market-accent/50 bg-market-accent/10 px-3 py-1.5 text-xs font-bold text-market-accent';

export default function MarketObservatory({ compact = false, onImport, showHistory = false }) {
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [category, setCategory] = useState('all');
  const [showProvinces, setShowProvinces] = useState(false);
  const filters = { category, province, city, engine: 'google' };
  const query = useQuery({
    queryKey: ['marketObservatory', province, category, city],
    queryFn: async () => (await base44.functions.invoke('demandReport', { view: 'command', filters })).data,
    staleTime: 60000, refetchInterval: 900000, retry: false,
  });
  const data = query.data;
  const shown = data?.categories || [];
  const geoLabel = city ? `${city}, ${province}` : province ? PROVINCE_NAMES[province] || province : '';
  const scopeLabel = geoLabel || 'Canada';
  const selectRegion = (region) => { setProvince(region.province_code || region.key); setCity(region.geo_type === 'city' ? region.name : ''); };
  return <section aria-label="Canadian Market Observatory" className="rounded-3xl bg-market-bg p-4 text-market-ink sm:p-7">
    <div>
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-market-accent"><Globe2 className="h-4 w-4" />Canadian Market Search Intelligence</div>
      <h2 className="text-2xl font-extrabold sm:text-3xl">National Market Observatory</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-market-muted">What consumers across Canada search for in recycling and removal, regardless of which company wins the customer. Industry estimates, independent of our advertising activity — always the latest verified reporting period.</p>
    </div>
    {query.isPending && <p role="status" className="flex items-center gap-2 py-12 text-sm text-market-muted"><Loader2 className="h-5 w-5 animate-spin" />Loading market intelligence…</p>}
    {query.isError && <p role="alert" className="py-8 text-sm text-market-muted">{query.error?.response?.data?.error || 'Market data could not be loaded right now.'}</p>}
    {data && <>
      {(province || category !== 'all') && (
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs text-market-muted">Viewing:</span>
          {province && <button onClick={() => { setProvince(''); setCity(''); }} className={chipCls}><X className="h-3 w-3" />{geoLabel}</button>}
          {category !== 'all' && <button onClick={() => setCategory('all')} className={chipCls}><X className="h-3 w-3" />{data.categories.find((c) => c.category === category)?.label || category}</button>}
          <button onClick={() => { setProvince(''); setCity(''); setCategory('all'); }} className="text-xs font-bold text-market-accent underline">All of Canada</button>
        </div>
      )}
      <MarketDatasetStatus data={data} />
      <p className="mt-3 text-xs leading-relaxed text-market-muted">{data.coverage_note}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <MarketGauge label={province ? `Estimated searches in ${scopeLabel}` : 'Estimated Canadian searches, tracked services'} metric={data.overview} level={data.level} />
        <MarketGauge label="Market demand trend" metric={data.overview} change level={data.level} />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((cat) => <div key={cat.category}>
          <MarketGauge label={cat.label} metric={cat} level={data.level} />
          {!compact && category === 'all' && <button onClick={() => setCategory(cat.category)} className="mt-2 text-xs font-bold text-market-accent underline">Explore {cat.label.toLowerCase()}</button>}
        </div>)}
      </div>
      <div className="mt-4"><MarketHighlights data={data} /></div>
      {!compact && data.provinces?.length > 0 && (
        <div className="mt-4 rounded-2xl border border-market-line bg-market-surface p-4">
          <button onClick={() => setShowProvinces(!showProvinces)} className="flex w-full items-center justify-between gap-2 text-left text-sm font-bold text-market-ink" aria-expanded={showProvinces}>
            Explore demand by province <span className="text-xs font-normal text-market-muted">optional — national data stays shown</span><ChevronDown className={`h-4 w-4 text-market-accent transition-transform ${showProvinces ? 'rotate-180' : ''}`} />
          </button>
          {showProvinces && (
            <div className="mt-3 flex flex-wrap gap-2">
              {data.provinces.map((p) => (
                <button key={p.key || p.name} onClick={() => { setProvince(p.key); setCity(''); }} className="inline-flex items-center gap-2 rounded-full border border-market-line px-3 py-1.5 text-xs font-bold text-market-ink hover:border-market-accent hover:text-market-accent transition-colors">
                  {p.name}
                  {Number.isFinite(p.mom_pct) && <span className={p.mom_pct > 0.5 ? 'text-[#54D9AE]' : p.mom_pct < -0.5 ? 'text-amber-300' : 'text-market-muted'}>{p.mom_pct > 0 ? '+' : ''}{p.mom_pct}%</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {showHistory && <Suspense fallback={<p role="status" className="mt-5 text-xs text-market-muted">Loading historical views…</p>}><MarketArchive data={data} onSelect={selectRegion} /></Suspense>}
      {compact ? <Link to="/demand" className="mt-6 inline-block rounded-full border border-market-accent px-5 py-3 text-sm font-bold text-market-accent">Explore the full Canadian observatory</Link> : null}
      {!data.overview.available && onImport && <button onClick={onImport} className="mt-5 text-sm font-bold text-market-accent underline">Import an independent market dataset</button>}
      <p className="mt-5 text-[11px] leading-relaxed text-market-muted">{data.methodology} Indicators recalculate automatically when verified observations are retrieved or imported; reloading this page does not fetch new provider history. Source authorization and backfill are managed in administration.</p>
    </>}
  </section>;
}