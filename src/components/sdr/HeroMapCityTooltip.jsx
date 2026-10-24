import { MapPin } from "lucide-react";

// Per-city intelligence for the hero 3D map: hover tooltip + click-panel stats.
// Everything comes from verified records (coverage snapshot + open public
// requests) — never estimated.

export const AVAIL_META = {
  same_day: { label: "Same-day pickup verified", tone: "text-[#54D9AE]" },
  matching: { label: "Contractor matching in progress", tone: "text-amber-300" },
  recruiting: { label: "Recruiting contractors here", tone: "text-amber-300" },
  currently_unavailable: { label: "No guaranteed same-day here yet", tone: "text-emerald-50/70" },
};

const SERVICE_LABELS = {
  junk_removal: "Junk removal", furniture_removal: "Furniture", appliance_removal: "Appliances",
  electronics: "Electronics", recycling: "Recycling", waste_disposal: "Waste disposal",
  estate_cleanout: "Estate cleanouts", construction_debris: "Construction debris",
  demolition_cleanup: "Demolition", mattress_disposal: "Mattresses", yard_waste_removal: "Yard waste",
  commercial_waste: "Commercial", hot_tub_removal: "Hot tubs", scrap_metal: "Scrap metal",
  bin_rentals: "Bin rentals", same_day_pickup: "Same-day pickup", other: "Other",
};

const topServices = (stats) => Object.entries(stats?.services || {})
  .sort((a, b) => b[1] - a[1]).slice(0, 3);

const DemandLine = ({ stats }) => (
  stats && stats.open > 0 ? (
    <p className="mt-0.5 text-[11px] text-emerald-50/85">
      {stats.open} open public request{stats.open === 1 ? "" : "s"}
      {stats.active ? <span className="text-[#54D9AE]"> · {stats.active} active</span> : null}
    </p>
  ) : (
    <p className="mt-0.5 text-[11px] text-emerald-50/70">No open public requests recorded right now.</p>
  )
);

const ServiceChips = ({ stats }) => {
  const top = topServices(stats);
  if (!top.length) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {top.map(([cat, n]) => (
        <span key={cat} className="rounded-full bg-[#187B65]/20 px-2 py-0.5 text-[9px] font-bold text-emerald-50">
          {SERVICE_LABELS[cat] || cat} ×{n}
        </span>
      ))}
    </div>
  );
};

export default function HeroMapCityTooltip({ node, availability }) {
  const avail = availability ? (AVAIL_META[availability] || null) : null;
  return (
    <div className="w-60 rounded-2xl border border-[#187B65]/50 bg-[#0a2e25]/95 px-3.5 py-3 shadow-xl backdrop-blur-sm">
      <p className="flex items-center gap-1.5 text-sm font-extrabold text-white">
        <MapPin className="h-3.5 w-3.5 text-[#54D9AE]" />{node.name}
      </p>
      {avail ? <p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${avail.tone}`}>{avail.label}</p> : null}
      {node.contractors ? (
        <p className="text-[11px] text-emerald-50/85">{node.contractors} verified contractor{node.contractors === 1 ? "" : "s"}</p>
      ) : null}
      <div className="mt-2 border-t border-[#187B65]/25 pt-2">
        <p className="text-[10px] font-bold uppercase tracking-wider text-[#54D9AE]">Junk removal demand</p>
        <DemandLine stats={node.stats} />
        <ServiceChips stats={node.stats} />
      </div>
    </div>
  );
}

// Same stats, compact, for the click-selected node panel.
export function CityDemandStats({ node, availability }) {
  const avail = availability ? (AVAIL_META[availability] || null) : null;
  return (
    <div className="mt-3 rounded-xl border border-[#187B65]/25 bg-[#032015]/60 p-3">
      {avail ? <p className={`text-[10px] font-bold uppercase tracking-wider ${avail.tone}`}>{avail.label}</p> : null}
      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-[#54D9AE]">Junk removal demand</p>
      <DemandLine stats={node.stats} />
      <ServiceChips stats={node.stats} />
    </div>
  );
}