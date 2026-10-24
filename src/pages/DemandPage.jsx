import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useSEO } from '@/lib/seo';
import MarketPulseHero from '@/components/demand/MarketPulseHero';
import MarketObservatory from '@/components/demand/MarketObservatory';
import ObservatoryLive from '@/components/observatory/ObservatoryLive';
import ServiceExplorer from '@/components/demand/ServiceExplorer';

export default function DemandPage() {
  useSEO({title:'Market Pulse | Canadian Recycling & Removal Market Intelligence | Same Day Recycling',description:'Market Pulse: a living Canadian service intelligence experience. Explore verified recycling and removal demand, regional activity, and ask Rex for guidance, availability or an instant booking.',path:'/demand'});
  return <main className="min-h-screen bg-market-bg py-7 text-market-ink"><div className="mx-auto max-w-6xl px-4">
    <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-market-accent"><ArrowLeft className="h-4 w-4"/>Back to home</Link>
    <MarketPulseHero/>
    <div className="mt-6"><MarketObservatory/></div>
    <ObservatoryLive/>
    <div className="mt-6"><ServiceExplorer/></div>
  </div></main>;
}