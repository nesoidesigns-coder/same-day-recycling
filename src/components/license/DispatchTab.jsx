import { base44 } from "@/api/base44Client";
import { Truck, XCircle } from "lucide-react";

const NEXT = { scheduled: "dispatched", dispatched: "completed" };

export default function DispatchTab({ pickups, onChanged }) {
  const active = pickups
    .filter((p) => p.status === "scheduled" || p.status === "dispatched")
    .sort((a, b) => (a.scheduled_date || "").localeCompare(b.scheduled_date || ""));

  const advance = async (p) => {
    await base44.entities.LicensePickup.update(p.id, { status: NEXT[p.status] });
    onChanged();
  };

  const cancel = async (p) => {
    await base44.entities.LicensePickup.update(p.id, { status: "cancelled" });
    onChanged();
  };

  return (
    <div>
      <h2 className="text-lg font-bold text-[#0c3b24] mb-4">Dispatch board ({active.length} live)</h2>
      {active.length === 0 ? (
        <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-10 text-center text-slate-500">No live jobs. Schedule pickups to fill the board.</div>
      ) : (
        <div className="space-y-3">
          {active.map((p) => (
            <div key={p.id} className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#0c3b24]">{p.customer_name}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${p.status === "dispatched" ? "bg-amber-100 text-amber-700" : "bg-sky-100 text-sky-700"}`}>{p.status}</span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{p.scheduled_date}{p.time_window ? ` · ${p.time_window}` : ""}{p.driver ? ` · Driver: ${p.driver}` : ""}</div>
                <div className="text-xs text-slate-500">{[p.address, p.city].filter(Boolean).join(", ")}{p.customer_phone ? ` · ${p.customer_phone}` : ""}</div>
                {p.items_description && <div className="text-xs text-slate-400 mt-1">{p.items_description}</div>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => advance(p)} className="rounded-full bg-[#1d9e56] text-[#0c3b24] px-4 py-2 text-sm font-bold hover:bg-[#17a04c] transition-colors flex items-center gap-1.5">
                  <Truck className="w-4 h-4" /> {p.status === "scheduled" ? "Dispatch" : "Complete"}
                </button>
                <button onClick={() => cancel(p)} className="rounded-full bg-slate-100 text-slate-600 px-3 py-2 text-sm font-semibold hover:bg-slate-200 transition-colors" aria-label="Cancel pickup">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}