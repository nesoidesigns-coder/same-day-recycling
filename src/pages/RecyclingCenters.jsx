import TopBar from "@/components/sdr/TopBar";
import { useSEO } from "@/lib/seo";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import RecyclingCentersMap from "@/components/sdr/RecyclingCentersMap";
import FinalCTA from "@/components/sdr/FinalCTA";
import Footer from "@/components/sdr/Footer";

export default function RecyclingCenters() {
  useSEO({
    title: "Recycling Centres Near You | Same Day Recycling",
    description: "Explore listed recycling centres and drop-off depots by city. Check mapped locations and contact details, and confirm materials and fees before visiting.",
    path: "/recycling-centers",
  });
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />
      <RexBanner message="I've mapped drop-off spots across Canada — tap away." />
      <RecyclingCentersMap showSelector />
      <FinalCTA />
      <Footer />
    </div>
  );
}