import { useEffect, useState } from "react";
import { CalendarCheck } from "lucide-react";
import { Image } from "@/components/ui/image";

const HERO_IMAGES = [
  "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/5dbff3504_generated_image.png",
  "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/a48cd7a97_generated_image.png",
  "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/a8257e5b7_generated_image.png",
];

export default function Hero() {
  const [imgIndex, setImgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setImgIndex((i) => (i + 1) % HERO_IMAGES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section id="top" className="relative bg-[#0c3b24] text-white overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#1d9e56]/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-[#22d3ee]/10 blur-3xl pointer-events-none" />
      <div className="relative max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#22d3ee] uppercase mb-5">
            <span className="w-8 h-px bg-[#22d3ee]" />
            Smart Removal · Responsible Recycling · Reliable Service
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold leading-[1.02] tracking-tight text-white">
            Your Space.<br />Reclaimed.
          </h1>
          <p className="mt-4 text-xl md:text-2xl font-bold text-emerald-100 tracking-tight">
            Junk Removal, Without the Guesswork.
          </p>
          <p className="mt-4 text-lg text-emerald-100/80 max-w-md leading-relaxed">
            Book a pickup, understand your costs, and discover responsible options for your unwanted items. SameDay makes clearing your space straightforward, transparent, and convenient.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href="#estimator" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#25b96b] transition-colors">
              Get My Estimate
            </a>
            <a href="#book" className="rounded-full border-2 border-white/30 text-white font-bold px-7 py-4 text-center hover:bg-white/10 transition-colors">
              Book a Pickup
            </a>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-100/70">
            <CalendarCheck className="w-4 h-4 text-[#22d3ee]" />
            Same-day pickups when booked before noon
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-[#0a3020] relative ring-1 ring-white/10">
            {HERO_IMAGES.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt="Same Day Recycling crew loading unwanted items onto a recycling truck"
                className={`w-full h-full absolute inset-0 transition-opacity duration-1000 ${i === imgIndex ? "opacity-100" : "opacity-0"}`}
                fittingType="fill"
              />
            ))}
          </div>
          <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#1d9e56]/15 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-[#1d9e56]" />
            </span>
            <div className="leading-tight">
              <div className="text-xs text-slate-500 font-medium">Same-day</div>
              <div className="font-bold text-[#0c3b24]">When booked before noon</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}