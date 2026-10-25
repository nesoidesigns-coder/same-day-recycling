import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useSEO, useStructuredData } from "@/lib/seo";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import IntelligenceHero from "@/components/home/IntelligenceHero";
import IntelligencePreview from "@/components/home/IntelligencePreview";
import VancouverIntelDashboard from "@/components/home/VancouverIntelDashboard";
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
        <IntelligenceHero />
        <section className="bg-warm-white pb-12 md:pb-16">
          <div className="max-w-6xl mx-auto px-4">
            <h2 className="text-center text-xs font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">Live platform intelligence</h2>
            <IntelligencePreview />
          </div>
        </section>
        <VancouverIntelDashboard />
        <InstantQuoteFlow />
        <RexDiscover />
        <Services />
        <CoverageStrip />
        <section className="bg-[#102B2A] text-white">
          <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold tracking-wide text-emerald-300 uppercase">Same Day Recycling LIVE</span>
              <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Explore What's Happening Across Canada.</h2>
              <p className="mt-2 text-emerald-100/80">Discover local service demand, compare pickup options, explore recycling information, and find help when you need it.</p>
            </div>
            <Link to="/live" className="shrink-0 inline-flex items-center gap-2 rounded-2xl bg-[#187B65] text-white font-bold px-6 py-3.5 hover:bg-[#116553]">
              Explore LIVE <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
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