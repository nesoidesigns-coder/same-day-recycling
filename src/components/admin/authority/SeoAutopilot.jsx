import { useEffect, useState } from "react";
import { Loader2, Bot, CheckCircle2, Clock, ShieldAlert, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

// SEO Autopilot panel — what the background engine fixed, submitted, is
// awaiting on Google, verified as indexed, and what needs owner approval.
// Statuses mirror SeoOpsLog entries created by the scheduled autopilot.
const STATUS = {
  fixed: { label: "Fixed", cls: "bg-[#187B65]/10 text-[#187B65]" },
  submitted: { label: "Submitted", cls: "bg-blue-50 text-blue-700" },
  awaiting_google: { label: "Awaiting Google", cls: "bg-amber-50 text-amber-700" },
  verified_indexed: { label: "Verified indexed", cls: "bg-[#187B65] text-white" },
  needs_approval: { label: "Needs your approval", cls: "bg-red-50 text-red-700" },
  approved: { label: "Approved", cls: "bg-blue-50 text-blue-700" },
  declined: { label: "Declined", cls: "bg-slate-100 text-slate-500" },
  detected: { label: "Detected", cls: "bg-slate-100 text-slate-600" },
  failed: { label: "Failed", cls: "bg-red-50 text-red-700" },
};
const PIPELINE = ["fixed", "submitted", "awaiting_google", "verified_indexed"];

export default function SeoAutopilot() {
  const [entries, setEntries] = useState(null);
  const [me, setMe] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = async () => {
    const page = await base44.entities.SeoOpsLog.filter({}, { sort: "-created_date", limit: 150 });
    setEntries(Array.isArray(page) ? page : page.items || []);
  };
  useEffect(() => {
    (async () => {
      try { setMe(await base44.auth.me()); } catch {}
      await load();
    })();
  }, []);

  const decide = async (e, status) => {
    setBusy(e.id);
    try {
      await base44.entities.SeoOpsLog.update(e.id, {
        status,
        approved_by: me?.email || "",
        history: [...(e.history || []), { date: new Date().toISOString(), event: status, note: me?.email || "" }],
      });
      await load();
    } finally {
      setBusy(null);
    }
  };

  const count = (s) => (entries || []).filter((e) => e.status === s).length;
  const pending = (entries || []).filter((e) => e.status === "needs_approval");
  const recent = (entries || []).slice(0, 25);

  return (
    <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 inline-flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#187B65]" /> SEO Autopilot
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#187B65] bg-[#187B65]/10 rounded-full px-2 py-0.5">runs daily 6:30am PT</span>
      </div>
      <p className="text-[11px] text-slate-500 mb-4">
        The background engine audits technical health and sitemap integrity, repairs safe meta issues and verifies the fix, re-submits the sitemap, and re-checks Google for everything already fixed or submitted. It only asks for you when a code-level fix is genuinely needed.
      </p>

      {!entries ? (
        <div className="flex items-center justify-center py-10 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading autopilot log…
        </div>
      ) : (
        <>
          {/* Pipeline: Fixed → Submitted → Awaiting Google → Verified Indexed */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {PIPELINE.map((s) => (
              <div key={s} className="rounded-2xl bg-[#f4f7f5] border border-slate-100 px-4 py-3.5">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{STATUS[s].label}</div>
                <div className={`mt-0.5 text-xl font-extrabold ${s === "verified_indexed" ? "text-[#187B65]" : "text-[#102B2A]"}`}>{count(s)}</div>
              </div>
            ))}
          </div>

          {/* Changes awaiting owner approval */}
          <div className="mb-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 inline-flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-red-500" /> Changes awaiting owner approval
            </h3>
            {pending.length === 0 ? (
              <p className="text-sm text-slate-600 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" /> Nothing needs your approval — the autopilot handled everything it safely can.
              </p>
            ) : (
              <div className="space-y-2.5">
                {pending.map((e) => (
                  <div key={e.id} className="rounded-2xl border border-red-100 bg-red-50/40 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-red-50 text-red-700`}>{e.area.replace(/_/g, " ")}</span>
                      <span className="font-mono text-[11px] text-[#102B2A] break-all">{String(e.url || "").replace(/^https?:\/\/[^/]+/, "") || "site-wide"}</span>
                    </div>
                    <div className="mt-2 text-sm font-bold text-[#102B2A]">{e.issue}</div>
                    <div className="mt-1 text-[12px] text-slate-600"><span className="font-semibold">Evidence:</span> {e.evidence}</div>
                    <div className="mt-0.5 text-[12px] text-slate-600"><span className="font-semibold text-[#187B65]">Fix:</span> {e.fix}</div>
                    {e.status_detail && <div className="mt-0.5 text-[11px] text-slate-500 break-all">{e.status_detail}</div>}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => decide(e, "approved")}
                        disabled={busy === e.id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] text-white text-xs font-bold px-3.5 py-2 hover:bg-[#125C4E] transition-colors disabled:opacity-50"
                      >
                        {busy === e.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                      </button>
                      <button
                        onClick={() => decide(e, "declined")}
                        disabled={busy === e.id}
                        className="rounded-full border border-slate-200 text-xs font-bold px-3.5 py-2 text-[#102B2A] hover:border-slate-400 transition-colors disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Repair & verification ledger */}
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#187B65]" /> Repair &amp; verification ledger
          </h3>
          {recent.length === 0 ? (
            <p className="text-sm text-slate-600">No autopilot runs logged yet — the first daily run writes here tomorrow at 6:30am PT.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-4">When</th>
                    <th className="py-2 pr-4">Item</th>
                    <th className="py-2 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((e) => (
                    <tr key={e.id} className="border-t border-slate-100 align-top">
                      <td className="py-2.5 pr-4 text-xs text-slate-500 whitespace-nowrap">{(e.run_date || "").slice(0, 10)} <span className="block text-[10px] uppercase">{e.area?.replace(/_/g, " ")}</span></td>
                      <td className="py-2.5 pr-4">
                        <div className="text-[13px] font-semibold text-[#102B2A]">{e.issue}</div>
                        {e.url && <div className="font-mono text-[11px] text-slate-500 break-all">{String(e.url).replace(/^https?:\/\/[^/]+/, "") || "/"}</div>}
                        {e.fix_applied && <span className="mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase bg-[#187B65]/10 text-[#187B65]">applied by autopilot</span>}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase whitespace-nowrap ${(STATUS[e.status] || STATUS.detected).cls}`}>{(STATUS[e.status] || STATUS.detected).label}</span>
                        {e.status_detail && <div className="mt-1 text-[11px] text-slate-500 max-w-xs">{e.status_detail}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}