import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Truck, CheckCircle2, XCircle, DollarSign, LogOut, MapPin, Phone, PackageCheck, Radio } from "lucide-react";
import TerritoryCard from "@/components/partner/TerritoryCard";
import IncomingRequests from "@/components/partner/IncomingRequests";
import Financials from "@/components/partner/Financials";
import Performance from "@/components/partner/Performance";
import ValueDashboard from "@/components/partner/ValueDashboard";
import SubscriptionTerms from "@/components/partner/SubscriptionTerms";
import LeadOffers from "@/components/partner/LeadOffers";
import DisputeResponse from "@/components/partner/DisputeResponse";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");

// Payout math follows the job's own recorded fee terms — no global share.
const jobNet = (b) => {
  const v = Number(b.job_value) || 0;
  const rule = String(b.fee_terms_snapshot?.rule || "");
  let fee = 0;
  if (rule.startsWith("percentage_")) fee = (v * (Number(rule.split("_")[1]) || 0)) / 100;
  else if (rule.startsWith("fixed_")) fee = Number(rule.split("_")[1]) || 0;
  else if (b.referred_by_admin) fee = (v * (Number(b.commission_rate) || 0)) / 100;
  return Math.max(0, v - fee - (Number(b.refund_amount) || 0));
};

const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

export default function PartnersDashboard() {
  const [stage, setStage] = useState("loading");
  const [partner, setPartner] = useState(null);
  const [me, setMe] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);
  const [requests, setRequests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [arrivalPick, setArrivalPick] = useState("");

  const load = useCallback(async () => {
    const res = await base44.functions.invoke("partnerPortal", { action: "data" });
    const d = res.data;
    setPartner(d.partner);
    setJobs(d.jobs || []);
    setHistory(d.history || []);
    setRequests(d.requests || []);
    try {
      const o = await base44.functions.invoke("dispatchEngine", { action: "offers" });
      setOffers(o.data.offers || []);
    } catch {
      setOffers([]);
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setMe(me);
        await load();
        setStage("ready");
      } catch {
        setStage("denied");
      }
    })();
  }, [load]);

  const act = async (bookingId, action, arrivalStatus) => {
    try {
      const res = await base44.functions.invoke("partnerPortal", { action, booking_id: bookingId, arrival_status: arrivalStatus });
      const d = res.data;
      setJobs(d.jobs || []);
      setHistory(d.history || []);
    } catch {
      // Non-2xx responses come back as thrown errors — the server already
      // validated ownership, so a failure here just means the state moved.
      await load().catch(() => {});
    }
  };

  if (stage === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#051511]">
        <Loader2 className="w-8 h-8 text-[#187B65] animate-spin" />
      </div>
    );
  }

  if (stage === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center bg-[#051511]">
        <span className="w-14 h-14 rounded-2xl border border-[#187B65]/40 bg-[#102B2A]/60 flex items-center justify-center">
          <Truck className="w-7 h-7 text-[#187B65]" />
        </span>
        <h1 className="text-2xl font-bold text-white tracking-tight">Partner access</h1>
        <p className="text-emerald-100/60 max-w-sm text-sm">
          {me
            ? `No active partner account is linked to ${me.email}. Ask the Same Day Recycling admin to add you as a partner.`
            : "Please log in with your partner account."}
        </p>
        <button onClick={() => window.location.assign("/partner-register")} className="rounded-full border border-[#187B65]/40 bg-transparent text-emerald-50 font-bold px-6 py-3 text-sm hover:border-[#187B65] transition-colors">
          Register as a partner
        </button>
        <button onClick={() => base44.auth.logout("/login")} className="rounded-full bg-[#187B65] text-[#032015] font-bold px-6 py-3 text-sm hover:bg-[#1FA184] transition-colors">
          Log in with another account
        </button>
      </div>
    );
  }

  const pending = history.filter((h) => !h.payout_paid).reduce((s, h) => s + jobNet(h), 0);
  const paid = history.filter((h) => h.payout_paid).reduce((s, h) => s + jobNet(h), 0);

  return (
    <div className="min-h-screen bg-[#051511] text-emerald-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
          <div>
            <div className={`${label} flex items-center gap-2 mb-2`}>
              <Radio className="w-3.5 h-3.5 text-[#187B65] holo-flicker" /> Partner dispatch
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">{partner.name}</h1>
            <p className="flex items-center gap-1.5 text-sm text-emerald-100/50 mt-1">
              <MapPin className="w-4 h-4 text-[#187B65]" /> {partner.city}
            </p>
          </div>
          <button onClick={() => base44.auth.logout("/login")} className="flex items-center gap-2 rounded-full border border-[#187B65]/40 bg-[#102B2A]/40 px-5 py-2.5 text-sm font-bold text-emerald-50 hover:border-[#187B65] transition-colors">
            <LogOut className="w-4 h-4 text-[#187B65]" /> Log out
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className={`${panel} p-6`}>
            <div className="holo-scan absolute top-0 left-0 right-0 h-px bg-[#187B65]/50" />
            <div className={label}>Pending payout</div>
            <div className="text-3xl font-bold text-[#187B65] holo-glow-text flex items-center gap-2 mt-3 tabular-nums">
              <DollarSign className="w-6 h-6" />{money(pending)}
            </div>
            <p className="text-xs text-emerald-100/40 mt-2">Net of agreed fees on completed, unpaid jobs</p>
          </div>
          <div className={`${panel} p-6`}>
            <div className={label}>Paid to date</div>
            <div className="text-3xl font-bold text-white flex items-center gap-2 mt-3 tabular-nums">
              <CheckCircle2 className="w-6 h-6 text-[#187B65]" />{money(paid)}
            </div>
            <p className="text-xs text-emerald-100/40 mt-2">Payouts already marked paid</p>
          </div>
        </div>

        <Financials />

        <Performance />

        <ValueDashboard />

        <DisputeResponse />

        <SubscriptionTerms />

        <div className="mb-10">
          <TerritoryCard />
        </div>

        <LeadOffers offers={offers} onChanged={load} />

        <IncomingRequests requests={requests} city={partner.city} />

        <h2 className="text-xl font-bold text-white tracking-tight mb-4">Your jobs</h2>
        {jobs.length === 0 ? (
          <p className={`${panel} p-8 text-center text-emerald-100/50 text-sm`}>No jobs assigned right now — you'll see new ones here the moment dispatch assigns them.</p>
        ) : (
          <div className="space-y-4">
            {jobs.map((b) => (
              <div key={b.id} className={`${panel} p-5 md:p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-white">{b.name}</span>
                      <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-sm text-[#187B65] font-semibold hover:text-[#1FA184] transition-colors">
                        <Phone className="w-3.5 h-3.5" />{b.phone}
                      </a>
                      <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${b.assignment_status === "accepted" ? "bg-[#187B65]/15 text-[#187B65] border border-[#187B65]/30" : "bg-amber-400/10 text-amber-300 border border-amber-400/30"}`}>
                        {b.assignment_status}
                      </span>
                    </div>
                    <p className="text-sm text-emerald-100/70 mt-2">{b.address}</p>
                    <p className="text-sm text-emerald-100/40 mt-1">{b.items_description}</p>
                    <p className="text-[11px] text-emerald-100/30 mt-1 tabular-nums">{b.preferred_date || "no date"}{b.time_window ? ` · ${b.time_window}` : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className={label}>Your payout</div>
                    <div className="text-xl font-bold text-[#187B65] holo-glow-text mt-1 tabular-nums">{money(jobNet(b))}</div>
                    <div className="text-[11px] text-emerald-100/40 mt-1 tabular-nums">of {money(b.job_value)} job</div>
                  </div>
                </div>
                <div className="mt-3 rounded-xl border border-[#187B65]/25 bg-[#0a2b1e]/50 px-3 py-2 text-[11px] text-emerald-100/70">
                  <span className="font-bold text-[#187B65] uppercase tracking-[0.15em] text-[10px]">Financial terms · </span>
                  {b.fee_disclosure || "No platform fee applies to this job."}
                  {b.referred_by_admin && Number(b.commission_rate) > 0 ? ` Referral commission: ${b.commission_rate}%.` : ""}
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  {b.assignment_status === "assigned" && (
                    <>
                      <button onClick={() => act(b.id, "accept")} className="rounded-full bg-[#187B65] text-[#032015] font-bold px-5 py-2.5 text-sm hover:bg-[#1FA184] transition-colors flex items-center gap-2 shadow-[0_0_20px_rgba(24,123,101,0.35)]">
                        <CheckCircle2 className="w-4 h-4" /> Accept job
                      </button>
                      <button onClick={() => act(b.id, "decline")} className="rounded-full border border-emerald-100/20 text-emerald-100/70 font-bold px-5 py-2.5 text-sm hover:border-red-400/50 hover:text-red-300 transition-colors flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </>
                  )}
                  {b.assignment_status === "accepted" && (
                    arrivalPick === b.id ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65]">Arrival was:</span>
                        {["on_time", "late", "no_show"].map((s) => (
                          <button key={s} onClick={() => { setArrivalPick(""); act(b.id, "complete", s); }} className="rounded-full border border-[#187B65]/50 bg-[#187B65]/10 text-[#187B65] font-bold px-3.5 py-2 text-xs hover:bg-[#187B65]/20 transition-colors capitalize">
                            {s.replace("_", " ")}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <button onClick={() => setArrivalPick(b.id)} className="rounded-full border border-[#187B65]/60 bg-[#187B65]/10 text-[#187B65] font-bold px-5 py-2.5 text-sm hover:bg-[#187B65]/20 transition-colors flex items-center gap-2">
                        <PackageCheck className="w-4 h-4" /> Mark complete
                      </button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold text-white tracking-tight mt-10 mb-4">Completed history</h2>
        {history.length === 0 ? (
          <p className={`${panel} p-8 text-center text-emerald-100/50 text-sm`}>No completed jobs yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((b) => (
              <div key={b.id} className={`${panel} px-5 py-4 flex items-center justify-between gap-3`}>
                <div>
                  <div className="font-bold text-white text-sm">{b.name} — {b.city || "—"}</div>
                  <div className="text-[11px] text-emerald-100/40 mt-0.5">{b.items_description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-[#187B65] text-sm tabular-nums">{money(jobNet(b))}</div>
                  <div className={`text-[10px] font-bold uppercase tracking-[0.15em] ${b.payout_paid ? "text-[#187B65]" : "text-amber-300"}`}>{b.payout_paid ? "Paid" : "Unpaid"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}