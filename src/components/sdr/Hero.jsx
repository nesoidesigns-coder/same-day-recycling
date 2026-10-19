import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CalendarCheck, ShieldCheck, MapPin } from "lucide-react";
import { Image } from "@/components/ui/image";
import AiMascotFull from "@/components/sdr/AiMascotFull";
import { CITIES } from "@/lib/cities";

const HERO_IMAGES = [
  "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/b9a321aaa_generated_7ecc31ed.jpg",
  "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/a48cd7a97_generated_image.png",
  "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/a8257e5b7_generated_image.png",
];

export default function Hero() {
  const [city, setCity] = useState("");
  const [imgIndex, setImgIndex] = useState(0);
  const navigate = useNavigate();

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
            Vancouver &amp; the Lower Mainland
          </div>
          <h1 className="text-5xl md:text-7xl font-bold leading-[1.05] tracking-tight text-[#0c3b24]">
            Your junk,<br />gone today.
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-md leading-relaxed">
            Same-day junk and furniture removal. Book in minutes, we haul it today — and recycle or donate everything we can.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href="#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#17a04c] transition-colors">
              Book a Pickup
            </a>
            <Link to="/free-metal-pickup" className="rounded-full bg-[#0c3b24] text-white font-bold px-7 py-4 text-center hover:bg-[#0a3020] transition-colors">
              Free Metal Pickup
            </Link>
            <a href="#book" className="rounded-full border-2 border-[#0c3b24] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#0c3b24] hover:text-white transition-colors">
              Get a Free Quote
            </a>
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md">
            <div className="relative flex-1">
              <MapPin className="w-4 h-4 text-[#1d9e56] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="input pl-10 appearance-none"
                aria-label="Choose your city"
              >
                <option value="">Choose your city…</option>
                {CITIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </div>
            <button
              onClick={() => city && navigate(`/city/${city}`)}
              disabled={!city}
              className="rounded-full bg-[#0c3b24] text-white font-bold px-6 py-3.5 hover:bg-[#0a3020] transition-colors disabled:opacity-50"
            >
              Local prices
            </button>
          </div>
          <p className="mt-5 text-sm text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1d9e56]" />
            Upfront pricing approved by you before we lift a thing. No hidden fees.
          </p>
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
          <div className="absolute -bottom-7 right-1 z-10 flex items-end gap-1.5">
            <div className="mb-8 rounded-2xl bg-white border border-[#1d9e56]/30 shadow-lg px-4 py-2.5 text-sm font-semibold text-[#0c3b24] max-w-[170px] leading-snug">
              Hi, I'm Rex! I can book your pickup in under a minute.
            </div>
            <AiMascotFull height={150} waveOnce className="rounded-2xl border-2 border-[#1d9e56]/40 bg-[#f4f7f5] p-0.5 shadow-[0_0_24px_rgba(29,158,86,0.35)]" />
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