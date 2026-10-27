import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

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

const TAG = {
  Search: "border-[#00BFA5]/40 text-[#00BFA5]",
  Forum: "border-[#35C99A]/40 text-[#35C99A]",
  Social: "border-[#59BCA8]/40 text-[#59BCA8]",
  Direct: "border-[#FF9800]/40 text-[#FF9800]",
};

function ago(value) {
  if (!value) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

// Latest verified activity: a real platform record or a labelled public
// observation, with the source tag stating which.
export default function ActivityTable({ recent = [], loading }) {
  const rows = recent.slice(0, 5);
  return (
    <section className="console-panel flex h-full flex-col p-3.5">
      <div className="flex items-baseline justify-between gap-2">
        <h2 className="font-heading text-[13.5px] font-bold text-cn-ink">Latest service activity</h2>
        <Link to="/demand" className="text-[10.5px] font-bold text-cn-teal hover:underline">Full ledger</Link>
      </div>

      <div className="mt-2 flex-1">
        {loading && <p className="py-6 text-center text-[11.5px] text-cn-muted">Loading verified activity…</p>}
        {!loading && !rows.length && (
          <p className="py-6 text-center text-[11.5px] text-cn-muted">No verified activity in this window yet.</p>
        )}
        {rows.map((r) => {
          const meta = KIND[r.kind] || { label: "Observed record", tag: "Direct" };
          return (
            <div key={r.key} className="flex items-center gap-2 border-b border-cn-line/40 py-2 last:border-0">
              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] font-semibold text-cn-ink">
                  {meta.label} · {r.city}{r.province_code ? `, ${r.province_code}` : ""}
                </div>
                <div className="text-[10.5px] text-cn-muted">{ago(r.at)}</div>
              </div>
              <span className={`shrink-0 rounded-full border px-2 py-0.5 font-plex text-[9px] font-bold uppercase tracking-wider ${TAG[meta.tag]}`}>
                {meta.tag}
              </span>
            </div>
          );
        })}
      </div>

      <Link to="/live" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-cn-teal hover:underline">
        Open the radar <ArrowRight className="h-3 w-3" />
      </Link>
    </section>
  );
}