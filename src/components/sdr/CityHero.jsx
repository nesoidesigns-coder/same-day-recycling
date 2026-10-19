import { CalendarCheck, ShieldCheck } from "lucide-react";
import { Image } from "@/components/ui/image";

const heroImg = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/b9a321aaa_generated_7ecc31ed.jpg";

export default function CityHero({ city, intro }) {
  return (
    <section id="top" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-5">
            <span className="w-8 h-px bg-[#1d9e56]" />
            {city.name} &amp; area
          </div>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight text-[#0c3b24]">
            Same-Day Junk Removal &amp; Furniture Disposal<br />in {city.name}, BC
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-md leading-relaxed">
            {city.blurb} Same-day junk and furniture removal — book in minutes, we haul it today, and recycle or donate everything we can.
          </p>
          {intro && <p className="mt-3 text-slate-600 max-w-md leading-relaxed">{intro}</p>}
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <a href="#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#17a04c] transition-colors">
              Book a Pickup in {city.name}
            </a>
            <a href="#quote" className="rounded-full border-2 border-[#0c3b24] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#0c3b24] hover:text-white transition-colors">
              Get a Free Quote
            </a>
          </div>
          <p className="mt-5 text-sm text-slate-500 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1d9e56]" />
            Upfront pricing approved by you before we lift a thing. No hidden fees.
          </p>
        </div>
        <div className="relative">
          <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-slate-100">
            <Image src={heroImg} alt={`Junk removal crew in ${city.name}`} className="w-full h-full" fittingType="fill" />
          </div>
          <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-lg px-5 py-4 flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-[#1d9e56]/15 flex items-center justify-center">
              <CalendarCheck className="w-5 h-5 text-[#1d9e56]" />
            </span>
            <div className="leading-tight">
              <div className="text-xs text-slate-500 font-medium">{city.name}</div>
              <div className="font-bold text-[#0c3b24]">Same-day dispatch</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}