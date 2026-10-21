import { useState } from "react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import HomeHero from "@/components/sdr/HomeHero";
import TrustGauges from "@/components/sdr/TrustGauges";
import Services from "@/components/sdr/Services";
import HowItWorks from "@/components/sdr/HowItWorks";
import TransparentPricing from "@/components/sdr/TransparentPricing";
import QuoteCalculator from "@/components/sdr/QuoteCalculator";
import Booking from "@/components/sdr/Booking";
import ServiceArea from "@/components/sdr/ServiceArea";
import RecyclingCentersMap from "@/components/sdr/RecyclingCentersMap";
import Reviews from "@/components/sdr/Reviews";
import FAQ from "@/components/sdr/FAQ";
import FinalCTA from "@/components/sdr/FinalCTA";
import Footer from "@/components/sdr/Footer";

export default function Home() {
  const [quotePrefill, setQuotePrefill] = useState(null);
  const bookFromQuote = (prefill) => {
    setQuotePrefill(prefill);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className="bg-white pb-20 md:pb-0">
      <TopBar />
      <Navbar />
      <HomeHero />
      <TrustGauges />
      <Services />
      <HowItWorks />
      <TransparentPricing />
      <QuoteCalculator onBook={bookFromQuote} />
      <Booking prefill={quotePrefill} />
      <ServiceArea />
      <RecyclingCentersMap showSelector />
      <Reviews />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}