import { useState, lazy } from "react";
import { useSEO, useStructuredData } from "@/lib/seo";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import InstantQuoteFlow from "@/components/sdr/InstantQuoteFlow";
import HomeHero from "@/components/sdr/HomeHero";
import Services from "@/components/sdr/Services";
import HowItWorks from "@/components/sdr/HowItWorks";
import Booking from "@/components/sdr/Booking";
import ItemEstimator from "@/components/sdr/ItemEstimator";
import FAQ, { faqs as HOME_FAQS } from "@/components/sdr/FAQ";
import Footer from "@/components/sdr/Footer";
import LazySection from "@/components/sdr/LazySection";
import RecyclingPulse from "@/components/sdr/pulse/RecyclingPulse";
import NationalDemand from "@/components/sdr/demand/NationalDemand";

// Below-the-fold sections load after first paint; the quote calculator and
// booking form stay eager so conversion actions are always instantly ready.
const TrustGauges = lazy(() => import("@/components/sdr/TrustGauges"));
const RexJourney = lazy(() => import("@/components/sdr/RexJourney"));
const TransparentPricing = lazy(() => import("@/components/sdr/TransparentPricing"));
const QuoteCalculator = lazy(() => import("@/components/sdr/QuoteCalculator"));
const CanadaNetworkMap = lazy(() => import("@/components/sdr/CanadaNetworkMap"));
const ProvinceImpact = lazy(() => import("@/components/sdr/ProvinceImpact"));
const FeaturedProviders = lazy(() => import("@/components/sdr/FeaturedProviders"));
const NationalCoverage = lazy(() => import("@/components/sdr/NationalCoverage"));
import CityLinks from "@/components/sdr/CityLinks";
const RecyclingCentersMap = lazy(() => import("@/components/sdr/RecyclingCentersMap"));
const EnvironmentalImpact = lazy(() => import("@/components/sdr/EnvironmentalImpact"));
const OperatingSystemPitch = lazy(() => import("@/components/sdr/OperatingSystemPitch"));
const BusinessSolutions = lazy(() => import("@/components/sdr/BusinessSolutions"));
const Reviews = lazy(() => import("@/components/sdr/Reviews"));
const FinalCTA = lazy(() => import("@/components/sdr/FinalCTA"));

export default function Home() {
  useSEO({
    title: "Same Day Recycling | Junk Removal & Recycling in Canada",
    description: "Same Day Recycling connects customers with junk removal, furniture pickup, and responsible recycling services. Explore service availability and request a quote.",
    path: "/",
  });
  useStructuredData("home-faq", {
    "@type": "FAQPage",
    mainEntity: HOME_FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  });
  const [quotePrefill, setQuotePrefill] = useState(null);
  const bookFromQuote = (prefill) => {
    setQuotePrefill(prefill);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className="bg-white pb-20 md:pb-0">
      <TopBar />
      <Navbar />
      <InstantQuoteFlow />
      <HomeHero onCity={(city) => bookFromQuote({ city })} />
      <RecyclingPulse />
      <NationalDemand />
      <LazySection minHeight={440}><RexJourney onBook={bookFromQuote} /></LazySection>
      <LazySection minHeight={480}><TrustGauges /></LazySection>
      <LazySection minHeight={480}><CanadaNetworkMap /></LazySection>
      <LazySection minHeight={380}><ProvinceImpact /></LazySection>
      <Services />
      <HowItWorks />
      <ItemEstimator onBook={bookFromQuote} />
      <LazySection minHeight={520}><TransparentPricing /></LazySection>
      <LazySection minHeight={560}><QuoteCalculator onBook={bookFromQuote} /></LazySection>
      <Booking prefill={quotePrefill} />
      <LazySection minHeight={320}><FeaturedProviders /></LazySection>
      <LazySection minHeight={360}><NationalCoverage /></LazySection>
      <CityLinks />
      <LazySection minHeight={520}><RecyclingCentersMap showSelector /></LazySection>
      <LazySection minHeight={340}><EnvironmentalImpact /></LazySection>
      <LazySection minHeight={360}><OperatingSystemPitch /></LazySection>
      <LazySection minHeight={340}><BusinessSolutions /></LazySection>
      <LazySection minHeight={360}><Reviews /></LazySection>
      <FAQ />
      <LazySection minHeight={300}><FinalCTA /></LazySection>
      <Footer />
    </div>
  );
}