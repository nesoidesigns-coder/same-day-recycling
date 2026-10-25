import { useSEO, useStructuredData } from "@/lib/seo";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import HeroBooking from "@/components/home/HeroBooking";
import RexDiscover from "@/components/home/RexDiscover";
import CoverageStrip from "@/components/home/CoverageStrip";
import InstantQuoteFlow from "@/components/sdr/InstantQuoteFlow";
import Services from "@/components/sdr/Services";
import HowItWorks from "@/components/sdr/HowItWorks";
import TransparentPricing from "@/components/sdr/TransparentPricing";
import Reviews from "@/components/sdr/Reviews";
import FAQ, { faqs as HOME_FAQS } from "@/components/sdr/FAQ";
import FinalCTA from "@/components/sdr/FinalCTA";
import Footer from "@/components/sdr/Footer";

// Consumer-first homepage: simple, friendly, service-first. Advanced sections
// (demand intelligence, discovery feeds, 3D features) live on their own routes;
// all existing pages and routes stay intact.
export default function Home() {
  useSEO({
    title: "Junk Removal Across Canada | Same Day Recycling",
    description: "Request junk, furniture, and appliance removal across Canada. Get clear estimates, explore local availability, and book with Same Day Recycling.",
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

  return (
    <div className="bg-warm-white pb-20 md:pb-0">
      <TopBar />
      <Navbar />
      <main>
        <HeroBooking />
        <RexDiscover />
        <InstantQuoteFlow />
        <Services />
        <CoverageStrip />
        <HowItWorks />
        <TransparentPricing />
        <Reviews />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}