import { Truck, Recycle } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import PhotoGallery from "@/components/sdr/PhotoGallery";

export default function Gallery() {
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />

      <section className="bg-[#102B2A] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-gold uppercase mb-5">
            <span className="w-8 h-px bg-gold" />
            Same Day Recycling
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight max-w-2xl">
            The fleet &amp; the crew
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-xl leading-relaxed">
            The trucks, crews, and job sites behind every pickup — each load sorted for
            maximum recovery across the cities we serve.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <PhotoGallery />
          <div className="mt-12 flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
            <Recycle className="w-4 h-4 text-[#187B65]" />
            Gallery imagery represents our network's fleet, crews, and job sites
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}