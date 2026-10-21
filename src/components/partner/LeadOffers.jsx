import { CheckCircle2, XCircle, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { OFFER_STATUS_LABEL, SERVICE_LABELS } from "@/lib/dispatchShared";

const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

export default function LeadOffers({ offers, onChanged }) {
  const act = async (offerId, response) => {
    await base44.functions.invoke("dispatchEngine", { action: "respond", offer_id: offerId, response });
    onChanged();
  };

  const open = (offers || []).filter((o) => o.status === "offered");

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight">Job offers for you</h2>
        <span className={label}>{open.length} waiting · respond before the window closes</span>
      </div>
      {open.length === 0 ? (
        <p className={`${panel} p-8 text-center text-emerald-100/50 text-sm`}>
          No open offers right now — when a customer request matches your territory, it lands here first.
        </p>
      ) : (
        <div className="space-y-4">
          {open.map((o) => (
            <div key={o.id} className={`${panel} p-5 md:p-6`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] bg-[#187B65]/15 text-[#187B65] border border-[#187B65]/30">
                      {SERVICE_LABELS[o.service_type] || "Request"}
                    </span>
                    {o.subscriberPriority && (
                      <span className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] bg-gold/15 text-gold border border-gold/30">
                        Territory priority
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-emerald-100/70 mt-3">{o.items_description}</p>
                  <p className="text-[11px] text-emerald-100/40 mt-1 tabular-nums flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    {o.is_expired
                      ? "Expired — the job moves to the next contractor unless dispatch reoffers it"
                      : `Respond before ${String(o.expires_at || "").slice(0, 16).replace("T", " ")}`}
                  </p>
                  <p className="mt-3 rounded-xl border border-[#187B65]/25 bg-[#0a2b1e]/50 px-3 py-2 text-[11px] text-emerald-100/70">
                    <span className="font-bold text-[#187B65] uppercase tracking-[0.15em] text-[10px]">Fee terms · </span>
                    {o.fee_disclosure}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <div className={label}>Your payout</div>
                  <div className="text-xl font-bold text-[#187B65] holo-glow-text mt-1 tabular-nums">
                    ${(Math.max(0, (Number(o.quote_amount) || 0) - (Number(o.fee_amount) || 0))).toLocaleString("en-CA")}
                  </div>
                  {Number(o.fee_amount) > 0 && (
                    <div className="text-[11px] text-emerald-100/40 mt-1 tabular-nums">of ${(Number(o.quote_amount) || 0).toLocaleString("en-CA")} job</div>
                  )}
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      disabled={o.is_expired}
                      onClick={() => act(o.id, "accept")}
                      className="rounded-full bg-[#187B65] text-[#032015] font-bold px-5 py-2.5 text-sm hover:bg-[#1FA184] transition-colors flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(24,123,101,0.35)] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept job
                    </button>
                    <button
                      disabled={o.is_expired}
                      onClick={() => act(o.id, "decline")}
                      className="rounded-full border border-emerald-100/20 text-emerald-100/70 font-bold px-5 py-2.5 text-sm hover:border-red-400/50 hover:text-red-300 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <XCircle className="w-4 h-4" /> Decline
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}