import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Truck, ShieldCheck } from "lucide-react";
import { useSEO } from "@/lib/seo";
import TopBar from "@/components/sdr/TopBar";
import Footer from "@/components/sdr/Footer";
import PriceEstimator from "@/components/sdr/PriceEstimator";
import ObservatoryStats from "@/components/demand/ObservatoryStats";

export default function DemandObservatory() {
  useSEO({
    title: "Canadian Demand Observatory & Instant Price Estimator | Same Day Recycling",
    description: "See live, honestly-measured Canadian removal and recycling demand — then get an instant, interactive price estimate for your own pickup in under a minute.",
    path: "/adi",
  });

  return (
    <div className="min-h-screen bg-li-cloud text-li-carbon">
      <TopBar />
      <main>
        {/* Hero */}
        <section className="bg-li-forest text-white">
          <div className="max-w-7xl mx-auto px-4 py-14 md:py-20">
            <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-li-mint hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to home
            </Link>
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 font-plex text-xs text-li-mint mb-5">
                  <span className="w-2 h-2 rounded-full bg-li-mint animate-pulse" /> LIVE · Updated continuously
                </div>
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-tight">
                  The Canadian Demand Observatory
                </h1>
                <p className="mt-4 text-lg text-white/70 max-w-xl">
                  A live, honest window into what Canada needs removed and recycled — and the world's first
                  interactive price estimator that turns that knowledge into your instant rough quote.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a href="#price-estimator" className="rounded-full bg-li-mint text-li-forest font-bold px-7 py-3.5 hover:bg-white transition-colors flex items-center gap-2">
                    <Sparkles className="w-5 h-5" /> Try the instant estimator
                  </a>
                  <a href="#live-demand" className="rounded-full border border-white/30 text-white font-bold px-7 py-3.5 hover:bg-white/10 transition-colors flex items-center gap-2">
                    See live demand
                  </a>
                </div>
              </div>
              <div className="grid gap-3">
                {[
                  { icon: Sparkles, title: "Interactive estimator", text: "Tap your items, set your distance, watch your quote appear — no forms, no phone tag." },
                  { icon: Truck, title: "Real platform data", text: "Every demand number is computed from real records and named sources — never modelled." },
                  { icon: ShieldCheck, title: "Honest by design", text: "Requests, bookings and search interest are each measured separately. Nothing is inflated." },
                ].map((c) => (
                  <div key={c.title} className="rounded-2xl bg-white/5 border border-white/10 p-5 flex gap-4">
                    <span className="w-11 h-11 shrink-0 rounded-xl bg-li-mint/20 text-li-mint flex items-center justify-center">
                      <c.icon className="w-5 h-5" />
                    </span>
                    <div>
                      <div className="font-bold">{c.title}</div>
                      <div className="text-sm text-white/60">{c.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* The world's first interactive price estimator */}
        <PriceEstimator />

        {/* Live demand intelligence */}
        <div className="max-w-7xl mx-auto px-4">
          <ObservatoryStats />
        </div>

        {/* Closing CTA */}
        <section className="pb-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="rounded-3xl bg-li-forest text-white p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">See your price. Then book your pickup.</h2>
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