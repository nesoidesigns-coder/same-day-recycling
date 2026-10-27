import { Link } from "react-router-dom";
import { RefreshCw, Building2, ArrowRight } from "lucide-react";
import PickupList from "@/components/portal/PickupList";

// Property manager / business account: a recurring pickup plan plus the
// pickups booked under this company email.
export default function BusinessHome({ business, bookings }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-si-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-ri-emerald" />
              <h2 className="text-lg font-bold text-ri-charcoal">{business.company || "Your company"}</h2>
            </div>
            <p className="mt-1 text-sm text-ri-slate">{business.plan || "No plan on file"}</p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
              business.status === "active" ? "bg-ri-mint/60 text-ri-emerald-ink" : "bg-ri-amber/15 text-ri-amber-ink"
            }`}
          >
            {business.status === "active" ? "Plan active" : `Plan ${business.status}`}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            to="/request-service"
            className="flex items-center gap-2 rounded-full bg-ri-forest px-4 py-2 text-sm font-bold text-white hover:bg-ri-emerald"
          >
            <RefreshCw className="h-4 w-4" /> Book a pickup
          </Link>
          <Link
            to="/subscriptions"
            className="flex items-center gap-2 rounded-full border border-si-line px-4 py-2 text-sm font-bold text-ri-forest hover:bg-ri-mint/40"
          >
            Plan details <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <PickupList bookings={bookings} emptyLabel="No pickups booked under this account yet." />
    </div>
  );
}