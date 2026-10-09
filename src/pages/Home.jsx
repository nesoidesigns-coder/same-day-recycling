import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Hero from "@/components/sdr/Hero";
import TrustBar from "@/components/sdr/TrustBar";
import Services from "@/components/sdr/Services";
import HowItWorks from "@/components/sdr/HowItWorks";
import Booking from "@/components/sdr/Booking";
import ServiceArea from "@/components/sdr/ServiceArea";
import FAQ from "@/components/sdr/FAQ";
import FinalCTA from "@/components/sdr/FinalCTA";
import Footer from "@/components/sdr/Footer";
import ReceptionistChat from "@/components/sdr/ReceptionistChat";

export default function Home() {
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />
      <Hero />
      <TrustBar />
      <Services />
      <HowItWorks />
      <Booking />
      <ServiceArea />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  );
}