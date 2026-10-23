import { Link } from 'react-router-dom';
import MarketObservatory from '@/components/demand/MarketObservatory';

// Market history is independent of company Search Console availability.
// Source volumes are never relabeled as Google Trends indices.
export default function MarketDemandGauges() {
  return <div className="mt-5 space-y-3">
    <MarketObservatory showHistory />
    <Link to="/admin/demand" className="inline-block text-sm font-bold text-primary underline">Manage historical sources in Market Intelligence</Link>
  </div>;
}