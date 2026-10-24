import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, AlertTriangle, ReceiptText, CheckCircle2, RefreshCw, X } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");

// Contractor-side financial records: per-job economics on THEIR jobs only,
// expense entry, and private document uploads (disposal receipts, weighbridge
// tickets, labour expenses) connected to individual jobs.
export default function EarningsRecords() {
  const [data, setData] = useState(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState("");
  const [edit, setEdit] = useState(null);
  const [exp, setExp] = useState({ disposal: "", labour: "", fuel: "", other: "" });
  const [upload, setUpload] = useState(null); // {booking_id, kind, label, amount, file}

  const load = useCallback(async () => {
    try {
      const r = await base44.functions.invoke("jobFinancials", { action: "partner_data" });
      setData(r.data);
      setErr("");
    } catch (e) {
      setErr(e?.message || "Could not load your financial records.");
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const saveExpenses = async (bookingId) => {
    setBusy(bookingId);
    try {
      await base44.functions.invoke("jobFinancials", {
        action: "save_expenses", booking_id: bookingId,
        expenses: { disposal: Number(exp.disposal) || 0, labour: Number(exp.labour) || 0, fuel: Number(exp.fuel) || 0, other: Number(exp.other) || 0 },
      });
      setEdit(null);
      await load();
    } catch (e) {
      setErr(e?.message || "Could not save expenses.");
    } finally {
      setBusy("");
    }
  };

  const attach = async () => {
    setBusy(upload.booking_id);
    try {
      let file_uri = "";
      if (upload.file) {
        const up = await base44.integrations.Core.UploadPrivateFile({ file: upload.file });
        file_uri = up.file_uri;
      }
      await base44.functions.invoke("jobFinancials", {
        action: "receipts_add", booking_id: upload.booking_id,
        kind: upload.kind, label: upload.label || upload.kind, amount: Number(upload.amount) || 0, file_uri,
      });
      setUpload(null);
      await load();
    } catch (e) {
      setErr(e?.message || "Could not attach the document.");
    } finally {
      setBusy("");
    }
  };

  const s = data?.summary;
  const panel = "rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";

  return (
    <section className="mb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Your financial records</h2>
          <p className="text-xs text-emerald-100/50 mt-0.5">Earnings per completed job, your expenses, and supporting documents. Only you can see these.</p>
        </div>
        <button onClick={load} className="p-2 rounded-full border border-[#187B65]/40 text-[#187B65] hover:bg-[#187B65]/10" aria-label="Refresh"><RefreshCw className="w-4 h-4" /></button>
      </div>

      {err && <div className={`${panel} border-red-400/40 px-4 py-3 text-sm text-red-300 mb-4`}>{err}</div>}
      {!data && !err && <div className={`${panel} p-10 text-center`}><Loader2 className="w-6 h-6 animate-spin text-[#187B65] mx-auto" /></div>}

      {s && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            {[["Completed jobs", String(s.completed_jobs)], ["Payouts earned", money(s.payout_earned)], ["Contribution earned", money(s.contribution_earned)], ["Contribution margin", `${s.margin_pct}%`], ["Jobs missing expenses", String(s.missing_expense_jobs)]].map(([l, v]) => (
              <div key={l} className={`${panel} px-4 py-3`}>
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65]/90">{l}</div>
                <div className="text-lg font-bold text-white mt-1 tabular-nums">{v}</div>
              </div>
            ))}
          </div>

          {s.missing_expense_jobs > 0 && (
            <div className="rounded-2xl border border-amber-400/40 bg-amber-400/10 px-4 py-3 text-xs text-amber-200 mb-5 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> Some jobs have no expense records yet — their contribution shown below is NOT verified profit until you record real disposal, labour and fuel costs.
            </div>
          )}

          <div className="space-y-4">
            {data.jobs.length === 0 && <div className={`${panel} p-8 text-center text-emerald-100/50 text-sm`}>No completed jobs with financial records yet.</div>}
            {data.jobs.map((j) => {
              const f = j.financial;
              if (!f) return null;
              const expTotal = (Number(f.expenses_disposal) || 0) + (Number(f.expenses_labour) || 0) + (Number(f.expenses_fuel) || 0) + (Number(f.expenses_other) || 0);
              return (
                <div key={j.booking_id} className={`${panel} p-5`}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-bold text-white text-sm">{j.name} — {j.city || "—"}</div>
                      <div className="text-[11px] text-emerald-100/40 mt-0.5">{(j.items || "").slice(0, 80)} · {j.payout_paid ? "payout paid" : "payout pending"}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65]/90">Your contribution</div>
                      <div className={`text-xl font-bold tabular-nums ${f.expenses_verified ? "text-[#187B65] holo-glow-text" : "text-amber-300"}`}>{money(f.contractor_profit)}</div>
                      <div className="text-[10px] text-emerald-100/40 tabular-nums">{f.contribution_margin_pct}% of {money(f.final_customer_price)}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                    <div className="rounded-xl bg-[#0a2b1e]/50 px-3 py-2"><div className="text-emerald-100/40">Customer paid</div><div className="text-white font-bold tabular-nums">{money(f.final_customer_price)}</div></div>
                    <div className="rounded-xl bg-[#0a2b1e]/50 px-3 py-2"><div className="text-emerald-100/40">Platform commission ({f.commission_rate}%)</div><div className="text-white font-bold tabular-nums">{money(f.commission_earned)}</div></div>
                    <div className="rounded-xl bg-[#0a2b1e]/50 px-3 py-2"><div className="text-emerald-100/40">Your payout</div><div className="text-[#187B65] font-bold tabular-nums">{money(f.contractor_payout)}</div></div>
                    <div className="rounded-xl bg-[#0a2b1e]/50 px-3 py-2"><div className="text-emerald-100/40">Your expenses</div><div className="text-white font-bold tabular-nums">{money(expTotal)}</div></div>
                  </div>
                  {f.additional_revenue !== 0 && <div className="mt-2 text-[11px] text-emerald-100/60">Customer additions on this job: <strong className="text-[#187B65]">{money(f.additional_revenue)}</strong></div>}
                  {(f.missing_expense_kinds || []).length > 0 && <div className="mt-2 text-[11px] text-amber-300">Missing expense records: {f.missing_expense_kinds.join(", ")}</div>}

                  {(f.expense_receipts || []).length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {f.expense_receipts.map((r) => (
                        <span key={r.id} className="rounded-full bg-[#187B65]/10 border border-[#187B65]/30 text-[#187B65] px-2.5 py-0.5 text-[10px] font-bold">{r.kind}: {r.label}{r.amount ? ` · ${money(r.amount)}` : ""}</span>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button onClick={() => { setEdit(edit === j.booking_id ? null : j.booking_id); setExp({ disposal: f.expenses_disposal || "", labour: f.expenses_labour || "", fuel: f.expenses_fuel || "", other: f.expenses_other || "" }); }} className="rounded-full border border-[#187B65]/50 bg-[#187B65]/10 text-[#187B65] font-bold px-4 py-2 text-xs hover:bg-[#187B65]/20">Record expenses</button>
                    <button onClick={() => setUpload({ booking_id: j.booking_id, kind: "disposal", label: "", amount: "", file: null })} className="rounded-full border border-[#187B65]/40 text-emerald-100/80 font-bold px-4 py-2 text-xs hover:border-[#187B65] inline-flex items-center gap-1.5"><Upload className="w-3.5 h-3.5" /> Attach document</button>
                  </div>

                  {edit === j.booking_id && (
                    <div className="mt-3 rounded-xl border border-[#187B65]/30 bg-[#0a2b1e]/60 p-3">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[["disposal", "Disposal"], ["labour", "Labour"], ["fuel", "Fuel"], ["other", "Other"]].map(([k, lbl]) => (
                          <label key={k} className="text-[10px] font-bold uppercase tracking-wider text-[#187B65]">
                            {lbl}
                            <input type="number" min="0" step="0.01" value={exp[k]} onChange={(e) => setExp({ ...exp, [k]: e.target.value })} className="mt-1 w-full rounded-lg border border-[#187B65]/30 bg-[#051511] px-2 py-2 text-sm text-white" />
                          </label>
                        ))}
                      </div>
                      <button onClick={() => saveExpenses(j.booking_id)} disabled={busy === j.booking_id} className="mt-2 rounded-full bg-[#187B65] text-[#032015] font-bold px-4 py-2 text-xs disabled:opacity-60 inline-flex items-center gap-1.5">
                        {busy === j.booking_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />} Save
                      </button>
                    </div>
                  )}

                  {upload?.booking_id === j.booking_id && (
                    <div className="mt-3 rounded-xl border border-[#187B65]/30 bg-[#0a2b1e]/60 p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#187B65]">Attach supporting document</span>
                        <button onClick={() => setUpload(null)} className="text-emerald-100/50 hover:text-white" aria-label="Cancel"><X className="w-4 h-4" /></button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <select value={upload.kind} onChange={(e) => setUpload({ ...upload, kind: e.target.value })} className="rounded-lg border border-[#187B65]/30 bg-[#051511] px-2 py-2 text-xs text-white">
                          <option value="disposal">Disposal receipt</option>
                          <option value="weighbridge">Weighbridge ticket</option>
                          <option value="labour">Labour expense</option>
                          <option value="fuel">Fuel receipt</option>
                          <option value="other">Other</option>
                        </select>
                        <input placeholder="Label" value={upload.label} onChange={(e) => setUpload({ ...upload, label: e.target.value })} className="rounded-lg border border-[#187B65]/30 bg-[#051511] px-2 py-2 text-xs text-white" />
                        <input placeholder="Amount ($)" type="number" min="0" value={upload.amount} onChange={(e) => setUpload({ ...upload, amount: e.target.value })} className="rounded-lg border border-[#187B65]/30 bg-[#051511] px-2 py-2 text-xs text-white" />
                        <input type="file" onChange={(e) => setUpload({ ...upload, file: e.target.files?.[0] || null })} className="rounded-lg border border-[#187B65]/30 bg-[#051511] px-2 py-1.5 text-xs text-white file:mr-2 file:rounded-full file:border-0 file:bg-[#187B65]/20 file:text-[#187B65] file:px-3 file:py-1" />
                      </div>
                      <button onClick={attach} disabled={busy === j.booking_id} className="mt-2 rounded-full bg-[#187B65] text-[#032015] font-bold px-4 py-2 text-xs disabled:opacity-60 inline-flex items-center gap-1.5">
                        {busy === j.booking_id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Attach (stored privately)
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-[10px] text-emerald-100/30 flex items-center gap-1.5"><ReceiptText className="w-3 h-3" /> Processing fees shown on platform-paid jobs are estimates until reconciled. Contribution profit is verified only once real expenses are recorded.</p>
        </>
      )}
    </section>
  );
}