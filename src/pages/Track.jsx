import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import {
  Loader2, PackageSearch, Recycle, MapPin, CalendarClock, Truck,
  CircleDollarSign, FileText, CheckCircle2, XCircle, Scale,
} from "lucide-react";
import { labelFor, PAYMENT_LABELS } from "@/lib/opsShared";

// Customer tracking portal: enter the reference code from your confirmation
// to follow your pickup from request to receipt. The code is the only key —
// no account, no personal data beyond the job itself.
export default function Track() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  document.title = "Track Your Pickup | Same Day Recycling";

  const lookup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.functions.invoke("jobTracking", { action: "lookup", reference_code: code.trim() });
      setResult(res.data);
      if (!res.data.found) setError("No job found for that code. Check the code in your confirmation message.");
    } catch (err) {
      setError(err?.response?.data?.error || "Lookup failed. Please try again.");
    }
    setLoading(false);
  };

  const r = result?.request;
  const reached = (r?.timeline || []).filter((t) => !t.exception).reduce((m, t) => Math.max(m, t.step || 0), 0);
  const cancelled = r?.status === "cancelled" || (r?.timeline || []).some((t) => t.stage === "exception_cancelled");

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <header className="bg-white border-b border-slate-100">
        <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-[#102B2A]">
            <span className="w-9 h-9 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center"><Recycle className="w-5 h-5" /></span>
            Same Day Recycling
          </Link>
          <Link to="/contact" className="text-sm font-semibold text-slate-600 hover:text-[#187B65]">Contact support</Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <h1 className="text-3xl font-bold text-[#102B2A] tracking-tight">Track your pickup</h1>
        <p className="mt-2 text-slate-600 text-sm leading-relaxed">
          Enter the reference code from your confirmation message to see the live status of your job — from request to pickup, recycling documentation and receipt.
        </p>

        <form onSubmit={lookup} className="mt-6 flex flex-col sm:flex-row gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. 7XK2M9QA"
            maxLength={12}
            aria-label="Reference code"
            className="input flex-1 font-mono font-bold tracking-widest uppercase"
          />
          <button type="submit" disabled={loading || !code.trim()} className="rounded-full bg-[#187B65] px-6 py-3 text-sm font-bold text-white hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageSearch className="w-4 h-4" />}
            Track my job
          </button>
        </form>

        {error && !r && (
          <p className="mt-4 flex items-center gap-2 text-sm text-red-600" role="alert"><XCircle className="w-4 h-4" /> {error}</p>
        )}

        {r && r.found && (
          <div className="mt-8 space-y-5">
            {/* Status summary */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono font-bold text-[#102B2A] tracking-widest">{r.reference_code}</span>
                <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${cancelled ? "bg-red-100 text-red-700" : reached >= 12 ? "bg-[#187B65]/10 text-[#187B65]" : "bg-amber-100 text-amber-700"}`}>
                  {cancelled ? "Cancelled" : reached >= 12 ? "Completed" : "In progress"}
                </span>
              </div>
              <p className="mt-3 text-sm font-bold text-[#102B2A]">{r.items_description}</p>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600">
                {r.city && <p className="flex items-center gap-2"><MapPin className="w-4 h-4 text-[#187B65]" /> {r.city}</p>}
                {(r.preferred_date || r.appointment_date) && (
                  <p className="flex items-center gap-2"><CalendarClock className="w-4 h-4 text-[#187B65]" /> {r.appointment_date || r.preferred_date}{r.time_window ? ` · ${r.time_window}` : ""}</p>
                )}
                {r.partner_name && (
                  <p className="flex items-center gap-2"><Truck className="w-4 h-4 text-[#187B65]" /> {r.partner_name}{r.assignment_status ? ` · ${r.assignment_status.replace("_", " ")}` : ""}</p>
                )}
                <p className="flex items-center gap-2"><CircleDollarSign className="w-4 h-4 text-[#187B65]" />
                  {Number(r.approved_quote_amount) > 0 ? `Approved price: $${Number(r.approved_quote_amount).toFixed(2)}` : "Pricing to be confirmed"}
                </p>
                <p className="flex items-center gap-2"><FileText className="w-4 h-4 text-[#187B65]" /> {PAYMENT_LABELS[r.payment_status] || "Not yet paid"}</p>
              </div>
              {/* Lifecycle progress */}
              <div className="mt-5">
                <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500">
                  <span>Lifecycle</span><span>{cancelled ? "Stopped" : `Stage ${reached} of 13`}</span>
                </div>
                <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${cancelled ? "bg-red-400" : "bg-[#187B65]"}`} style={{ width: `${Math.round((reached / 13) * 100)}%` }} />
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A]">Job timeline</h2>
              <ol className="mt-4 space-y-4">
                {(r.timeline || []).map((t, i) => (
                  <li key={i} className="flex gap-3">
                    <span className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${t.exception ? "bg-red-100" : reached >= (t.step || 0) ? "bg-[#187B65]" : "bg-slate-200"}`}>
                      {t.exception ? <XCircle className="w-3.5 h-3.5 text-red-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#102B2A]">{t.label}</p>
                      {t.note && <p className="text-xs text-slate-600 mt-0.5 break-words">{t.note}</p>}
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {t.occurred_at ? new Date(t.occurred_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : ""}
                        {t.actor && t.actor !== "system" ? ` · by ${t.actor}` : ""}
                      </p>
                    </div>
                  </li>
                ))}
                {!(r.timeline || []).length && <li className="text-sm text-slate-500">Timeline will appear here as your job progresses.</li>}
              </ol>
            </div>

            {/* Recycling documentation */}
            {r.custody && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
                <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] flex items-center gap-2"><Scale className="w-4 h-4 text-[#187B65]" /> Where your items went</h2>
                <CustodySummary c={r.custody} />
                <p className="mt-3 text-[11px] text-slate-500">
                  {r.custody.documentation_status === "verified"
                    ? "Verified by a Same Day Recycling administrator against the contractor's facility receipt."
                    : "Reported by your pickup contractor and pending administrative verification."}
                </p>
              </div>
            )}

            {r.receipt_sent && (
              <p className="flex items-center gap-2 text-sm text-[#187B65] font-semibold"><CheckCircle2 className="w-4 h-4" /> Your receipt and recycling impact report have been issued.</p>
            )}
          </div>
        )}

        <p className="mt-10 text-xs text-slate-500 leading-relaxed">
          Only someone holding your reference code can view this page. Need help? <Link to="/contact" className="text-[#187B65] font-semibold hover:underline">Contact us</Link> with your code ready.
        </p>
      </main>
    </div>
  );
}

function CustodySummary({ c }) {
  const chips = Object.entries(c.material_categories || {}).filter(([, v]) => Array.isArray(v) && v.length > 0);
  return (
    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-slate-600">
      {chips.length > 0 && (
        <div className="sm:col-span-2 flex flex-wrap gap-1.5">
          {chips.map(([k, v]) => (
            <span key={k} className="rounded-full bg-[#f4f7f5] px-3 py-1 text-xs font-semibold text-[#187B65] capitalize">{k}: {v.length}</span>
          ))}
        </div>
      )}
      {Number(c.estimated_weight_kg) > 0 && (
        <p>Load weight: <span className="font-semibold">{c.estimated_weight_kg} kg</span> ({c.weight_source})</p>
      )}
      {c.destination_facility && <p>Facility: <span className="font-semibold">{c.destination_facility}</span></p>}
      <p>Items sorted: <span className="font-semibold">{c.diverted_groups}/{c.total_item_groups}</span>{Number(c.total_item_groups) > 0 ? ` · ${c.diversion_percent}% diverted` : ""}</p>
      <p>Pickup date: <span className="font-semibold">{c.pickup_date || "—"}</span></p>
    </div>
  );
}