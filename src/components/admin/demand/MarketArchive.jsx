import MarketHistory from '@/components/admin/demand/MarketHistory';
import MarketRankings from '@/components/admin/demand/MarketRankings';
import MarketTrends from '@/components/admin/demand/MarketTrends';

export default function MarketArchive({ data, onSelect }) {
  const history = data.history_coverage;
  return <div className="mt-5 space-y-4">
    <p className="text-xs leading-relaxed text-market-muted">Source history: {history?.first_period || 'not yet retrieved'}{history?.last_period ? ` to ${history.last_period}` : ''}. Original reporting months are preserved; periods before the website launched are supported. Search volume, seasonality and regional coverage come only from licensed source observations.</p>
    <MarketHistory data={data} />
    <MarketRankings data={data} onSelect={onSelect} />
    <MarketTrends data={data} />
  </div>;
}