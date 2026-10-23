import { useState, lazy } from "react";
import { useSEO, useStructuredData } from "@/lib/seo";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import HomeHero from "@/components/sdr/HomeHero";
import TrustGauges from "@/components/sdr/TrustGauges";
import Services from "@/components/sdr/Services";
import HowItWorks from "@/components/sdr/HowItWorks";
import TransparentPricing from "@/components/sdr/TransparentPricing";
import QuoteCalculator from "@/components/sdr/QuoteCalculator";
import Booking from "@/components/sdr/Booking";
import FAQ, { faqs as HOME_FAQS } from "@/components/sdr/FAQ";
import Footer from "@/components/sdr/Footer";
import LazySection from "@/components/sdr/LazySection";

// Below-the-fold sections load after first paint; the quote calculator and
// booking form stay eager so conversion actions are always instantly ready.
const CanadaNetworkMap = lazy(() => import("@/components/sdr/CanadaNetworkMap"));
const ProvinceImpact = lazy(() => import("@/components/sdr/ProvinceImpact"));
const FeaturedProviders = lazy(() => import("@/components/sdr/FeaturedProviders"));
const NationalCoverage = lazy(() => import("@/components/sdr/NationalCoverage"));
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
      <HomeHero onCity={(city) => bookFromQuote({ city })} />
      <TrustGauges />
      <LazySection minHeight={480}><CanadaNetworkMap /></LazySection>
      <LazySection minHeight={380}><ProvinceImpact /></LazySection>
      <Services />
      <HowItWorks />
      <TransparentPricing />
      <QuoteCalculator onBook={bookFromQuote} />
      <Booking prefill={quotePrefill} />
      <LazySection minHeight={320}><FeaturedProviders /></LazySection>
      <LazySection minHeight={360}><NationalCoverage /></LazySection>
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