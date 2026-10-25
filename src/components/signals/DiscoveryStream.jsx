import { useState } from "react";
import { ChevronDown } from "lucide-react";
import DataFreshness from "./DataFreshness";

// Chronological feed of market findings. Rows come straight from the Living
// Signals engine — normalized, sanitized, no identities. Search-interest
// rows are explicitly labelled so they are never read as customer activity.
const TYPE_LABEL = {
  observed_public_request: { label: "Observed request", tone: "bg-ri-emerald/10 text-ri-emerald-ink" },
  search_interest: { label: "Search interest", tone: "bg-ri-amber/10 text-ri-amber-ink" },
  market_indicator: { label: "Market indicator", tone: "bg-ri-mint text-ri-forest" },
};

const fmt = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleString("en-CA", { month: "short", day: "numeric" });
};

export default function DiscoveryStream({ signals = [], isLoading, emptyLabel = "No market findings recorded for this selection yet.", limit = 4, expandable = true, className = "" }) {
  const [expanded, setExpanded] = useState(false);
  if (isLoading) {
    return <div className={`rounded-xl bg-ri-ivory border border-si-line px-4 py-3 text-xs text-ri-slate ${className}`}>Loading findings…</div>;
  }
  if (!signals.length) {
    return <div className={`rounded-xl bg-ri-ivory border border-si-line px-4 py-3 text-xs text-ri-slate ${className}`}>{emptyLabel}</div>;
  }

  const shown = expanded ? signals : signals.slice(0, limit);
  const hidden = signals.length - shown.length;

  return (
    <div className={className}>
      <ul className="space-y-2">
        {shown.map((f) => {
          const type = TYPE_LABEL[f.finding_type] || TYPE_LABEL.market_indicator;
          const place = [f.location.city, f.location.province_code].filter(Boolean).join(", ");
          return (
            <li key={f.id} className="rounded-xl bg-ri-ivory border border-si-line px-3.5 py-2.5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${type.tone}`}>{type.label}</span>
                {place && <span className="font-plex text-xs text-ri-slate">{place}</span>}
                <span className="font-plex text-xs text-ri-slate">{fmt(f.observed_at)}</span>
              </div>
              <p className="mt-1 text-xs text-ri-charcoal leading-relaxed">{f.title}</p>
              <DataFreshness className="mt-1" source={`via ${f.source}`} observedAt={f.observed_at} updatedAt={f.updated_at} verification={f.verification} size="xs" />
            </li>
          );
        })}
      </ul>
      {expandable && hidden > 0 && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-ri-emerald hover:underline"
        >
          Show {hidden} more finding{hidden === 1 ? "" : "s"} <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}