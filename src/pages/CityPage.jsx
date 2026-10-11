import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { cityFromSlug } from "@/lib/cities";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import CityHero from "@/components/sdr/CityHero";
import TrustBar from "@/components/sdr/TrustBar";
import Services from "@/components/sdr/Services";
import QuoteCalculator from "@/components/sdr/QuoteCalculator";
import Booking from "@/components/sdr/Booking";
import FAQ from "@/components/sdr/FAQ";
import FinalCTA from "@/components/sdr/FinalCTA";
import Footer from "@/components/sdr/Footer";
import ReceptionistChat from "@/components/sdr/ReceptionistChat";

export default function CityPage() {
  const { slug } = useParams();
  const city = cityFromSlug(slug);
  const [quotePrefill, setQuotePrefill] = useState(null);

  if (!city) return <Navigate to="/" replace />;

  const bookFromQuote = (prefill) => {
    setQuotePrefill(prefill);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />
      <CityHero city={city} />
      <TrustBar />
      <Services />
      <QuoteCalculator onBook={bookFromQuote} city={city.name} />
      <Booking prefill={{ ...quotePrefill, city: city.name }} />
      <FAQ />
      <FinalCTA />
      <Footer />
      <ReceptionistChat />
    </div>
  );
}