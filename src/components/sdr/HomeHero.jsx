import { Calculator, CalendarCheck, MessageCircle, Phone, ShieldCheck, Recycle } from "lucide-react";
import ServiceDiscovery from "./ServiceDiscovery";
import { Image } from "@/components/ui/image";

const TRUCK_IMG = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/b368925f5_generated_image.png";

// Friendly, light hero: answers "what / my area / how do I start" in one screen.
// The three actions scroll straight to the working tools — estimator, booking
// form and the live coverage check.
export default function HomeHero({ onCity }) {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  return (
    <section id="top" className="bg-[#FAF8F4] overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 pt-8 pb-10 md:pt-14 md:pb-16">
        <div className="grid md:grid-cols-[1.15fr_1fr] gap-8 md:gap-10 items-center">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-white border border-[#187B65]/20 px-3.5 py-1.5 text-[10px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#187B65] shadow-sm">
              <Recycle className="w-3.5 h-3.5" />
              Canada's recycling &amp; removal network
            </div>
            <h1 className="mt-4 text-4xl leading-[1.05] sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#102B2A]">
              Junk Gone. Space Back. <span className="text-[#187B65]">Same Day.</span>
            </h1>
            <p className="mt-4 text-[15px] md:text-lg text-slate-600 max-w-xl mx-auto md:mx-0 leading-relaxed">
              Book junk removal, furniture pickup, appliance recycling, and property cleanouts with a simple, guided experience.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-2.5 max-w-md mx-auto md:mx-0">
              <button
                onClick={() => scrollTo("estimate")}
                className="inline-flex items-center justify-center gap-2 min-h-[52px] rounded-full bg-[#187B65] text-white font-bold px-5 py-3.5 text-[15px] shadow-md shadow-[#187B65]/25 hover:bg-[#125C4E] transition-colors"
              >
                <Calculator className="w-5 h-5 shrink-0" /> Instant Estimate
              </button>
              <button
                onClick={() => scrollTo("book")}
                className="inline-flex items-center justify-center gap-2 min-h-[52px] rounded-full bg-[#102B2A] text-white font-bold px-5 py-3.5 text-[15px] hover:bg-[#0a3020] transition-colors"
              >
                <CalendarCheck className="w-5 h-5 shrink-0" /> Book Pickup
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent("rex:open"))}
                className="col-span-2 inline-flex items-center justify-center gap-2 min-h-[52px] rounded-full bg-white text-[#102B2A] border-2 border-slate-200 font-bold px-5 py-3.5 text-[15px] hover:border-[#187B65] hover:text-[#187B65] transition-colors"
              >
                <MessageCircle className="w-5 h-5 shrink-0" /> Ask Rex — instant answers &amp; photo quotes
              </button>
            </div>

            <div className="mt-5 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 text-xs font-semibold text-slate-500">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" /> Free, no-obligation estimates</span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" /> You approve the price before we lift anything</span>
            </div>
            <a href="tel:+16048491745" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#102B2A] hover:text-[#187B65] transition-colors">
              <Phone className="w-4 h-4 text-[#187B65]" /> (604) 849-1745
            </a>
          </div>

          <div>
            <Image
              src={TRUCK_IMG}
              fittingType="fit"
              loading="eager"
              fetchpriority="high"
              targetWidth={448}
              targetHeight={448}
              alt="Friendly green pickup truck loaded with furniture next to recycling bins"
              className="w-full max-w-md mx-auto h-56 sm:h-72 md:h-96 rounded-3xl"
            />
          </div>
        </div>

        {/* Live coverage check — kept as the "Check My Area" tool */}
        <div id="area-check" className="mt-8 md:mt-12 max-w-2xl mx-auto scroll-mt-20">
          <ServiceDiscovery onCity={onCity} />
        </div>
      </div>
    </section>
  );
}