import { Link } from "react-router-dom";
import { Truck } from "lucide-react";

const STATUS_STYLE = {
  completed: "bg-ri-mint/60 text-ri-emerald-ink",
  cancelled: "bg-red-500/10 text-red-700",
  scheduled: "bg-ri-sky text-ri-emerald-ink",
  confirmed: "bg-ri-sky text-ri-emerald-ink",
};
const statusClass = (s) => STATUS_STYLE[s] || "bg-ri-amber/15 text-ri-amber-ink";

// A customer's own pickups. The tracking code is shown so it can be handed to
// the public tracker — never used as a hidden deep link.
export default function PickupList({ bookings = [], emptyLabel }) {
  if (!bookings.length) {
    return <p className="rounded-2xl border border-si-line bg-white p-6 text-sm text-ri-slate">{emptyLabel}</p>;
  }
  return (
    <div className="overflow-hidden rounded-2xl border border-si-line bg-white">
      <div className="border-b border-si-line px-4 py-3">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ri-charcoal">
          <Truck className="h-4 w-4 text-ri-emerald" /> Your pickups
        </h3>
      </div>
      <ul className="divide-y divide-si-line/70">
        {bookings.map((b) => (
          <li key={b.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ri-charcoal">{b.items_description || "Pickup"}</p>
              <p className="mt-0.5 text-xs text-ri-slate">
                {b.city || "—"}
                {b.preferred_date ? ` · ${b.preferred_date}` : ""}
                {b.reference_code ? ` · code ${b.reference_code}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusClass(b.status)}`}>
                {String(b.status || "new").replace("_", " ")}
              </span>
              <Link to="/track" className="text-xs font-bold text-ri-forest underline-offset-2 hover:underline">
                Track
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}