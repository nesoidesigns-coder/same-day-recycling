import { Link } from "react-router-dom";
import { ArrowRight, TrendingUp } from "lucide-react";
import { LIVE_CATEGORY_SHORT } from "@/lib/liveCategories";

const SHARE = {
  furniture_appliance_removal: "/services",
  moving_downsizing: "/move-assist",
  renovation_construction_debris: "/commercial-recycling",
  property_management_turnover: "/property-managers",
  recycling_specialty_disposal: "/electronics-recycling",
  commercial_office_cleanouts: "/commercial-recycling",
  urgent_same_day: "/same-day-pickup",
  donation_reuse_circular: "/recycling-centers",
};

// What the country is asking for right now, as a share of this window's
// verified records.
export default function PopularRightNow({ rows = [], total = 0, loading }) {
  const top = [...rows].filter((r) => r.count > 0).sort((a, b) => b.count - a.count).slice(0, 5);

  return (
    <div className="rounded-2xl border border-lm-line bg-white p-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-[13px] font-bold text-lm-ink">Popular right now</h2>
        <TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--ri-emerald))]" />
      </div>
      <p className="mt-0.5 text-[10.5px] text-lm-muted">Share of verified requests and searches.</p>

      <ul className="mt-2.5 space-y-1">
        {top.map((r) => {
          const share = total ? Math.round((r.count / total) * 100) : 0;
          return (
            <li key={r.key}>
              <Link
                to={SHARE[r.key] || "/services"}
                className="flex items-center gap-2 rounded-lg px-1.5 py-1.5 transition-colors hover:bg-[hsl(var(--ri-mint)/0.4)]"
              >
                <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-lm-ink">
                  {LIVE_CATEGORY_SHORT[r.key] || r.label}
                </span>
                <span className="font-plex text-[10.5px] font-bold text-[hsl(var(--ri-emerald-ink))] tabular-nums">{share}%</span>
              </Link>
            </li>
          );
        })}
        {!top.length && (
          <li className="py-3 text-[11.5px] text-lm-muted">
            {loading ? "Loading activity…" : "Activity will appear as verified records arrive."}
          </li>
        )}
      </ul>

      <Link to="/live" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--lm-teal))] hover:underline">
        See all activity <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}