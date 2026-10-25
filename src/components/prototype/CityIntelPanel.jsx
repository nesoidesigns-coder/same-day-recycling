import { X, ArrowRight } from "lucide-react";
import { CATEGORY_LABELS } from "@/components/home/pulse/serviceCatalog";

const STATUS_LABEL = {
  same_day: "Same-day service available",
  matching: "Provider matching in progress",
  recruiting: "Recruiting providers",
  currently_unavailable: "Currently unavailable",
};

// Floating contextual intelligence panel — deep graphite, appears when a
// visitor selects a location. Shows verified observations, provider status
// and relevant actions. Never invents numbers.
export default function CityIntelPanel({ location, signals, capacity, loading, onClose }) {
  if (!location) return null;
  const rows = (signals?.rows || []).filter((r) => r.count > 0);

  return (
    <div className="rounded-[18px] bg-[#172B28] text-white p-5 shadow-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-plex font-semibold uppercase tracking-wider text-[#27D5B0]">Location intelligence</div>
          <h3 className="mt-0.5 text-lg font-bold">{location.name}{location.province ? `, ${location.province}` : ""}</h3>
        </div>
        <button onClick={onClose} aria-label="Close location panel" className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-4 h-4 text-white/60" />
        </button>
      </div>

      <div className="mt-4 space-y-3 text-sm">
        <div>
          <div className="font-plex text-[10px] uppercase tracking-wider text-white/50">Observed service activity · 90 days</div>
          {loading ? (
            <p className="mt-1 text-white/60">Checking records…</p>
          ) : rows.length ? (
            <ul className="mt-1.5 space-y-1">
              {rows.slice(0, 4).map((r) => (
                <li key={r.key} className="flex items-baseline justify-between gap-3">
                  <span className="text-white/85">{CATEGORY_LABELS[r.key] || r.key}</span>
                  <span className="font-plex text-xs text-[#27D5B0] tabular-nums">{r.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-white/60">No recorded observations yet for this location — quiet, not zero-guaranteed.</p>
          )}
        </div>

        <div>
          <div className="font-plex text-[10px] uppercase tracking-wider text-white/50">Provider availability</div>
          <p className="mt-1 font-semibold text-[#27D5B0]">{STATUS_LABEL[location.status] || STATUS_LABEL.currently_unavailable}</p>
          {capacity && Number.isFinite(capacity.available) && (
            <p className="text-xs text-white/50">Verified contractors serving {location.name}: {capacity.available}</p>
          )}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <a href={`/request-service?city=${encodeURIComponent(location.name)}`} className="inline-flex min-h-[42px] items-center gap-2 rounded-[12px] bg-[#27D5B0] px-4 text-sm font-bold text-[#123C32] hover:bg-white transition-colors">
          Request pickup <ArrowRight className="w-4 h-4" />
        </a>
        {location.href && location.href.startsWith("/") && (
          <a href={location.href} className="inline-flex min-h-[42px] items-center rounded-[12px] border border-white/20 px-4 text-sm font-semibold text-white hover:border-[#27D5B0] transition-colors">
            City details
          </a>
        )}
        <a href="/pricing" className="inline-flex min-h-[42px] items-center rounded-[12px] px-3 text-sm font-semibold text-[#27D5B0] hover:text-white transition-colors">
          Pricing
        </a>
      </div>
    </div>
  );
}