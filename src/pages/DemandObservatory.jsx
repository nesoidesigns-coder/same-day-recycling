import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Radio, MousePointerClick } from "lucide-react";
import { useSEO } from "@/lib/seo";
import TopBar from "@/components/sdr/TopBar";
import Footer from "@/components/sdr/Footer";
import PriceEstimator from "@/components/sdr/PriceEstimator";
import NationalPulse from "@/components/demand/NationalPulse";

export default function DemandObservatory() {
  useSEO({
    title: "The National Pulse | Canada's Live Demand Observatory & Instant Price Estimator | Same Day Recycling",
    description: "One country, one pulse: tap any sector to see live, honestly-measured Canadian demand — then get an instant, interactive price estimate for your own pickup in under a minute.",
    path: "/adi",
  });

  return (
    <div className="min-h-screen bg-li-cloud text-li-carbon">
      <TopBar />
      <main>
        {/* Hero — The National Pulse */}
        <section className="bg-li-forest text-white">
          <div className="max-w-7xl mx-auto px-4 py-14 md:py-20">
            <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-li-mint hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-plex text-xs text-li-mint mb-5">
                <Radio className="w-3.5 h-3.5 animate-pulse" /> THE NATIONAL PULSE · LIVE
              </div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                One country. One pulse.
              </h1>
              <p className="mt-5 text-lg md:text-xl text-white/70 max-w-2xl">
                Canada's live demand observatory — every sector, every province, measured honestly and
                updated continuously. Command the data with a tap. Then turn it into your price: the
                world's first interactive estimate, instantly.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a href="#national-pulse" className="rounded-full bg-li-mint text-li-forest font-bold px-7 py-3.5 hover:bg-white transition-colors flex items-center gap-2">
                  <MousePointerClick className="w-5 h-5" /> Command the pulse
                </a>
                <a href="#price-estimator" className="rounded-full border border-white/30 text-white font-bold px-7 py-3.5 hover:bg-white/10 transition-colors flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> Get my instant estimate
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Interactive national sector explorer */}
        <div className="max-w-7xl mx-auto px-4">
          <NationalPulse />
        </div>

        {/* The interactive price estimator */}
        <PriceEstimator />

        {/* Closing CTA */}
        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="rounded-3xl bg-li-forest text-white p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">See the pulse. Then book your pickup.</h2>
              <p className="mt-3 text-white/70 max-w-xl mx-auto">
                Estimates appear instantly. Book before noon and same-day pickup may be available — subject to
                contractor availability and confirmation.
              </p>
              <Link to="/request-service" className="mt-7 inline-flex rounded-full bg-li-mint text-li-forest font-bold px-8 py-4 hover:bg-white transition-colors">
                Request service now
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}