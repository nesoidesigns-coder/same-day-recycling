import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Armchair, Building2, Home, Recycle, Refrigerator, Trash2 } from "lucide-react";
import { Image } from "@/components/ui/image";

// Service-first hero: bright, welcoming, immediately actionable. Customers
// describe their need in natural language — no Recycling OS knowledge needed.
const SERVICE_CHIPS = [
  { label: "Junk Removal", to: "/request-service", Icon: Trash2 },
  { label: "Furniture Removal", to: "/furniture-removal", Icon: Armchair },
  { label: "Appliance Removal", to: "/appliance-removal", Icon: Refrigerator },
  { label: "Property Cleanouts", to: "/commercial-recycling", Icon: Building2 },
  { label: "Recycling Services", to: "/recycling", Icon: Recycle },
  { label: "Moving & Estate Cleanouts", to: "/move-assist", Icon: Home },
];

export default function ServiceHero() {
  const navigate = useNavigate();
  const [need, setNeed] = useState("");

  const estimate = () => {
    if (need.trim()) {
      // Shared session context — Rex and the request form pick this up.
      sessionStorage.setItem("sdr-intent", need.trim());
    }
    navigate("/request-service");
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-ri-ivory via-ri-ivory to-ri-sky">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-24 h-80 w-80 rounded-full"
        style={{ background: "radial-gradient(circle, hsl(var(--ri-emerald) / 0.12), transparent 70%)" }}
      />
      <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-12 md:px-8 md:py-20 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <h1 className="text-4xl font-extrabold leading-[1.08] tracking-tight text-ri-charcoal md:text-[56px]">
            Clear your space.
            <br />
            <span className="text-ri-forest">We'll handle the rest.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-ri-slate md:text-lg">
            Smart junk removal, furniture pickup, appliance recycling, and property cleanouts across Canada. Explore your options, get clear pricing, and request local service.
          </p>

          {/* Natural-language service selector */}
          <div className="mt-7 max-w-xl rounded-[20px] border border-si-line bg-white p-4 shadow-sm">
            <label htmlFor="hero-need" className="text-xs font-bold text-si-muted">Tell us what needs to go</label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="hero-need"
                value={need}
                onChange={(e) => setNeed(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && estimate()}
                placeholder="e.g. Two couches and a fridge, second-floor apartment in Vancouver"
                className="input flex-1 !rounded-full py-3 text-sm"
              />
              <button
                onClick={estimate}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ri-amber px-6 py-3 text-sm font-bold text-ri-charcoal transition-all hover:brightness-95"
              >
                Get My Pickup Estimate <ArrowRight className="h-4 w-4" />
              </button>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] font-semibold text-si-muted">Or choose:</span>
              {SERVICE_CHIPS.map(({ label, to, Icon }) => (
                <Link
                  key={label}
                  to={to}
                  className="inline-flex items-center gap-1.5 rounded-full bg-ri-mint px-3 py-1.5 text-xs font-bold text-ri-forest transition-colors hover:bg-ri-emerald hover:text-white"
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </Link>
              ))}
            </div>
          </div>

          <Link to="/services" className="mt-5 inline-flex text-sm font-bold text-ri-forest underline-offset-4 hover:underline">
            Explore Services <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </div>

        {/* Real service imagery — relief and transformation, not dashboards */}
        <div className="relative">
          <div className="overflow-hidden rounded-[24px] border border-si-line shadow-md">
            <Image
              src="https://media.base44.com/images/public/6ac93990cde830898b8dbc65/27e2d989f_generated_image.png"
              alt="A Same Day Recycling crew loading a couch for donation and recycling"
              className="w-full aspect-[4/3]"
              fittingType="fill"
            />
          </div>
          <div className="absolute -bottom-4 left-4 right-4 rounded-2xl border border-si-line bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold leading-snug text-ri-charcoal">
              Cleared, sorted and accounted for — donated first, recycled second, responsibly disposed last.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}