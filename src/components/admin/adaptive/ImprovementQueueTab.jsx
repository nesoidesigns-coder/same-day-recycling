import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, Lock, X } from "lucide-react";
import { fmtDate } from "./adaptiveData";

const card = "rounded-2xl border border-li-steel bg-white p-4";
const RISK = {
  low: "bg-emerald-100 text-emerald-800",
  medium: "bg-amber-100 text-[#8f5d00]",
  high: "bg-red-100 text-red-700",
};

// The approval queue. Approving here records the decision only — it never edits
// prices, payments, bookings, coverage, terms or code. Implementation stays with
// the existing owners of each change and is logged by them.
export default function ImprovementQueueTab({ data, reload }) {
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");

  const decide = async (item, decision) => {
    setBusy(item.id);
    setNote("");
    try {
      const me = await base44.auth.me().catch(() => null);
      const stamp = { date: new Date().toISOString(), event: decision, note: `${decision === "approved" ? "Approval" : "Decline"} recorded by ${me?.email || "admin"}. No change applied automatically.` };
      if (item._kind === "improvement") {
        await base44.entities.Improvement.update(item.id, { status: decision, history: [...(item.history || []), stamp] });
      } else {
        await base44.entities.GrowthDecision.update(item.id, { status: decision === "approved" ? "approved" : "declined", changelog: [...(item.changelog || []), stamp] });
      }
      setNote(`Recorded: ${decision} — ${item.title}`);
      await reload();
    } catch (e) {
      setNote(e?.message || "Could not record the decision.");
    } finally {
      setBusy("");
    }
  };

  const riskOf = (item) => (item._kind === "decision" ? item.risk_tier || "medium" : item.severity === "critical" ? "high" : item.severity === "major" ? "medium" : "low");

  return (
    <div className="space-y-5">
      <div className={`${card} flex items-start gap-3`}>
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-li-forest" />
        <div className="text-xs text-li-slate">
          <div className="text-sm font-bold text-li-carbon">Human approval is required for every item here.</div>
          The system never changes pricing, discounts, payment rules, booking commitments, contractor assignments, coverage promises, customer notifications, legal terms, security settings, production code or database schemas on its own. Approving records the decision; the change is still implemented and verified by a person.
        </div>
      </div>

      {note && <div className="rounded-xl border border-li-steel bg-white px-4 py-2 text-xs text-li-carbon" role="status">{note}</div>}

      {data.pending.length === 0 ? (
        <div className={card}><p className="text-sm text-li-slate">Nothing is awaiting a decision.</p></div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {data.pending.map((item) => {
            const risk = riskOf(item);
            return (
              <div key={`${item._kind}-${item.id}`} className={card}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${RISK[risk] || RISK.medium}`}>Risk {risk}</span>
                  <span className="rounded-full bg-li-pale px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-li-carbon">{item._kind === "improvement" ? "Improvement" : "Decision"}</span>
                  <span className="text-[11px] text-li-slate">{fmtDate(item.created_date)}</span>
                </div>
                <div className="mt-2 text-sm font-semibold text-li-carbon">{item.title}</div>
                {item._kind === "improvement" ? (
                  <>
                    <p className="mt-1 text-xs text-li-slate"><span className="font-semibold text-li-carbon">Evidence: </span>{item.evidence || "No evidence recorded."}</p>
                    <p className="mt-1 text-xs text-li-slate"><span className="font-semibold text-li-carbon">Proposed fix: </span>{item.recommendation || "Not stated."}</p>
                    {item.business_impact && <p className="mt-1 text-xs text-li-slate"><span className="font-semibold text-li-carbon">Why it matters: </span>{item.business_impact}</p>}
                    {item.verification_test && <p className="mt-1 text-xs text-li-slate"><span className="font-semibold text-li-carbon">Success check: </span>{item.verification_test}</p>}
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-xs text-li-slate"><span className="font-semibold text-li-carbon">Evidence: </span>{item.summary || "No evidence recorded."}</p>
                    <p className="mt-1 text-xs text-li-slate"><span className="font-semibold text-li-carbon">Category: </span>{item.category}{item.city ? ` · ${item.city}` : ""}</p>
                    <p className="mt-1 text-xs text-li-slate"><span className="font-semibold text-li-carbon">Expected effect: </span>{item.expected_effect || "Not stated."}</p>
                  </>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => decide(item, "approved")}
                    disabled={busy === item.id}
                    className="inline-flex items-center gap-1 rounded-lg bg-li-forest px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    {busy === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Approve
                  </button>
                  <button
                    onClick={() => decide(item, "declined")}
                    disabled={busy === item.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-li-steel px-3 py-1.5 text-xs font-semibold text-li-carbon disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" /> Decline
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}