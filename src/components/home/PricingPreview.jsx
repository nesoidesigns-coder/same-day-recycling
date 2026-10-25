import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck } from "lucide-react";

// Transparent pricing preview — published platform rates, plainly labelled.
const BANDS = [
  { size: "Minimum pickup", weight: "Up to 200 lbs", key: "minimum_pickup" },
  { size: "1/8 truck", weight: "200 – 350 lbs", key: "eighth_truck" },
  { size: "1/4 truck", weight: "350 – 700 lbs", key: "quarter_truck" },
  { size: "1/2 truck", weight: "700 – 1,400 lbs", key: "half_truck" },
  { size: "3/4 truck", weight: "1,400 – 2,100 lbs", key: "three_quarter_truck" },
  { size: "Full truck", weight: "2,100 – 2,800 lbs", key: "full_truck" },
];

export default function PricingPreview({ prices }) {
  return (
    <section id="pricing-preview" className="rounded-[24px] bg-ri-sky/60 p-6 md:p-10">
      <div className="max-w-2xl">
        <h2 className="text-[26px] font-bold tracking-tight text-si-ink md:text-[32px]">Clear pricing before we lift a thing</h2>
        <p className="mt-2 text-sm leading-relaxed text-si-muted md:text-base">
          You pay for the truck space your load fills. The final price is always approved by you before any work begins — no hidden fees, ever.
        </p>
      </div>
      <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {BANDS.map((b) => (
          <div key={b.key} className="rounded-2xl border border-si-line bg-white p-5 shadow-sm">
            <div className="text-sm font-bold text-si-ink">{b.size}</div>
            <div className="text-xs text-si-muted">{b.weight}</div>
            <div className="mt-2 font-plex text-2xl font-bold text-ri-forest">
              {prices?.[b.key] != null ? <>from ${prices[b.key]}</> : <span className="text-ri-slate">—</span>}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-si-muted">
        <span className="inline-flex items-center gap-1.5 font-semibold text-ri-forest">
          <ShieldCheck className="h-4 w-4" /> Recycling and donation always included — never an eco surcharge
        </span>
        <Link to="/pricing" className="inline-flex items-center gap-1 font-bold text-ri-forest underline-offset-4 hover:underline">
          Full pricing details <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  );
}