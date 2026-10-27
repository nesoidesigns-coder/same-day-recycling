import { Link } from "react-router-dom";
import { ArrowRight, PackageOpen } from "lucide-react";
import PickupList from "@/components/portal/PickupList";

// Household account: their own pickups plus any move/cleanout projects they
// started. Everything here belongs to the signed-in email only.
export default function HouseholdHome({ household }) {
  const projects = household.projects || [];
  return (
    <div className="space-y-5">
      <PickupList bookings={household.bookings || []} emptyLabel="No pickups booked under this email yet." />

      {projects.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-si-line bg-white">
          <div className="border-b border-si-line px-4 py-3">
            <h3 className="flex items-center gap-2 text-sm font-bold text-ri-charcoal">
              <PackageOpen className="h-4 w-4 text-ri-emerald" /> Move & cleanout projects
            </h3>
          </div>
          <ul className="divide-y divide-si-line/70">
            {projects.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-ri-charcoal">{p.name || "Move project"}</p>
                  <p className="mt-0.5 text-xs text-ri-slate">
                    {p.city || "—"}
                    {p.move_flexible ? " · date flexible" : p.move_date ? ` · ${p.move_date}` : ""}
                    {p.stage_count ? ` · ${p.stage_count} stage${p.stage_count === 1 ? "" : "s"}` : ""}
                    {p.reference_code ? ` · code ${p.reference_code}` : ""}
                  </p>
                </div>
                <Link
                  to="/move-assist/dashboard"
                  className="flex items-center gap-1.5 rounded-full border border-si-line px-3 py-1.5 text-xs font-bold text-ri-forest hover:bg-ri-mint/40"
                >
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        to="/request-service"
        className="inline-flex items-center gap-2 rounded-full bg-ri-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-ri-emerald"
      >
        Request another pickup <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  );
}