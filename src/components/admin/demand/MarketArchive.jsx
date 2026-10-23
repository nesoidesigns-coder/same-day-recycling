import { useState } from 'react';
import MarketHistory from '@/components/admin/demand/MarketHistory';
import MarketRankings from '@/components/admin/demand/MarketRankings';
import MarketTrends from '@/components/admin/demand/MarketTrends';
import ServiceLeaderboard from '@/components/admin/demand/ServiceLeaderboard';
import MarketHeatmap from '@/components/demand/MarketHeatmap';
import CityDemandProfile from '@/components/demand/CityDemandProfile';

// Admin historical archive: service leaderboard, geographic demand map with
// city drill-down, source history, rankings and Trends samples.
export default function MarketArchive({ data, onSelect }) {
  const [region, setRegion] = useState(null);
  const history = data.history_coverage;
  const open = (r) => { setRegion(r); onSelect?.(r); };
  return <div className="mt-5 space-y-4">
    <p className="text-xs leading-relaxed text-market-muted">Source history: {history?.first_period || 'not yet retrieved'}{history?.last_period ? ` to ${history.last_period}` : ''}. Original reporting months are preserved; periods before the website launched are supported. Search volume, seasonality and regional coverage come only from licensed source observations.</p>
    <ServiceLeaderboard data={data} />
    <MarketHeatmap data={data} onSelect={open} />
    {region && <CityDemandProfile region={region} onClose={() => setRegion(null)} />}
    <MarketHistory data={data} />
    <MarketRankings data={data} onSelect={open} />
    <MarketTrends data={data} />
  </div>;
}