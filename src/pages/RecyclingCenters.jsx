import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import RecyclingCentersMap from "@/components/sdr/RecyclingCentersMap";
import FinalCTA from "@/components/sdr/FinalCTA";
import Footer from "@/components/sdr/Footer";

export default function RecyclingCenters() {
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />
      <RecyclingCentersMap showSelector />
      <FinalCTA />
      <Footer />
    </div>
  );
}