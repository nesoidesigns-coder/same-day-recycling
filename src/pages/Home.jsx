import { useState } from "react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Hero from "@/components/sdr/Hero";
import TrustBar from "@/components/sdr/TrustBar";
import LocallyOwned from "@/components/sdr/LocallyOwned";
import Services from "@/components/sdr/Services";
import HowItWorks from "@/components/sdr/HowItWorks";
import CitySelector from "@/components/sdr/CitySelector";
import LoadEstimator from "@/components/sdr/LoadEstimator";
import Reviews from "@/components/sdr/Reviews";
import SubTeaser from "@/components/sdr/SubTeaser";
import QuoteCalculator from "@/components/sdr/QuoteCalculator";
import Booking from "@/components/sdr/Booking";
import ServiceArea from "@/components/sdr/ServiceArea";
import RecyclingCentersMap from "@/components/sdr/RecyclingCentersMap";
import FAQ from "@/components/sdr/FAQ";
import FinalCTA from "@/components/sdr/FinalCTA";
import FacebookFeed from "@/components/sdr/FacebookFeed";
import HologramFeed from "@/components/sdr/HologramFeed";
import Footer from "@/components/sdr/Footer";
import StickyCTA from "@/components/sdr/StickyCTA";
import ExitIntentOffer from "@/components/sdr/ExitIntentOffer";
import PhotoQuote from "@/components/sdr/PhotoQuote";
import TextPhotoQuote from "@/components/sdr/TextPhotoQuote";
import CurbsideDiscount from "@/components/sdr/CurbsideDiscount";
import CondoStrata from "@/components/sdr/CondoStrata";
import EcoReceipt from "@/components/sdr/EcoReceipt";
import TransparentPricing from "@/components/sdr/TransparentPricing";
import WeightCalculator from "@/components/sdr/WeightCalculator";
import CoverageStrip from "@/components/sdr/CoverageStrip";
import MetalPickupBand from "@/components/sdr/MetalPickupBand";

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
      <Hero />
      <TrustBar />
      <CoverageStrip />
      <LocallyOwned />
      <HologramFeed />
      <Services />
      <CondoStrata />
      <MetalPickupBand />
      <HowItWorks />
      <CurbsideDiscount />
      <TransparentPricing />
      <WeightCalculator onBook={bookFromQuote} />
      <CitySelector />
      <LoadEstimator onBook={bookFromQuote} />
      <TextPhotoQuote />
      <PhotoQuote onBook={bookFromQuote} />
      <QuoteCalculator onBook={bookFromQuote} />
      <Booking prefill={quotePrefill} />
      <ServiceArea />
      <RecyclingCentersMap showSelector />
      <EcoReceipt />
      <Reviews />
      <SubTeaser />
      <FacebookFeed />
      <FAQ />
      <FinalCTA />
      <Footer />
      <StickyCTA />
      <ExitIntentOffer />
    </div>
  );
}