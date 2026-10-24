import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2, AlertTriangle, FileText } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");

const STAGE_LABELS = {
  initial_quote: "During Rex's initial quotation",
  after_quote: "After the original quote",
  arrival: "During contractor arrival",
  loading: "During loading",
  before_completion: "Before final completion",
};

// One job's complete money story: customer payment → taxes → commission →
// payout → expenses → contractor and platform contribution, plus the auditable
// history and the admin expense editor.
export default function JobFinanceDrawer({ bookingId, onClose, onChanged }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [exp, setExp] = useState(null);

  const load = async () => {
    try {
      const res = await base44.functions.invoke("jobFinancials", { action: "detail", booking_id: bookingId });
      setData(res.data);
      const f = res.data.financial;
      setExp({
        disposal: f.expenses_disposal || "", labour: f.expenses_labour || "",
        fuel: f.expenses_fuel || "", other: f.expenses_other || "", platform: f.expenses_platform || "",
      });
    } catch (e) {
      setError(e?.message || "Could not load job financials.");
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [bookingId]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("jobFinancials", {
        action: "save_expenses", booking_id: bookingId,
        expenses: Object.fromEntries(Object.entries(exp).map(([k, v]) => [k, Number(v) || 0])),
      });
      await load();
      onChanged?.();
    } finally {
      setSaving(false);
    }
  };

  const f = data?.financial;
  const expTotal = f ? (Number(f.expenses_disposal) || 0) + (Number(f.expenses_labour) || 0) + (Number(f.expenses_fuel) || 0) + (Number(f.expenses_other) || 0) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#102B2A]/40 sm:p-4" onClick={onClose} role="dialog" aria-label="Job financials">
      <div className="w-full sm:max-w-2xl max-h-[88vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5 md:p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-[#102B2A]">{f?.job_name || "Job financials"}</h3>
            <p className="text-xs text-slate-500">{f?.city || "—"} · {f?.partner_name || "Unassigned"} · ref {f?.reference_code || "—"}</p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-[#102B2A]" aria-label="Close">✕</button>
        </div>
        {error && <div className="mt-4 rounded-xl bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}
        {!data && !error && <Loader2 className="w-6 h-6 animate-spin text-[#187B65] mx-auto my-10" />}
        {f && (
          <>
            <div className="mt-4 rounded-2xl bg-[#eef4f0] border border-[#187B65]/20 p-4 text-sm">
              <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-500 mb-2">Where the customer payment went</div>
              <Row label="Original quote" value={money(f.original_quote)} />
              <Row label="Customer-approved price (original scope)" value={money(f.approved_price)} />
              {f.additional_revenue !== 0 && <Row label="Approved customer additions" value={money(f.additional_revenue)} tone="text-[#187B65]" />}
              <Row label="Final customer price (before tax)" value={money(f.final_customer_price)} bold />
              <Row label={`Sales tax — ${f.tax_label || "n/a"} (recorded separately, not revenue)`} value={money(f.taxes_collected)} />
              <Row label={`Platform commission (${f.commission_rate}% · ${String(f.commission_basis).replace(/_/g, " ")})`} value={money(f.commission_earned)} />
              <Row label="Contractor payout" value={money(f.contractor_payout)} bold />
              <Row label="Direct expenses (disposal, labour, fuel, other)" value={`− ${money(expTotal)}`} />
              <Row label="Contractor contribution" value={money(f.contractor_profit)} bold tone="text-[#187B65]" />
              <Row label={`Processing fees (${f.payment_method === "platform" ? "platform payment" : f.payment_method === "external" ? "settled outside the platform" : "no payment yet"})`} value={money(f.processing_fees)} />
              <Row label="Platform contribution (commission net of fees)" value={money(f.platform_profit)} bold tone="text-[#187B65]" />
              <Row label="Contribution margin" value={`${f.contribution_margin_pct}%`} />
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className={`rounded-full px-2.5 py-1 ${f.payment_verified ? "bg-[#187B65]/10 text-[#187B65]" : "bg-amber-100 text-amber-800"}`}>{f.payment_verified ? "payment verified" : "payment unverified"}</span>
              <span className={`rounded-full px-2.5 py-1 ${f.expenses_verified ? "bg-[#187B65]/10 text-[#187B65]" : "bg-amber-100 text-amber-800"}`}>{f.expenses_verified ? "expenses verified" : "expenses not recorded"}</span>
              {(f.missing_expense_kinds || []).length > 0 && <span className="rounded-full px-2.5 py-1 bg-amber-100 text-amber-800">missing: {f.missing_expense_kinds.join(", ")}</span>}
            </div>

            {(data.change_orders || []).length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-bold text-[#102B2A]">Change orders on this job</h4>
                <div className="mt-2 space-y-1.5">
                  {data.change_orders.map((c) => (
                    <div key={c.id} className="rounded-xl border border-slate-100 px-3 py-2 text-xs">
                      <div className="flex justify-between gap-2">
                        <span className="font-bold text-[#102B2A]">#{c.number} · {c.items}</span>
                        <span className={`font-bold ${Number(c.amount_delta) >= 0 ? "text-[#187B65]" : "text-amber-600"}`}>{money(c.amount_delta)}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">{STAGE_LABELS[c.stage_at] || ""}{c.status} · approved {c.approval_method || "—"}{c.responded_date ? ` · ${c.responded_date}` : ""}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-4 rounded-2xl border border-slate-200 p-4">
              <h4 className="text-sm font-bold text-[#102B2A]">Record real expenses</h4>
              <p className="mt-0.5 text-[11px] text-slate-500">Contribution profit stays "unverified" until real expenses are recorded.</p>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[["disposal", "Disposal"], ["labour", "Labour"], ["fuel", "Fuel"], ["other", "Other"], ["platform", "Platform"]].map(([k, lbl]) => (
                  <label key={k} className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {lbl}
                    <input type="number" min="0" step="0.01" value={exp?.[k] ?? ""} onChange={(e) => setExp({ ...exp, [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-2 text-sm text-[#102B2A]" />
                  </label>
                ))}
              </div>
              <button onClick={save} disabled={saving} className="mt-3 rounded-full bg-[#187B65] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#125C4E] disabled:opacity-60 inline-flex items-center gap-2">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Save expenses & recalculate
              </button>
            </div>

            <div className="mt-4">
              <h4 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><FileText className="w-4 h-4 text-[#187B65]" /> Audit trail</h4>
              <div className="mt-2 space-y-1">
                {(f.audit || []).slice().reverse().map((a, i) => (
                  <div key={i} className="text-[11px] text-slate-600 flex gap-2">
                    <span className="text-slate-400 shrink-0">{(a.date || "").slice(0, 16).replace("T", " ")}</span>
                    <span><strong className="capitalize">{String(a.event).replace(/_/g, " ")}</strong>{a.note ? ` — ${a.note}` : ""}</span>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[10px] text-slate-400 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Every quote revision, approval, commission calculation and payout event is logged — records are never altered silently.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold, tone = "text-[#102B2A]" }) {
  return (
    <div className={`flex justify-between gap-3 py-1 ${bold ? "font-bold border-t border-[#187B65]/15 mt-1 pt-1.5" : ""}`}>
      <span className="text-slate-600">{label}</span>
      <span className={`tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}