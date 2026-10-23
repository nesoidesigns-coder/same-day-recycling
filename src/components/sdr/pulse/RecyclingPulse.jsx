import MarketObservatory from '@/components/demand/MarketObservatory';

export default function RecyclingPulse() {
  return <div className="bg-market-bg py-10 sm:py-14"><div className="mx-auto max-w-6xl px-4">
    <MarketObservatory compact/>
    <div className="mt-6 text-center"><a href="#quote" className="inline-block rounded-full bg-market-accent px-7 py-3 text-sm font-extrabold text-market-bg">Request Your Pickup</a></div>
  </div></div>;
}