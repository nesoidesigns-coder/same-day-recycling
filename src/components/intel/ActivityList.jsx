import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Latest verified activity. Every row is a real platform record or a labelled
// public observation — the tag states which, never a blended score.
const KIND = {
  service_request: { label: "Pickup request", tag: "Direct" },
  quote_request: { label: "Quote request", tag: "Direct" },
  platform_inquiry: { label: "Platform inquiry", tag: "Direct" },
  confirmed_booking: { label: "Confirmed booking", tag: "Direct" },
  qualified_opportunity: { label: "Qualified opportunity", tag: "Direct" },
  observed_public_request: { label: "Public request", tag: "Forum" },
  search_interest: { label: "Search interest", tag: "Search" },
  market_indicator: { label: "Market indicator", tag: "Social" },
};

const TAG_STYLE = {
  Search: "bg-[hsl(var(--lm-teal)/0.12)] text-lm-teal",
  Forum: "bg-[hsl(var(--lm-emerald)/0.16)] text-lm-ink",
  Social: "bg-[hsl(var(--lm-cyan)/0.2)] text-lm-ink",
  Direct: "bg-[hsl(var(--lm-amber)/0.18)] text-[#8a5a00]",
};

function ago(value) {
  if (!value) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

export default function ActivityList({ recent = [], loading }) {
  const rows = recent.slice(0, 7);
  return (
    <div>
      {loading && <p className="py-6 text-center text-[12px] text-lm-muted">Loading verified activity…</p>}
      {!loading && !rows.length && <p className="py-6 text-center text-[12px] text-lm-muted">No verified activity in this window yet.</p>}
      <ul className="divide-y divide-lm-line">
        {rows.map((r) => {
          const meta = KIND[r.kind] || { label: "Observed record", tag: "Direct" };
          return (
            <li key={r.key} className="flex items-center gap-3 py-2.5 first:pt-0">
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lm-bg text-[10px] font-bold text-lm-teal">•</span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12.5px] font-semibold text-lm-ink">{meta.label}</div>
                <div className="truncate text-[11px] text-lm-muted">
                  {r.city}
                  {r.province_code ? `, ${r.province_code}` : ""} · {ago(r.at)}
                </div>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 font-plex text-[9px] font-bold uppercase tracking-wider ${TAG_STYLE[meta.tag]}`}>{meta.tag}</span>
            </li>
          );
        })}
      </ul>
      <Link to="/demand" className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-bold text-lm-teal hover:underline">
        Full activity ledger <ArrowRight className="h-3 w-3" />
      </Link>
    </div>
  );
}