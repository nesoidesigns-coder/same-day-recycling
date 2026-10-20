import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Truck, CheckCircle2, XCircle, DollarSign, LogOut, MapPin, Phone, PackageCheck } from "lucide-react";

const PARTNER_SHARE = 0.75;
const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

export default function PartnersDashboard() {
  const [stage, setStage] = useState("loading");
  const [partner, setPartner] = useState(null);
  const [me, setMe] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [history, setHistory] = useState([]);

  const load = useCallback(async () => {
    const res = await base44.functions.invoke("partnerPortal", { action: "data" });
    const d = res.data;
    setPartner(d.partner);
    setJobs(d.jobs || []);
    setHistory(d.history || []);
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

  const act = async (bookingId, action) => {
    try {
      const res = await base44.functions.invoke("partnerPortal", { action, booking_id: bookingId });
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin" />
      </div>
    );
  }

  if (stage === "denied") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center">
        <Truck className="w-10 h-10 text-[#1d9e56]" />
        <h1 className="text-2xl font-bold text-[#0c3b24]">Partner access</h1>
        <p className="text-slate-600 max-w-sm">
          {me
            ? `No active partner account is linked to ${me.email}. Ask the Same Day Recycling admin to add you as a partner.`
            : "Please log in with your partner account."}
        </p>
        <button onClick={() => base44.auth.logout("/login")} className="rounded-full bg-[#0c3b24] text-white font-bold px-6 py-3 text-sm">
          Log in with another account
        </button>
      </div>
    );
  }

  const pending = history.filter((h) => !h.payout_paid).reduce((s, h) => s + (Number(h.job_value) || 0), 0) * PARTNER_SHARE;
  const paid = history.filter((h) => h.payout_paid).reduce((s, h) => s + (Number(h.job_value) || 0), 0) * PARTNER_SHARE;

  return (
    <div className="min-h-screen bg-[#f4f7f5]">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-2">Partner dispatch</div>
            <h1 className="text-3xl font-bold text-[#0c3b24]">{partner.name}</h1>
            <p className="flex items-center gap-1 text-sm text-slate-500 mt-1"><MapPin className="w-4 h-4" /> {partner.city}</p>
          </div>
          <button onClick={() => base44.auth.logout("/login")} className="flex items-center gap-2 rounded-full bg-white border border-slate-200 text-[#0c3b24] font-bold px-5 py-2.5 text-sm hover:border-[#1d9e56] transition-colors">
            <LogOut className="w-4 h-4" /> Log out
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <div className="rounded-3xl bg-white border border-slate-100 p-6">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Pending payout</div>
            <div className="text-3xl font-bold text-[#1d9e56] flex items-center gap-2"><DollarSign className="w-6 h-6" />{money(pending)}</div>
            <p className="text-xs text-slate-500 mt-1">75% of completed, unpaid jobs</p>
          </div>
          <div className="rounded-3xl bg-white border border-slate-100 p-6">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">Paid to date</div>
            <div className="text-3xl font-bold text-[#0c3b24] flex items-center gap-2"><CheckCircle2 className="w-6 h-6" />{money(paid)}</div>
            <p className="text-xs text-slate-500 mt-1">Payouts already marked paid</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-[#0c3b24] mb-4">Your jobs</h2>
        {jobs.length === 0 ? (
          <p className="text-slate-500 bg-white rounded-3xl border border-slate-100 p-8 text-center">No jobs assigned right now — you'll see new ones here the moment dispatch assigns them.</p>
        ) : (
          <div className="space-y-4">
            {jobs.map((b) => (
              <div key={b.id} className="rounded-3xl bg-white border border-slate-100 p-5 md:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-[#0c3b24]">{b.name}</span>
                      <a href={`tel:${b.phone}`} className="flex items-center gap-1 text-sm text-[#1d9e56] font-semibold"><Phone className="w-3.5 h-3.5" />{b.phone}</a>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${b.assignment_status === "accepted" ? "bg-[#1d9e56]/15 text-[#1d9e56]" : "bg-amber-100 text-amber-700"}`}>{b.assignment_status}</span>
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{b.address}</p>
                    <p className="text-sm text-slate-500 mt-1">{b.items_description}</p>
                    <p className="text-xs text-slate-400 mt-1">{b.preferred_date || "no date"}{b.time_window ? ` · ${b.time_window}` : ""}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-400 font-semibold">Your payout</div>
                    <div className="text-xl font-bold text-[#1d9e56]">{money((Number(b.job_value) || 0) * PARTNER_SHARE)}</div>
                    <div className="text-xs text-slate-500 mt-1">of {money(b.job_value)} job</div>
                  </div>
                </div>
                <div className="mt-4 flex gap-2 flex-wrap">
                  {b.assignment_status === "assigned" && (
                    <>
                      <button onClick={() => act(b.id, "accept")} className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-5 py-2.5 text-sm hover:bg-[#17a04c] transition-colors flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Accept job
                      </button>
                      <button onClick={() => act(b.id, "decline")} className="rounded-full bg-white border border-slate-200 text-slate-600 font-bold px-5 py-2.5 text-sm hover:border-red-300 transition-colors flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> Decline
                      </button>
                    </>
                  )}
                  {b.assignment_status === "accepted" && (
                    <button onClick={() => act(b.id, "complete")} className="rounded-full bg-[#0c3b24] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#0a3020] transition-colors flex items-center gap-2">
                      <PackageCheck className="w-4 h-4" /> Mark complete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-xl font-bold text-[#0c3b24] mt-10 mb-4">Completed history</h2>
        {history.length === 0 ? (
          <p className="text-slate-500 bg-white rounded-3xl border border-slate-100 p-8 text-center">No completed jobs yet.</p>
        ) : (
          <div className="space-y-3">
            {history.map((b) => (
              <div key={b.id} className="rounded-2xl bg-white border border-slate-100 px-5 py-4 flex items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#0c3b24] text-sm">{b.name} — {b.city || "—"}</div>
                  <div className="text-xs text-slate-500">{b.items_description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="font-bold text-[#1d9e56] text-sm">{money((Number(b.job_value) || 0) * PARTNER_SHARE)}</div>
                  <div className={`text-xs font-bold ${b.payout_paid ? "text-[#1d9e56]" : "text-amber-600"}`}>{b.payout_paid ? "Paid" : "Unpaid"}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}