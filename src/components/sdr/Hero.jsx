import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck } from "lucide-react";
import { Image } from "@/components/ui/image";

const HERO_IMAGES = [
  "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/b9a321aaa_generated_7ecc31ed.jpg",
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
    <section id="top" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-5">
            <span className="w-8 h-px bg-[#1d9e56]" />
            Now serving British Columbia
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight text-[#0c3b24]">
            Canada's Same-Day<br />Recycling Network
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-md leading-relaxed">
            Book a pickup today — or plug your truck into the machine that books them.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href="#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#17a04c] transition-colors">
              Book a Pickup
            </a>
            <Link to="/contractors" className="rounded-full border-2 border-[#0c3b24] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#0c3b24] hover:text-white transition-colors">
              Contractors — Join the Network
            </Link>
          </div>
        </div>
        <div className="relative">
          <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-slate-100 relative">
            {HERO_IMAGES.map((src, i) => (
              <Image
                key={src}
                src={src}
                alt="Same-day junk removal in Vancouver"
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
              <div className="text-xs text-slate-500 font-medium">Today</div>
              <div className="font-bold text-[#0c3b24]">Same-day dispatch</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}