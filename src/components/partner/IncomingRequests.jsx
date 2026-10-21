import { MapPin, Phone, CalendarDays, Truck } from "lucide-react";

const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

const SERVICE_LABELS = {
  junk_removal: "Junk removal",
  furniture: "Furniture",
  appliances: "Appliances",
  electronics: "Electronics",
  metal_pickup: "Metal pickup",
  cleanouts: "Cleanout",
  other: "Other",
};

export default function IncomingRequests({ requests, city }) {
  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Truck className="w-5 h-5 text-[#187B65]" /> Incoming requests
        </h2>
        <span className={label}>{city} · open, unassigned</span>
      </div>
      {(!requests || requests.length === 0) ? (
        <p className={`${panel} p-8 text-center text-emerald-100/50 text-sm`}>
          No open requests in {city} right now — new ones from customers in your territory appear here automatically.
        </p>
      ) : (
        <div className="space-y-4">
          {requests.map((r) => (
            <div key={r.id} className={`${panel} p-5 md:p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white">{r.name}</span>
                    <a href={`tel:${r.phone}`} className="flex items-center gap-1 text-sm text-[#187B65] font-semibold hover:text-[#1FA184] transition-colors">
                      <Phone className="w-3.5 h-3.5" />{r.phone}
                    </a>
                    <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] bg-[#187B65]/15 text-[#187B65] border border-[#187B65]/30">
                      {SERVICE_LABELS[r.service_type] || "Request"}
                    </span>
                  </div>
                  {r.address && <p className="text-sm text-emerald-100/70 mt-2 flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 shrink-0 text-[#187B65]" />{r.address}{r.postal_code ? `, ${r.postal_code}` : ""}</p>}
                  <p className="text-sm text-emerald-100/40 mt-1">{r.items_description}</p>
                  <p className="text-[11px] text-emerald-100/30 mt-1 tabular-nums flex items-center gap-1.5">
                    <CalendarDays className="w-3 h-3" />{r.preferred_date || "No preferred date"} · requested {String(r.created_date || "").slice(0, 10)}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className={label}>City</div>
                  <div className="text-sm font-bold text-white mt-1">{r.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}