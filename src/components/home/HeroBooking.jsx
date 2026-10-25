import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, MessageCircle, ShieldCheck, Star, Wallet } from "lucide-react";
import { Image } from "@/components/ui/image";
import { isValidPostal, normalizePostal } from "@/lib/geo";

const HERO_PHOTO =
  "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/0d98d3ec3_generated_image.png";

// Friendly, service-first homepage hero. Address/postal input hands off to the
// guided booking flow below (#book) through the hero-booking:start event.
export default function HeroBooking() {
  const [postal, setPostal] = useState("");

  const check = () => {
    const norm = normalizePostal(postal);
    const fsa = isValidPostal(norm) ? norm.slice(0, 3) : "";
    base44.analytics.track({ eventName: "hero_postal_check", properties: { postal_fsa: fsa } });
    window.dispatchEvent(new CustomEvent("hero-booking:start", { detail: { postal } }));
    setTimeout(() => document.getElementById("book")?.scrollIntoView({ behavior: "smooth" }), 60);
  };

  return (
    <section className="bg-warm-white">
      <div className="max-w-7xl mx-auto px-4 pt-10 pb-12 md:pt-16 md:pb-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full bg-[#187B65]/10 px-3 py-1 text-[11px] font-bold tracking-wide text-[#187B65] uppercase">
            Same-day pickup options across Canada
          </span>
          <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-[#102B2A] leading-tight">
            Got Junk? We'll Take Care of It.
          </h1>
          <p className="mt-4 text-lg text-slate-600 max-w-xl leading-relaxed">
            Furniture, appliances, moving leftovers, and more. Clear prices, friendly service, and same-day pickup options across Canada.
          </p>

          <div className="mt-7 rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 max-w-xl shadow-sm">
            <label htmlFor="hero-postal" className="block text-sm font-bold text-[#102B2A]">
              Where's the pickup?
            </label>
            <div className="mt-2 flex flex-col sm:flex-row gap-2">
              <input
                id="hero-postal"
                value={postal}
                onChange={(e) => setPostal(e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && check()}
                maxLength={7}
                inputMode="text"
                autoComplete="postal-code"
                placeholder="Postal code, e.g. V6B 1A1"
                className="input font-mono tracking-[0.2em] uppercase"
              />
              <button
                onClick={check}
                className="shrink-0 rounded-xl bg-amber-500 text-[#102B2A] font-bold px-6 py-3 hover:bg-amber-600 hover:text-white transition-colors inline-flex items-center justify-center gap-2"
              >
                Check Pickup Options <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-2.5 text-xs text-slate-500">
              Free quotes · From $149 in covered cities · Price approved by you before any work
            </p>
            <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#187B65] shrink-0" />
              We confirm coverage for your address before booking — never assumed.
            </p>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("rex:open"))}
              className="inline-flex items-center gap-2 font-bold text-[#187B65] hover:underline"
            >
              <MessageCircle className="w-4 h-4" /> Ask Rex for help
            </button>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Star className="w-4 h-4 fill-[#187B65] text-[#187B65]" /> Verified customer reviews
            </span>
            <span className="flex items-center gap-1.5 text-slate-600">
              <Wallet className="w-4 h-4 text-[#187B65]" /> No hidden fees
            </span>
          </div>
        </div>

        <div className="relative">
          <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-sm">
            <Image src={HERO_PHOTO} fittingType="fill" alt="Same Day Recycling crew member beside a loaded pickup truck at a home" className="w-full aspect-[4/3] object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}