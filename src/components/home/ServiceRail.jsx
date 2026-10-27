import { Link } from "react-router-dom";
import { ArrowRight, Armchair, BadgeCheck, Building2, HardHat, Recycle, Refrigerator, ShieldCheck, Truck } from "lucide-react";
import { setRexContext } from "@/lib/rexSession";

const RAIL = [
  { label: "Furniture Removal", Icon: Armchair, to: "/furniture-removal" },
  { label: "Appliance Removal", Icon: Refrigerator, to: "/appliance-removal" },
  { label: "Property Cleanouts", Icon: Truck, to: "/request-service?service=cleanouts" },
  { label: "Construction Debris", Icon: HardHat, to: "/request-service?service=other" },
  { label: "Commercial Removal", Icon: Building2, to: "/commercial-recycling" },
  { label: "Recycling Services", Icon: Recycle, to: "/electronics-recycling" },
];

// One rail across the page: the six things people call us for most, each a
// single tap from a quote.
export default function ServiceRail() {
  return (
    <section className="mx-auto max-w-[1280px] px-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {RAIL.map(({ label, Icon, to }) => (
          <Link
            key={label}
            to={to}
            onClick={() => setRexContext({ page: "home", intent: `Interested in ${label}` })}
            className="group flex items-center gap-3 rounded-xl border border-lm-line bg-white px-3.5 py-3.5 transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--lm-teal))]/40 hover:shadow-[0_12px_28px_-22px_rgba(17,24,39,0.4)]"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[hsl(var(--lm-teal))]/10 text-[hsl(var(--lm-teal))]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1 text-[12.5px] font-bold leading-tight text-lm-ink">{label}</span>
            <ArrowRight className="h-4 w-4 shrink-0 text-lm-muted transition-colors group-hover:text-[hsl(var(--lm-teal))]" />
          </Link>
        ))}
      </div>
    </section>
  );
}

export const TRUST = [
  { label: "Same-Day Service", Icon: Truck },
  { label: "Responsible Recycling", Icon: Recycle },
  { label: "Verified Contractors", Icon: BadgeCheck },
  { label: "Trusted Across Canada", Icon: ShieldCheck },
];