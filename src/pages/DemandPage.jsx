import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import MarketObservatory from '@/components/demand/MarketObservatory';
import ObservatoryLive from '@/components/observatory/ObservatoryLive';
import RexContextBar from '@/components/observatory/RexContextBar';

export default function DemandPage() {
  useSEO({title:'Canadian Search-Demand Observatory | Same Day Recycling',description:'Automatically presented Canadian recycling and removal search demand: the latest verified reporting period, national estimates, growth and rising categories. Independent of advertising campaigns.',path:'/demand'});
  return <main className="min-h-screen bg-market-bg py-7 text-market-ink"><div className="mx-auto max-w-6xl px-4">
    <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-market-accent"><ArrowLeft className="h-4 w-4"/>Back to home</Link>
    <RexContextBar/>
    <MarketObservatory/>
    <ObservatoryLive/>
  </div></main>;
}