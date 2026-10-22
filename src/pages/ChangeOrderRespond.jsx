import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, FileSignature, Recycle } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

// Public customer-facing approval screen for a change order, opened from the
// emailed secure link (?token=...). The token is the only credential.
export default function ChangeOrderRespond() {
  const [state, setState] = useState("loading"); // loading | ready | decided | error
  const [co, setCo] = useState(null);
  const [decision, setDecision] = useState("");
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const token = new URLSearchParams(window.location.search).get("token") || "";

  useEffect(() => {
    if (!token) { setError("This approval link is missing its token. Please use the link from your email."); setState("error"); return; }
    (async () => {
      try {
        const res = await base44.functions.invoke("changeOrder", { action: "view", token });
        setCo(res.data.change_order);
        setState("ready");
      } catch (err) {
        setError(err?.response?.data?.error || "We couldn't find this change order. Please call (604) 849-1745.");
        setState("error");
      }
    })();
  }, [token]);

  const respond = async (choice) => {
    setWorking(true);
    setError("");
    try {
      await base44.functions.invoke("changeOrder", { action: "respond", token, decision: choice, method: "secure_link" });
      setDecision(choice);
      setState("decided");
    } catch (err) {
      setError(err?.response?.data?.error || "Something went wrong. Please call (604) 849-1745.");
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8f7] flex flex-col">
      <header className="bg-[#102B2A] text-white">
        <div className="max-w-xl mx-auto px-4 py-6 flex items-center gap-3">
          <span className="w-10 h-10 rounded-xl bg-[#187B65]/20 flex items-center justify-center">
            <Recycle className="w-6 h-6 text-[#187B65]" />
          </span>
          <div>
            <div className="font-bold leading-tight">Same Day Recycling</div>
            <div className="text-xs text-slate-300">Change order approval</div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-xl w-full mx-auto px-4 py-10">
        {state === "loading" && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#187B65] animate-spin" />
          </div>
        )}

        {state === "error" && (
          <div className="rounded-3xl bg-white p-8 border border-slate-100 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h1 className="text-xl font-bold text-[#102B2A]">Link problem</h1>
            <p className="mt-2 text-slate-600 text-sm">{error}</p>
          </div>
        )}

        {state === "decided" && (
          <div className="rounded-3xl bg-white p-8 border border-slate-100 text-center">
            {decision === "approved" ? (
              <CheckCircle2 className="w-12 h-12 text-[#187B65] mx-auto mb-3" />
            ) : (
              <XCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            )}
            <h1 className="text-xl font-bold text-[#102B2A]">
              {decision === "approved" ? "Change order approved" : "Change order declined"}
            </h1>
            <p className="mt-2 text-slate-600 text-sm">
              {decision === "approved"
                ? "Thank you — the added items are now authorized and your job total has been updated. Your original approved price was never changed."
                : "No problem — the additional work will not be carried out or charged. Your original approved scope and price stand unchanged."}
            </p>
            <p className="mt-4 text-xs text-slate-400">Questions? Call (604) 849-1745.</p>
          </div>
        )}

        {state === "ready" && co && (
          <div className="rounded-3xl bg-white p-6 md:p-8 border border-slate-100">
            <div className="flex items-center gap-3 mb-5">
              <span className="w-10 h-10 rounded-xl bg-[#187B65]/10 flex items-center justify-center">
                <FileSignature className="w-5 h-5 text-[#187B65]" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-[#102B2A]">Change order #{co.number}</h1>
                {co.job_ref && <div className="text-xs text-slate-400 font-mono">Job {co.job_ref}</div>}
              </div>
              <span className={`ml-auto rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${
                co.status === "pending_approval" ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-500"
              }`}>
                {co.status.replace("_", " ")}
              </span>
            </div>

            {co.status !== "pending_approval" ? (
              <p className="text-slate-600 text-sm">This change order was already {co.status.replace("_", " ")} — no further action is needed.</p>
            ) : (
              <>
                <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-5">
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65] mb-2">Additional items requested</div>
                  <p className="text-sm font-semibold text-[#102B2A]">{co.items}</p>
                  {co.description && <p className="text-sm text-slate-500 mt-1">{co.description}</p>}
                  <div className="mt-4 pt-3 border-t border-slate-200 space-y-1.5 text-sm">
                    <div className="flex justify-between"><span className="text-slate-500">Additional charge</span><span className="font-semibold text-[#102B2A]">{money(co.amount_delta)}</span></div>
                    {Number(co.tax_amount) > 0 && (
                      <div className="flex justify-between"><span className="text-slate-500">Applicable taxes</span><span className="font-semibold text-[#102B2A]">{money(co.tax_amount)}</span></div>
                    )}
                    <div className="flex justify-between border-t border-slate-200 pt-1.5"><span className="font-bold text-[#102B2A]">Job total if approved</span><span className="font-bold text-[#102B2A]">{money(co.revised_total)}</span></div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-[#187B65]/5 border border-[#187B65]/20 px-4 py-3 text-xs text-slate-600">
                  Your original approved price is unchanged. Only approved additions are carried out and charged.
                  Properly completed and authorized services are generally final; billing errors, incomplete work or damage remain subject to review. See our <Link to="/terms" className="font-semibold text-[#187B65]">terms</Link>.
                </div>

                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

                <div className="mt-5 flex gap-3">
                  <button
                    onClick={() => respond("approved")}
                    disabled={working}
                    className="flex-1 rounded-full bg-[#187B65] text-white font-bold px-5 py-3.5 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Approve
                  </button>
                  <button
                    onClick={() => respond("declined")}
                    disabled={working}
                    className="flex-1 rounded-full border border-slate-200 text-slate-600 font-bold px-5 py-3.5 text-sm hover:border-red-300 hover:text-red-600 transition-colors disabled:opacity-60"
                  >
                    Decline
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}