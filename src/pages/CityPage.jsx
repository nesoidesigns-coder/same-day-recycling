import { useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { cityFromSlug } from "@/lib/cities";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import CityHero from "@/components/sdr/CityHero";
import TrustBar from "@/components/sdr/TrustBar";
import Services from "@/components/sdr/Services";
import CityMap from "@/components/sdr/CityMap";
import RecyclingCentersMap from "@/components/sdr/RecyclingCentersMap";
import CityReviews from "@/components/sdr/CityReviews";
import QuoteCalculator from "@/components/sdr/QuoteCalculator";
import Booking from "@/components/sdr/Booking";
import FAQ from "@/components/sdr/FAQ";
import FinalCTA from "@/components/sdr/FinalCTA";
import Footer from "@/components/sdr/Footer";

export default function CityPage() {
  const { slug } = useParams();
  const city = cityFromSlug(slug);
  const [quotePrefill, setQuotePrefill] = useState(null);

  // Set during render (not in an effect) so the pre-rendered HTML search engines
  // crawl already carries the per-city title and description.
  if (city) {
    document.title = city.seo_title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", city.seo_description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", city.seo_title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", city.seo_description);
  }

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
      <CityMap city={city} />
      <RecyclingCentersMap city={city.name} />
      <CityReviews city={city} />
      <QuoteCalculator onBook={bookFromQuote} city={city.name} />
      <Booking prefill={{ ...quotePrefill, city: city.name }} />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}