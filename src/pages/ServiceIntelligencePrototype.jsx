import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSEO } from "@/lib/seo";
import useLiveGauge from "@/hooks/useLiveGauge";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { CITIES } from "@/lib/cities";
import { LIVE_CATEGORIES } from "@/lib/liveCategories";
import { setRexContext } from "@/lib/rexSession";
import IntelHeader from "@/components/intel/IntelHeader";
import Footer from "@/components/sdr/Footer";
import CanadaHero from "@/components/home/CanadaHero";
import ServiceRail from "@/components/home/ServiceRail";
import MetricsBar from "@/components/home/MetricsBar";
import CanadaHowItWorks from "@/components/home/CanadaHowItWorks";

// The homepage: the promise, the live proof, the services, and the way to book.
export default function ServiceIntelligencePrototype() {
  useSEO({
    title: "Same Day Junk Removal & Recycling Services Across Canada | Same Day Recycling",
    description:
      "Clear space today for a cleaner tomorrow. Same-day junk removal, furniture and appliance pickup across Canada — transparent pricing, verified local crews and responsible recycling.",
    path: "/",
    robots: "index, follow",
  });

  const cov = useCoverageStatus();
  const { data: gauge, loading } = useLiveGauge({ province: "", city: "", category: "", days: 30 });

  const contractors = useMemo(() => {
    const values = Object.values(cov.contractorCounts || {}).filter((v) => Number.isFinite(Number(v)));
    return values.reduce((sum, v) => sum + Number(v), 0);
  }, [cov.contractorCounts]);

  return (
    <div className="min-h-screen bg-lm-bg text-lm-ink">
      <IntelHeader />

      <main>
        <CanadaHero total={gauge?.total || 0} cities={gauge?.cities || []} loading={loading} />

        <div className="space-y-3 pb-4">
          <ServiceRail />

          <MetricsBar
            cities={CITIES.length}
            contractors={cov.loaded ? contractors : null}
            observations={loading ? null : gauge?.total || 0}
            categories={Object.keys(LIVE_CATEGORIES).length}
            loading={loading}
          />

          <CanadaHowItWorks />
        </div>

        <section className="mx-auto max-w-[1280px] px-4 pb-14">
          <div className="flex flex-col items-center gap-4 rounded-2xl bg-[hsl(var(--lm-teal))] px-6 py-10 text-center">
            <h2 className="font-heading text-[26px] font-extrabold leading-tight text-white sm:text-[32px]">
              Ready to clear your space?
            </h2>
            <p className="max-w-xl text-[13.5px] text-white/85">
              Enter your postal code, see your price, and approve it before anything is scheduled. Same-day pickup where coverage is verified.
            </p>
            <Link
              to="/request-service"
              onClick={() => setRexContext({ page: "home", intent: "Ready to book a pickup" })}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FFB13C] to-[#FF9F1C] px-6 py-3 text-[14px] font-bold text-white shadow-sm transition-opacity hover:opacity-95"
            >
              Get My Estimate <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}