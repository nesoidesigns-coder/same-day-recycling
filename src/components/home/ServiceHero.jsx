import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, MotionConfig } from "framer-motion";
import { ArrowRight, Armchair, Building2, Clock, Home, Phone, Recycle, Refrigerator, Trash2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { setRexContext } from "@/lib/rexSession";

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

const EASE = [0.22, 1, 0.36, 1];
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } } };
const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE } } };

export default function ServiceHero() {
  const navigate = useNavigate();
  const [need, setNeed] = useState("");

  const estimate = () => {
    if (need.trim()) {
      // Shared session context — Rex and the request form pick this up.
      sessionStorage.setItem("sdr-intent", need.trim());
      setRexContext({ intent: need.trim(), page: "homepage" });
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
      <MotionConfig reducedMotion="user">
      <div className="mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-8 md:px-8 md:py-20 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <motion.div initial="hidden" animate="show" variants={stagger}>
          <motion.h1 variants={fadeUp} className="text-[32px] font-extrabold leading-[1.08] tracking-tight text-ri-charcoal sm:text-4xl md:text-[46px] lg:text-[50px]">
            Same-day junk removal.
            <br />
            <span className="text-ri-forest">Know your price first.</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-3 max-w-xl text-[15px] leading-relaxed text-ri-slate md:mt-5 md:text-lg">
            One couch or a full cleanout — clear pricing up front, and nothing leaves without your approval.
          </motion.p>

          {/* Natural-language service selector */}
          <motion.div variants={fadeUp} className="mt-7 max-w-xl rounded-[20px] border border-si-line bg-white p-4 shadow-sm">
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
                className="btn-float inline-flex items-center justify-center gap-1.5 rounded-full bg-ri-amber px-6 py-3 text-sm font-bold text-ri-charcoal transition-all hover:brightness-95"
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
          </motion.div>

          {/* Trust proof at the decision point — promises and phone, next to the quote action */}
          <motion.div variants={fadeUp} className="mt-4 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-ri-mint px-3 py-1.5 text-xs font-bold text-ri-forest">
              <Clock className="h-3.5 w-3.5" /> Book before noon for same-day pickup
            </span>
            <a href="tel:+16048491745" className="inline-flex items-center gap-1.5 rounded-full border border-si-line bg-white px-3 py-1.5 text-xs font-bold text-ri-forest transition-colors hover:border-ri-emerald">
              <Phone className="h-3.5 w-3.5" /> (604) 849-1745
            </a>
          </motion.div>

          <Link to="/services" className="mt-4 inline-flex text-sm font-bold text-ri-forest underline-offset-4 hover:underline">
            Explore Services <ArrowRight className="ml-1 inline h-4 w-4" />
          </Link>
        </motion.div>

        {/* Real service imagery — relief and transformation, not dashboards */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.7, ease: EASE }}
        >
          <div className="overflow-hidden rounded-[24px] border border-si-line shadow-md">
            <Image
              src="https://media.base44.com/images/public/6ac93990cde830898b8dbc65/27e2d989f_generated_image.png"
              alt="A Same Day Recycling crew loading a couch for donation and recycling"
              className="w-full aspect-[16/10] sm:aspect-[4/3]"
              fittingType="fill"
            />
          </div>
          <div className="absolute -bottom-4 left-4 right-4 rounded-2xl border border-si-line bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-xs font-semibold leading-snug text-ri-charcoal">
              Cleared, sorted and accounted for — donated first, recycled second, responsibly disposed last.
            </p>
          </div>
        </motion.div>
      </div>
      </MotionConfig>
    </section>
  );
}