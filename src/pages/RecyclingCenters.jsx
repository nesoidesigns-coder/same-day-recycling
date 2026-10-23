import { Link } from "react-router-dom";
import TopBar from "@/components/sdr/TopBar";
import { useSEO } from "@/lib/seo";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import RecyclingCentersMap from "@/components/sdr/RecyclingCentersMap";
import FinalCTA from "@/components/sdr/FinalCTA";
import Footer from "@/components/sdr/Footer";

export default function RecyclingCenters() {
  useSEO({
    title: "Recycling Centers Near You | Same Day Recycling",
    description: "Explore listed recycling centres and drop-off depots by city. Check mapped locations and contact details, and confirm materials and fees before visiting.",
    path: "/recycling-centers",
  });
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />
      <RexBanner message="I've mapped drop-off spots across Canada — tap away." />
      <RecyclingCentersMap showSelector />
      <div className="max-w-5xl mx-auto px-4 pb-12">
        <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-6 text-sm text-slate-600 leading-relaxed">
          <span className="font-bold text-[#102B2A]">What this map is (and isn't):</span> it plots independent drop-off facilities — depots, transfer stations and recycling centres — researched from official sources. These facilities are not affiliated with or operated by Same Day Recycling, and they are not our pickup partners. If you want us to collect and sort your items for you, <Link to="/#book" className="font-semibold text-[#187B65] hover:underline">book a pickup</Link> in one of our active service cities, or <Link to="/coverage" className="font-semibold text-[#187B65] hover:underline">check coverage</Link>.
        </div>
      </div>
      <FinalCTA />
      <Footer />
    </div>
  );
}