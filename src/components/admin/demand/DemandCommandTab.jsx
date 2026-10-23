import MarketObservatory from '@/components/demand/MarketObservatory';
import RexRecommendPanel from '@/components/admin/demand/RexRecommendPanel';

export default function DemandCommandTab({ report, onOpenImport }) {
  return <div><MarketObservatory onImport={onOpenImport} showHistory/><RexRecommendPanel report={report}/></div>;
}