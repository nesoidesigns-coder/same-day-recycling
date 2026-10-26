import { Link } from "react-router-dom";
import { UserPlus, Globe2, Truck, Wallet, Server } from "lucide-react";

// One unified admin overview → five dedicated intelligence areas. The
// overview stays lean; each area's deep dashboards live behind its card.
const AREAS = [
  {
    key: "acquisition",
    title: "Customer Acquisition",
    desc: "Visits by class, traffic sources, quote requests, bookings and conversion.",
    to: "/admin/acquisition",
    Icon: UserPlus,
  },
  {
    key: "market",
    title: "National Market Intelligence",
    desc: "Observed Canadian demand, search performance and public discoveries.",
    to: "/admin/intelligence",
    Icon: Globe2,
  },
  {
    key: "contractors",
    title: "Contractor Operations",
    desc: "Verified providers, dispatch queues, assignments and exceptions.",
    to: "/admin/contractor-ops",
    Icon: Truck,
  },
  {
    key: "financial",
    title: "Financial Intelligence",
    desc: "Gross value, commissions, payouts and collected revenue.",
    to: "/admin/revenue",
    Icon: Wallet,
  },
  {
    key: "system",
    title: "System Administration",
    desc: "Integration health, integrations, workflows and platform settings.",
    to: "/admin/system",
    Icon: Server,
  },
];

export default function CommandAreas() {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
      {AREAS.map((a) => (
        <Link
          key={a.key}
          to={a.to}
          className="group rounded-2xl border border-slate-200/70 bg-white shadow-sm p-4 transition-all hover:border-li-infra/50 hover:shadow-md"
        >
          <span className="inline-flex size-9 items-center justify-center rounded-full bg-li-mint/20 text-li-infra" aria-hidden="true">
            <a.Icon className="size-4.5" />
          </span>
          <h3 className="mt-3 text-sm font-bold text-li-carbon leading-snug">{a.title}</h3>
          <p className="mt-1 text-xs leading-snug text-li-slate">{a.desc}</p>
          <span className="mt-2 inline-block font-plex text-[10px] font-bold uppercase tracking-[0.18em] text-li-infra opacity-0 transition-opacity group-hover:opacity-100">
            Open →
          </span>
        </Link>
      ))}
    </div>
  );
}