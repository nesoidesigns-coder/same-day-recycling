import { lazy, Suspense } from 'react';
import MarketHistory from '@/components/admin/demand/MarketHistory';
import MarketRankings from '@/components/admin/demand/MarketRankings';
import MarketKeywords from '@/components/admin/demand/MarketKeywords';
import MarketMovers from '@/components/admin/demand/MarketMovers';
import MarketTrends from '@/components/admin/demand/MarketTrends';
import MarketComparison from '@/components/demand/MarketComparison';
import MarketMetricTypes from '@/components/demand/MarketMetricTypes';
import ProviderOptions from '@/components/demand/ProviderOptions';
const MarketHeatmap = lazy(() => import('@/components/demand/MarketHeatmap'));

export default function MarketExplore({ data, filters, onChange, onImport }) {
  const region=(r) => onChange({...filters,province:r.province_code || (r.geo_type === 'province' ? r.key : ''),city:r.geo_type === 'city' ? r.name : ''});
  return <div className="mt-5 space-y-4">
    <MarketComparison data={data} onSelect={(category) => onChange({...filters,category})}/>
    <MarketHistory data={data}/>
    <Suspense fallback={<div className="rounded-2xl border border-market-line p-8 text-sm text-market-muted" role="status">Loading geographic demand map…</div>}><MarketHeatmap data={data} onSelect={region}/></Suspense>
    <MarketRankings data={data} onSelect={region}/>
    <MarketKeywords data={data}/>
    <MarketMovers data={data}/>
    <MarketTrends data={data}/>
    <MarketMetricTypes data={data}/>
    <details className="rounded-2xl border border-market-line p-4"><summary className="cursor-pointer text-sm font-bold text-market-accent">Data providers and connection requirements</summary><div className="mt-4"><ProviderOptions onImport={onImport}/></div></details>
  </div>;
}