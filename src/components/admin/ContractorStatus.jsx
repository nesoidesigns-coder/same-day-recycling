import { Truck, MapPin, CheckCircle2, Clock } from "lucide-react";

const PARTNER_SHARE = 0.75;
const money = (n) => "$" + Math.round((Number(n) || 0) * PARTNER_SHARE).toLocaleString("en-CA");

export default function ContractorStatus({ partners, bookings }) {
  if (!partners.length) {
    return (
      <div className="rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
        <Truck className="w-8 h-8 mx-auto text-slate-300" />
        <p className="mt-3">No contractors in the network yet.</p>
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {partners.map((p) => {
        const mine = bookings.filter((b) => b.partner_id === p.id);
        const active = mine.filter((b) => ["assigned", "accepted"].includes(b.assignment_status));
        const completed = mine.filter((b) => b.assignment_status === "completed");
        const pending = completed.filter((b) => !b.payout_paid).reduce((s, b) => s + (Number(b.job_value) || 0), 0) * PARTNER_SHARE;
        return (
          <div key={p.id} className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#1d9e56]" />
                <span className="font-bold text-[#0c3b24]">{p.name}</span>
              </div>
              <span className={`text-[11px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${p.active === false ? "bg-red-100 text-red-600" : "bg-[#1d9e56]/15 text-[#1d9e56]"}`}>
                {p.active === false ? "inactive" : "active"}
              </span>
            </div>
            <p className="flex items-center gap-1 text-xs text-slate-500 mt-1"><MapPin className="w-3 h-3" /> {p.city || "Territory not set"}</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div>
                <div className="text-lg font-bold text-[#0c3b24] tabular-nums">{active.length}</div>
                <div className="text-[11px] text-slate-500 inline-flex items-center gap-1"><Clock className="w-3 h-3" /> active jobs</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#0c3b24] tabular-nums">{completed.length}</div>
                <div className="text-[11px] text-slate-500 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> completed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#1d9e56] tabular-nums">{money(pending)}</div>
                <div className="text-[11px] text-slate-500">pending payout</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}