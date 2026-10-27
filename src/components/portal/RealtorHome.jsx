import { Link } from "react-router-dom";
import { Home, ArrowRight } from "lucide-react";

const STATUS_LABEL = {
  new: "Received",
  contacted: "Contacted",
  quoted: "Quoted",
  booked: "Booked",
  closed: "Closed",
};

// Realtor / referral partner: the cleanouts they referred and where each one
// stands. Read-only — referral details are never edited from here.
export default function RealtorHome({ realtor }) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-si-line bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-bold text-ri-charcoal">
              <Home className="h-4 w-4 text-ri-emerald" /> {realtor.agent_name || "Referral partner"}
            </h2>
            {realtor.brokerage ? <p className="mt-1 text-sm text-ri-slate">{realtor.brokerage}</p> : null}
          </div>
          <Link
            to="/realtors"
            className="flex items-center gap-2 rounded-full bg-ri-forest px-4 py-2 text-sm font-bold text-white hover:bg-ri-emerald"
          >
            Send a referral <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-si-line bg-white">
        <div className="border-b border-si-line px-4 py-3">
          <h3 className="text-sm font-bold text-ri-charcoal">Your referrals</h3>
        </div>
        <ul className="divide-y divide-si-line/70">
          {realtor.leads.map((l) => (
            <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ri-charcoal">{l.property_address || "Property"}</p>
                <p className="mt-0.5 text-xs text-ri-slate">
                  {l.city || "—"}
                  {l.preferred_date ? ` · ${l.preferred_date}` : ""}
                  {l.quote_low || l.quote_high ? ` · quoted $${l.quote_low || 0}–$${l.quote_high || 0}` : ""}
                </p>
              </div>
              <span className="rounded-full bg-ri-mint/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-ri-emerald-ink">
                {STATUS_LABEL[l.status] || l.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}