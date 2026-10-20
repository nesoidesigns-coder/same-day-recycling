import { Truck, MapPin, CheckCircle2, Clock } from "lucide-react";

const PARTNER_SHARE = 0.75;
const money = (n) => "$" + Math.round((Number(n) || 0) * PARTNER_SHARE).toLocaleString("en-CA");

const panel = "relative overflow-hidden rounded-2xl border border-[#1d9e56]/25 bg-[#0c3b24]/50 backdrop-blur-sm p-5";

export default function ContractorStatus({ partners, bookings }) {
  if (!partners.length) {
    return (
      <div className={`${panel} text-center text-emerald-100/50`}>
        <Truck className="w-8 h-8 mx-auto text-[#1d9e56]/40" />
        <p className="mt-3">No contractors in the network yet.</p>
      </div>
    );
  }

  const statLabel = "text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-100/40";

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {partners.map((p) => {
        const mine = bookings.filter((b) => b.partner_id === p.id);
        const active = mine.filter((b) => ["assigned", "accepted"].includes(b.assignment_status));
        const completed = mine.filter((b) => b.assignment_status === "completed");
        const pending = completed.filter((b) => !b.payout_paid).reduce((s, b) => s + (Number(b.job_value) || 0), 0) * PARTNER_SHARE;
        return (
          <div key={p.id} className={panel}>
            <div className="holo-scan absolute top-0 left-0 right-0 h-px bg-[#1d9e56]/50" />
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-[#1d9e56]" />
                <span className="font-bold text-white">{p.name}</span>
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-[0.15em] rounded-full px-2.5 py-0.5 ${p.active === false ? "bg-red-500/15 text-red-300 border border-red-400/30" : "bg-[#1d9e56]/15 text-[#1d9e56] border border-[#1d9e56]/30"}`}>
                {p.active === false ? "inactive" : "active"}
              </span>
            </div>
            <p className="flex items-center gap-1 text-xs text-emerald-100/50 mt-1"><MapPin className="w-3 h-3 text-[#1d9e56]" /> {p.city || "Territory not set"}</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <div>
                <div className="text-lg font-bold text-white tabular-nums">{active.length}</div>
                <div className={statLabel + " inline-flex items-center gap-1"}><Clock className="w-3 h-3" /> active jobs</div>
              </div>
              <div>
                <div className="text-lg font-bold text-white tabular-nums">{completed.length}</div>
                <div className={statLabel + " inline-flex items-center gap-1"}><CheckCircle2 className="w-3 h-3" /> completed</div>
              </div>
              <div>
                <div className="text-lg font-bold text-[#1d9e56] holo-glow-text tabular-nums">{money(pending)}</div>
                <div className={statLabel}>pending payout</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}