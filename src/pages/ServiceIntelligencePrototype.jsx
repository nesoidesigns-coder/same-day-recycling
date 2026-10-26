import { useState } from "react";
import { useSEO } from "@/lib/seo";
import Footer from "@/components/sdr/Footer";
import SiHeader from "@/components/si/SiHeader";
import ServiceHero from "@/components/home/ServiceHero";
import TransparencyPanel from "@/components/home/TransparencyPanel";
import ImpactEstimator from "@/components/home/ImpactEstimator";
import CanadaSignalSection from "@/components/canada/CanadaSignalSection";
import ServiceCards from "@/components/si/ServiceCards";
import BookingSteps from "@/components/home/BookingSteps";
import PricingPreview from "@/components/home/PricingPreview";
import LocalIntelPreview from "@/components/si/LocalIntelPreview";
import ContractorEntrance from "@/components/si/ContractorEntrance";
import TrustStrip from "@/components/sdr/TrustStrip";
import FinalServiceCta from "@/components/si/FinalServiceCta";
import useServiceIntelligence from "@/components/si/useServiceIntelligence";
import { CITIES } from "@/lib/cities";

// The homepage — bright, service-first, powered by the Canada Signal.
// Hero → service selector → Canada Signal → categories → booking steps →
// transparent pricing → verified local coverage → contractor entrance.
export default function ServiceIntelligencePrototype() {
  useSEO({
    title: "Same Day Junk Removal & Recycling Services Across Canada | Same Day Recycling",
    description: "Same-day junk removal, furniture and appliance pickup across Canada. Transparent published pricing, verified local coverage and live service intelligence — powered by Recycling OS.",
    path: "/",
    robots: "index, follow",
  });

  const REPORTING_DAYS = 90;
  const [city, setCity] = useState("Vancouver");

  const si = useServiceIntelligence({ days: REPORTING_DAYS, city });

  const mapLocations = (si.coverage.locations || [])
    .filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng))
    .map((l) => ({ ...l, state: si.coverage.statusFor(l.name) }));

  const cityNames = CITIES.map((c) => c.name);

  return (
    <div className="min-h-screen bg-si-bg font-body text-si-ink">
      <SiHeader />

      <ServiceHero />

      {/* Customer trust and proof — verified reviews and promises only */}
      <TrustStrip />

      <main className="mx-auto flex max-w-[1280px] flex-col gap-10 px-4 py-10 md:px-8 md:py-14">
        {/* Signature tool — instant, shareable impact estimate */}
        <ImpactEstimator />

        {/* Signature technology — one coherent, interactive gauge */}
        <CanadaSignalSection />

        {/* Clear service categories */}
        <ServiceCards
          city={city}
          prices={si.prices.data?.prices}
          coverage={si.coverage}
          cities={cityNames}
        />

        {/* Simple explanation of how booking works */}
        <BookingSteps />

        {/* How pricing, matching, confirmation and disposal actually work */}
        <TransparencyPanel />

        {/* Transparent pricing preview */}
        <PricingPreview prices={si.prices.data?.prices} />

        {/* Verified local service coverage */}
        <LocalIntelPreview
          city={city}
          onCity={setCity}
          locations={mapLocations}
          coverage={si.coverage}
          prices={si.prices.data?.prices}
          resources={si.resources}
          activity={si.activity.data}
        />

        {/* Final booking action */}
        <FinalServiceCta />
      </main>

      <div className="mx-auto max-w-[1280px] px-4 pb-10 md:px-8">
        <ContractorEntrance />
      </div>

      <Footer />
    </div>
  );
}