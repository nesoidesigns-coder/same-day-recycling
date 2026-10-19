import { useState } from "react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Hero from "@/components/sdr/Hero";
import TrustBar from "@/components/sdr/TrustBar";
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
import Footer from "@/components/sdr/Footer";
import ReceptionistChat from "@/components/sdr/ReceptionistChat";

export default function Home() {
  const [quotePrefill, setQuotePrefill] = useState(null);
  const bookFromQuote = (prefill) => {
    setQuotePrefill(prefill);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  };
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />
      <FacebookFeed />
      <Hero />
      <TrustBar />
      <Services />
      <HowItWorks />
      <CitySelector />
      <LoadEstimator onBook={bookFromQuote} />
      <QuoteCalculator onBook={bookFromQuote} />
      <Booking prefill={quotePrefill} />
      <ServiceArea />
      <RecyclingCentersMap showSelector />
      <Reviews />
      <SubTeaser />
      <FAQ />
      <FinalCTA />
      <Footer />
      <ReceptionistChat />
    </div>
  );
}