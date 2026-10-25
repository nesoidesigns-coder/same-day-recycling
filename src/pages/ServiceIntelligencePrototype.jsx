import { useMemo, useState } from "react";
import { useSEO } from "@/lib/seo";
import Footer from "@/components/sdr/Footer";
import SiHeader from "@/components/si/SiHeader";
import HeroSearch from "@/components/si/HeroSearch";
import IntelligenceShowcase from "@/components/si/IntelligenceShowcase";
import ServiceCards from "@/components/si/ServiceCards";
import LocalIntelPreview from "@/components/si/LocalIntelPreview";
import ContractorEntrance from "@/components/si/ContractorEntrance";
import ConsumerIntelligenceGauge from "@/components/si/ConsumerIntelligenceGauge";
import useServiceIntelligence from "@/components/si/useServiceIntelligence";
import { keyOf } from "@/components/si/siShared";
import { CITIES } from "@/lib/cities";

// Stage 1 prototype: /prototype-service-intelligence.
// A consumer-first homepage with verified, interactive intelligence.
// The production homepage is untouched; the observatory remains at
// /prototype-observatory as the advanced experience.
export default function ServiceIntelligencePrototype() {
  useSEO({
    title: "What Can We Help You Remove? | Same Day Recycling",
    description: "Search pickup services by city, see transparent published pricing, verified local coverage and live service intelligence — powered by Recycling OS.",
    path: "/prototype-service-intelligence",
    robots: "noindex, nofollow",
  });

  const REPORTING_DAYS = 90;
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("Vancouver");

  const si = useServiceIntelligence({ days: REPORTING_DAYS, city });

  // Map dots only for cities with known coordinates (the coverage registry can
  // add names that have no map metadata yet).
  const mapLocations = useMemo(
    () => si.coverage.locations
      .filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng))
      .map((l) => ({ ...l, state: si.coverage.statusFor(l.name) })),
    [si.coverage.locations]
  );

  const cityNames = useMemo(() => CITIES.map((c) => c.name), []);
  const heroSegments = si.activitySegments;
  const heroSelIdx = heroSegments.findIndex((s) => s.key === category);

  return (
    <div className="min-h-screen bg-si-bg font-body text-si-ink">
      <SiHeader />

      {/* Section 1 — The Customer Arrival (desktop: 60% search / 40% intelligence) */}
      <section className="bg-si-bg">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 pb-14 pt-10 md:px-8 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:pt-16">
          <HeroSearch category={category} onCategory={setCategory} city={city} onCity={setCity} cities={cityNames} />
          <div className="order-last lg:order-none">
            <div className="rounded-[20px] border border-si-line bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-bold text-si-ink">Live service intelligence</h2>
                <span className="font-plex text-[10px] tracking-wide text-si-muted">RECYCLING OS · PREVIEW</span>
              </div>
              <ConsumerIntelligenceGauge
                label="Canadian service activity (compact preview)"
                segments={heroSegments}
                total={si.activityTotal}
                centerPrimary={heroSelIdx >= 0 ? String(heroSegments[heroSelIdx].value) : String(si.activityTotal)}
                centerSub={heroSelIdx >= 0 ? `${heroSegments[heroSelIdx].label}` : "recorded observations"}
                selectedIndex={heroSelIdx >= 0 ? heroSelIdx : null}
                onSelect={(i) => setCategory(i == null ? "" : heroSegments[i].key)}
                period={si.activity.data ? `Last ${si.activity.data.filters?.window_days || REPORTING_DAYS} days` : undefined}
                scope="Canada"
                source="Platform demand records"
                generatedAt={si.activity.data?.generated_at}
                emptyLabel={si.activity.isLoading ? "Loading live observations…" : si.activity.error ? "Live feed unavailable." : "No recorded observations yet."}
                className="mx-auto mt-2 max-w-[260px]"
              />
            </div>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1280px] px-4 md:px-8">
        <IntelligenceShowcase
          si={si}
          city={city}
          onCity={setCity}
          category={category}
          onCategory={setCategory}
          cities={cityNames}
        />
        <ServiceCards
          city={city}
          prices={si.prices.data?.prices}
          coverage={si.coverage}
          cities={cityNames}
        />
        <LocalIntelPreview
          city={city}
          onCity={setCity}
          locations={mapLocations}
          coverage={si.coverage}
          prices={si.prices.data?.prices}
          resources={si.resources}
          activity={si.activity.data}
        />
      </main>

      <div className="mx-auto max-w-[1280px] px-4 md:px-8">
        <ContractorEntrance />
      </div>

      <Footer />
    </div>
  );
}