import { useMemo, useState } from "react";
import { useSEO } from "@/lib/seo";
import useLiveGauge from "@/hooks/useLiveGauge";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { LIVE_CATEGORIES, LIVE_CATEGORY_SHORT } from "@/lib/liveCategories";
import IntelHeader from "@/components/intel/IntelHeader";
import Footer from "@/components/sdr/Footer";
import LandingHero from "@/components/landing/LandingHero";
import BookingCard from "@/components/landing/BookingCard";
import PopularRightNow from "@/components/landing/PopularRightNow";
import ServiceTiles from "@/components/landing/ServiceTiles";
import LiveIntelligenceSection from "@/components/landing/LiveIntelligenceSection";
import HowItWorksStrip from "@/components/landing/HowItWorksStrip";
import PartnerStrip from "@/components/landing/PartnerStrip";

const periodLabel = (days) => ({ 7: "7-day window", 30: "30-day window", 90: "90-day window" }[days] || `${days}-day window`);

// The public face of the platform: what Canada is asking for right now, the
// three-step way to book it, and the same verified feed the operator console
// runs on — nothing shown here is estimated.
export default function ServiceIntelligencePrototype() {
  useSEO({
    title: "Same Day Recycling | Same-Day Junk Removal Across Canada",
    description:
      "Real demand, real people, cleaner Canada. Enter your postal code for an instant estimate, book a verified local contractor, and see live service intelligence across the country.",
    path: "/",
    robots: "index, follow",
  });

  const cov = useCoverageStatus();
  const [days, setDays] = useState(30);
  const { data: gauge, loading } = useLiveGauge({ days, province: "", city: "", category: "" });

  const rows = useMemo(
    () =>
      Object.keys(LIVE_CATEGORIES).map((key) => ({
        key,
        label: LIVE_CATEGORIES[key],
        short: LIVE_CATEGORY_SHORT[key],
        count: gauge?.rows?.find((r) => r.key === key)?.count || 0,
      })),
    [gauge]
  );

  const updatedAt = gauge?.generated_at
    ? new Date(gauge.generated_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div className="min-h-screen bg-[hsl(var(--ri-ivory))] text-lm-ink">
      <IntelHeader />

      <LandingHero
        total={gauge?.total || 0}
        cities={gauge?.cities || []}
        periodLabel={periodLabel(days)}
        loading={loading}
        updatedAt={updatedAt}
      />

      <div className="mx-auto mt-4 max-w-[1280px] px-4">
        <div className="grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <BookingCard />
          </div>
          <div className="lg:col-span-4">
            <PopularRightNow rows={rows} total={gauge?.total || 0} loading={loading} />
          </div>
        </div>
      </div>

      <div className="space-y-6 pb-8 pt-5">
        <ServiceTiles />

        <LiveIntelligenceSection
          gauge={gauge}
          cov={cov}
          rows={rows}
          days={days}
          onDays={setDays}
          loading={loading}
        />

        <HowItWorksStrip />
        <PartnerStrip />
      </div>

      <Footer />
    </div>
  );
}