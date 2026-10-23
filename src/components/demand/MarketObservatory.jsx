import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2, Globe2, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import MarketFilters from '@/components/admin/demand/MarketFilters';
import MarketGauge from '@/components/admin/demand/MarketGauge';
import MarketHighlights from '@/components/demand/MarketHighlights';
import MarketExplore from '@/components/demand/MarketExplore';
const DEFAULTS={province:'',city:'',category:'all',periodFrom:'',periodTo:'',engine:'google',measure:'monthly_volume',provider:''};
const CORE=['junk_removal','furniture_removal','appliance_removal','recycling','demolition_cleanup'];

export default function MarketObservatory({ compact=false, onImport }) {
  const [filters,setFilters]=useState(DEFAULTS);
  const query=useQuery({queryKey:['marketObservatory',filters],queryFn:async () => (await base44.functions.invoke('demandReport',{view:'command',filters})).data,staleTime:60000,refetchInterval:900000,retry:false});
  const data=query.data, shown=data?.categories.filter((c) => !compact || CORE.includes(c.category)) || [];
  return <section aria-label="Canadian Market Observatory" className="rounded-3xl bg-market-bg p-4 text-market-ink sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-market-accent"><Globe2 className="h-4 w-4"/>Canadian Market Search Intelligence</div><h2 className="text-2xl font-extrabold sm:text-3xl">National Market Observatory</h2><p className="mt-2 max-w-3xl text-sm leading-relaxed text-market-muted">What consumers across Canada search for in recycling and removal, regardless of which company wins the customer. Industry estimates, independent of our advertising activity.</p></div><button onClick={() => query.refetch()} disabled={query.isFetching} aria-label="Reload recorded market observations" className="inline-flex items-center gap-2 rounded-full border border-market-line px-3 py-2 text-xs font-bold disabled:opacity-50"><RefreshCw className={`h-3.5 w-3.5 ${query.isFetching ? 'animate-spin' : ''}`}/>Reload observations</button></div>
    <div className="mt-5"><MarketFilters data={data || {}} filters={filters} onChange={setFilters}/></div>
    {query.isPending && <p role="status" className="flex items-center gap-2 py-12 text-sm text-market-muted"><Loader2 className="h-5 w-5 animate-spin"/>Loading recorded market estimates…</p>}
    {query.isError && <p role="alert" className="py-8 text-sm text-market-muted">{query.error?.response?.data?.error || 'Market data could not be loaded. Reload observations to try again.'}</p>}
    {data && <>
      <div role="status" className="mt-4 rounded-xl border border-market-line px-4 py-3 text-xs leading-relaxed text-market-muted"><strong className="text-market-accent">{data.connection_status}</strong><span className="mt-1 block">Engine: {data.engine} · Coverage: {data.scope} · Reporting period: {data.latest_period || 'Unavailable'} · Dataset refreshed: {data.overview.refreshed_at || 'No source refresh on file'}</span><span className="block">Source: {data.overview.sources.join(' · ') || 'No source observations for this selection'} · {filters.measure === 'monthly_average' ? 'Rolling average, not an individual month' : 'Monthly estimates, not live searches'}</span>{data.overview.reporting_windows?.length > 0 && <span className="block">Reporting windows: {data.overview.reporting_windows.join(' · ')}</span>}{data.overview.cadences?.length > 0 && <span className="block">Provider cadence: {data.overview.cadences.join(' · ')}</span>}</div>
      <p className="mt-3 text-xs leading-relaxed text-market-muted">{data.coverage_note}</p>
      <div className="mt-5 grid gap-4 sm:grid-cols-2"><MarketGauge label={filters.province || filters.city ? 'Estimated searches in selected geography' : 'Estimated Canadian searches, tracked services'} metric={data.overview} level={data.level}/><MarketGauge label="Market demand trend" metric={data.overview} change level={data.level}/></div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{shown.map((cat) => <div key={cat.category}><MarketGauge label={cat.label} metric={cat} level={data.level}/>{filters.category === 'all' && <button onClick={() => setFilters({...filters,category:cat.category})} className="mt-2 text-xs font-bold text-market-accent underline">Explore {cat.label.toLowerCase()}</button>}</div>)}</div>
      <div className="mt-4"><MarketHighlights data={data}/></div>
      {compact ? <Link to="/demand" className="mt-6 inline-block rounded-full border border-market-accent px-5 py-3 text-sm font-bold text-market-accent">Explore history, heatmaps and every service</Link> : <MarketExplore data={data} filters={filters} onChange={setFilters} onImport={onImport}/>}
      {!data.overview.available && onImport && <button onClick={onImport} className="mt-5 text-sm font-bold text-market-accent underline">Import an independent market dataset</button>}
      <p className="mt-5 text-[11px] leading-relaxed text-market-muted">{data.methodology} Reloading reads stored observations; it does not imply the provider released new data.</p>
    </>}
  </section>;
}