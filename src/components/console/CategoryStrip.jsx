import { Armchair, Building2, HardHat, HeartHandshake, Recycle, Store, Truck, Zap } from "lucide-react";
import { LIVE_CATEGORY_SHORT } from "@/lib/liveCategories";

const ICONS = {
  furniture_appliance_removal: Armchair,
  moving_downsizing: Truck,
  renovation_construction_debris: HardHat,
  property_management_turnover: Building2,
  recycling_specialty_disposal: Recycle,
  commercial_office_cleanouts: Store,
  urgent_same_day: Zap,
  donation_reuse_circular: HeartHandshake,
};

// The eight markets as one strip. Counts are this window's verified records;
// selecting a market filters the radar above.
export default function CategoryStrip({ rows = [], total = 0, selected, onSelect }) {
  return (
    <section className="console-panel p-2">
      <div className="grid grid-cols-2 gap-1 sm:grid-cols-4 lg:grid-cols-8">
        {rows.map((row) => {
          const Icon = ICONS[row.key] || Recycle;
          const active = selected === row.key;
          const share = total ? Math.round((row.count / total) * 100) : 0;
          return (
            <button
              key={row.key}
              onClick={() => onSelect?.(row.key)}
              className={`rounded-xl px-2.5 py-2.5 text-left transition-colors ${
                active ? "bg-[hsl(var(--cn-teal)/0.14)]" : "hover:bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between">
                <Icon className={`h-4 w-4 ${active ? "text-cn-teal" : "text-cn-muted"}`} />
                <span className="font-plex text-[15px] font-bold text-cn-ink tabular-nums">{row.count}</span>
              </div>
              <div className="mt-1.5 truncate text-[11.5px] font-semibold text-cn-ink">
                {LIVE_CATEGORY_SHORT[row.key] || row.key}
              </div>
              <div className="console-track mt-1.5 h-0.5 w-full overflow-hidden rounded-full">
                <div className="h-full rounded-full bg-cn-teal" style={{ width: `${share}%` }} />
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}