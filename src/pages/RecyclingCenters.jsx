import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import RecyclingCentersMap from "@/components/sdr/RecyclingCentersMap";
import FinalCTA from "@/components/sdr/FinalCTA";
import Footer from "@/components/sdr/Footer";

export default function RecyclingCenters() {
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />
      <RexBanner message="I've mapped every drop-off spot in the Lower Mainland — tap away." />
      <RecyclingCentersMap showSelector />
      <FinalCTA />
      <Footer />
    </div>
  );
}