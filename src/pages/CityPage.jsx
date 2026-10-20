import { useState, useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { cityFromSlug } from "@/lib/cities";
import { base44 } from "@/api/base44Client";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import CityHero from "@/components/sdr/CityHero";
import TrustBar from "@/components/sdr/TrustBar";
import Services from "@/components/sdr/Services";
import CityMap from "@/components/sdr/CityMap";
import RecyclingCentersMap from "@/components/sdr/RecyclingCentersMap";
import CityPricing from "@/components/sdr/CityPricing";
import CityGuide from "@/components/sdr/CityGuide";
import FurnitureRemoval from "@/components/sdr/FurnitureRemoval";
import CityReviews from "@/components/sdr/CityReviews";
import CityTrust from "@/components/sdr/CityTrust";
import QuoteCalculator from "@/components/sdr/QuoteCalculator";
import Booking from "@/components/sdr/Booking";
import FinalCTA from "@/components/sdr/FinalCTA";
import Footer from "@/components/sdr/Footer";

export default function CityPage({ slugParam }) {
  const params = useParams();
  const slug = slugParam || params.slug;
  const city = cityFromSlug(slug);
  const [quotePrefill, setQuotePrefill] = useState(null);
  const [seo, setSeo] = useState(null);

  // Live AI-optimized SEO from the Auto SEO workflow: overrides title, meta
  // description and hero copy when a newer version exists for this city
  useEffect(() => {
    if (!city?.name) return;
    let alive = true;
    base44.entities.CitySeo.filter({ city: city.name }, { limit: 1 }).then(({ items }) => {
      if (alive && items && items.length) setSeo(items[0]);
    }).catch(() => {});
    return () => { alive = false; };
  }, [city?.name]);

  useEffect(() => {
    if (!seo) return;
    if (seo.seo_title) document.title = seo.seo_title;
    if (seo.seo_description) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute("content", seo.seo_description);
      const ogDesc = document.querySelector('meta[property="og:description"]');
      if (ogDesc) ogDesc.setAttribute("content", seo.seo_description);
    }
  }, [seo]);

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
      <RexBanner message="I've got this city's pricing and pickup rules memorized — just ask!" />
      <CityHero city={city} intro={seo?.hero_intro} />
      <TrustBar />
      <Services />
      <CityMap city={city} />
      <CityPricing city={city.name} />
      <RecyclingCentersMap city={city.name} />
      <CityTrust city={city} />
      <CityReviews city={city} />
      <CityGuide city={city} />
      <FurnitureRemoval cityName={city.name} />
      <QuoteCalculator onBook={bookFromQuote} city={city.name} />
      <Booking prefill={{ ...quotePrefill, city: city.name }} />
      <FinalCTA />
      <Footer />
    </div>
  );
}