import { useState } from "react";
import { useSEO } from "@/lib/seo";
import Footer from "@/components/sdr/Footer";
import IntelShell from "@/components/intel/IntelShell";
import HomeInstruments from "@/components/home/HomeInstruments";
import TrustStrip from "@/components/sdr/TrustStrip";
import ImpactEstimator from "@/components/home/ImpactEstimator";
import CanadaSignalSection from "@/components/canada/CanadaSignalSection";
import ServiceCards from "@/components/si/ServiceCards";
import BookingSteps from "@/components/home/BookingSteps";
import TransparencyPanel from "@/components/home/TransparencyPanel";
import PricingPreview from "@/components/home/PricingPreview";
import LocalIntelPreview from "@/components/si/LocalIntelPreview";
import ContractorEntrance from "@/components/si/ContractorEntrance";
import FinalServiceCta from "@/components/si/FinalServiceCta";
import useServiceIntelligence from "@/components/si/useServiceIntelligence";
import { CITIES } from "@/lib/cities";

// The homepage, composed in the platform's one design language: the reference
// dashboard frame and instruments first (live readings), then the service
// proof, pricing and booking sections underneath.
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
    <>
      <IntelShell>
        <div className="space-y-3">
          <HomeInstruments />

          <TrustStrip />

          <ImpactEstimator />

          <CanadaSignalSection />

          <ServiceCards
            city={city}
            prices={si.prices.data?.prices}
            coverage={si.coverage}
            cities={cityNames}
          />

          <BookingSteps />

          <TransparencyPanel />

          <PricingPreview prices={si.prices.data?.prices} />

          <LocalIntelPreview
            city={city}
            onCity={setCity}
            locations={mapLocations}
            coverage={si.coverage}
            prices={si.prices.data?.prices}
            resources={si.resources}
            activity={si.activity.data}
          />

          <FinalServiceCta />

          <ContractorEntrance />
        </div>
      </IntelShell>

      <Footer />
    </>
  );
}