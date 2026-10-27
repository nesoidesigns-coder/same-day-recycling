import { LayoutGrid, Sofa, Truck, HardHat, Building2, Recycle, Briefcase, Zap, HeartHandshake } from "lucide-react";
import { LIVE_CATEGORIES } from "@/lib/liveCategories";

// The service strip: every market category with its verified record count.
// The first tile is "All services" and clears the focus.
const ICONS = {
  furniture_appliance_removal: Sofa,
  moving_downsizing: Truck,
  renovation_construction_debris: HardHat,
  property_management_turnover: Building2,
  recycling_specialty_disposal: Recycle,
  commercial_office_cleanouts: Briefcase,
  urgent_same_day: Zap,
  donation_reuse_circular: HeartHandshake,
};

const SHORT = {
  furniture_appliance_removal: "Furniture",
  moving_downsizing: "Moving",
  renovation_construction_debris: "Construction",
  property_management_turnover: "Property",
  recycling_specialty_disposal: "Recycling",
  commercial_office_cleanouts: "Commercial",
  urgent_same_day: "Same-Day",
  donation_reuse_circular: "Donation",
};

export default function CategoryTiles({ rows = [], total = 0, selected, onSelect }) {
  const counts = new Map(rows.map((r) => [r.key, r.count]));
  const items = [
    { key: "", label: "All Services", count: total, icon: LayoutGrid },
    ...Object.keys(LIVE_CATEGORIES).map((key) => ({ key, label: SHORT[key], title: LIVE_CATEGORIES[key], count: counts.get(key) || 0, icon: ICONS[key] || LayoutGrid })),
  ];

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
      {items.map(({ key, label, title, count, icon: Icon }) => {
        const active = (selected || "") === key;
        return (
          <button
            key={key || "all"}
            type="button"
            onClick={() => onSelect(key)}
            aria-pressed={active}
            title={title || label}
            className={`flex flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 transition-colors ${
              active ? "border-lm-teal bg-[hsl(var(--lm-teal)/0.1)]" : "border-lm-line bg-lm-surface hover:border-lm-teal"
            }`}
          >
            <Icon className={`h-4 w-4 ${active ? "text-lm-teal" : "text-lm-muted"}`} strokeWidth={1.7} />
            <span className="truncate text-[10.5px] font-semibold text-lm-ink">{label}</span>
            <span className={`font-heading text-[13px] font-bold tabular-nums ${count ? "text-lm-teal" : "text-lm-muted/60"}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}