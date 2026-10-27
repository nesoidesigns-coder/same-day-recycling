import { Link } from "react-router-dom";
import { Truck, PackageCheck, MapPin, BadgeCheck, ArrowRight } from "lucide-react";

// Contractor home — the Recycling OS subscriber's landing inside the portal.
// Numbers come from the resolver; the full dispatch OS is the existing
// partner dashboard, now reachable outside the admin frame.
export default function ContractorHome({ contractor }) {
  const stats = [
    { label: "Jobs needing action", value: contractor.active_jobs, icon: Truck },
    { label: "Completed jobs", value: contractor.completed_jobs, icon: PackageCheck },
    { label: "Open requests in your city", value: contractor.open_requests, icon: MapPin },
  ];

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-si-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-ri-charcoal">{contractor.name || "Your business"}</h2>
              {contractor.verified ? (
                <span className="flex items-center gap-1 rounded-full bg-ri-mint/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ri-emerald-ink">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="rounded-full bg-ri-amber/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ri-amber-ink">
                  Verification pending
                </span>
              )}
            </div>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ri-slate">
              <MapPin className="h-3.5 w-3.5" /> {contractor.city || "Service area not set"}
            </p>
          </div>
          <Link
            to="/portal/contractor"
            className="flex items-center gap-2 rounded-full bg-ri-forest px-5 py-2.5 text-sm font-bold text-white hover:bg-ri-emerald"
          >
            Open my operating system <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="rounded-xl border border-si-line bg-ri-ivory p-4">
                <Icon className="h-4 w-4 text-ri-emerald" />
                <div className="mt-2 text-2xl font-bold text-ri-charcoal tabular">{s.value}</div>
                <div className="text-xs text-ri-slate">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-ri-slate">
        Your jobs, payouts, territory, compliance documents and leads live in the operating system — sign in once, everything is there.
      </p>
    </div>
  );
}