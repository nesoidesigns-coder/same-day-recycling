import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Camera, Upload, Loader2, AlertTriangle, CheckCircle2, Plus, FileText } from "lucide-react";
import { CATEGORIES } from "./financeShared";

const inputCls = "w-full rounded-xl bg-black/30 border border-[#187B65]/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-[#54D9AE] focus:outline-none";
const labelCls = "text-[11px] uppercase tracking-wider font-semibold text-white/50";

export default function ReceiptInbox({ tenant, onSaved }) {
  const [mode, setMode] = useState("upload");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [proposal, setProposal] = useState(null); // { fields, confidence, issues, duplicate_of, file_uri, file_name }

  const reset = () => { setProposal(null); setError(""); };

  const handleFiles = async (e) => {
    const file = (e.target.files || [])[0];
    if (e.target) e.target.value = "";
    if (!file) return;
    setBusy(true); setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file }); // stored privately
      const { data } = await base44.functions.invoke("financeIngest", { action: "extract", file_uri });
      setProposal({ ...data, file_uri, file_name: file.name });
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not read the receipt.");
    }
    setBusy(false);
  };

  const setField = (k, v) => setProposal((p) => ({ ...p, fields: { ...p.fields, [k]: v } }));

  const saveProposal = async () => {
    setBusy(true); setError("");
    try {
      const f = proposal.fields;
      await base44.functions.invoke("financeIngest", {
        action: "save",
        issues: proposal.issues,
        data: {
          ...f,
          receipt_uri: proposal.file_uri,
          receipt_name: proposal.file_name,
          extracted_json: proposal.proposal,
          classification_confidence: proposal.confidence,
          needs_review: (proposal.issues || []).length > 0 || proposal.duplicate_of ? true : f.needs_review,
          duplicate_of: proposal.duplicate_of || "",
        },
      });
      reset();
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not save the transaction.");
    }
    setBusy(false);
  };

  const saveManual = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setBusy(true); setError("");
    try {
      await base44.functions.invoke("financeIngest", {
        action: "save",
        data: {
          kind: fd.get("kind"), category: fd.get("category"), merchant: fd.get("merchant"),
          amount: Number(fd.get("amount")), tx_date: fd.get("tx_date"),
          description: fd.get("description"), payment_method: fd.get("payment_method"),
        },
      });
      e.target.reset();
      onSaved();
    } catch (err) {
      setError(err?.response?.data?.error || err.message || "Could not save the transaction.");
    }
    setBusy(false);
  };

  return (
    <div className="holo-panel holo-panel-deep rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Receipt &amp; transaction inbox</h3>
        <div className="flex gap-2">
          <button onClick={() => { setMode("upload"); reset(); }} className={"rounded-full px-3 py-1.5 text-xs font-bold " + (mode === "upload" ? "bg-[#187B65] text-white" : "border border-[#187B65]/40 text-white/70")}>Scan receipt</button>
          <button onClick={() => { setMode("manual"); reset(); }} className={"rounded-full px-3 py-1.5 text-xs font-bold " + (mode === "manual" ? "bg-[#187B65] text-white" : "border border-[#187B65]/40 text-white/70")}>Manual entry</button>
        </div>
      </div>

      {error && <div className="mt-3 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}

      {mode === "upload" && !proposal && (
        <div className="mt-4">
          <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#187B65]/40 bg-black/20 px-4 py-8 cursor-pointer hover:border-[#54D9AE] transition-colors">
            {busy ? <Loader2 className="w-6 h-6 animate-spin text-[#54D9AE]" /> : (
              <>
                <Camera className="w-6 h-6 text-[#54D9AE]" />
                <span className="text-sm font-bold text-white">Snap or upload a receipt</span>
                <span className="text-[11px] text-white/50 text-center">Camera, photo, or PDF. Rex extracts merchant, date, taxes and category — you confirm before anything is saved.</span>
              </>
            )}
            <input type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={handleFiles} disabled={busy} />
          </label>
          {busy && <p className="mt-2 text-center text-xs text-white/50">Reading the receipt…</p>}
        </div>
      )}

      {mode === "upload" && proposal && (
        <div className="mt-4 space-y-3">
          {proposal.issues?.length > 0 && (
            <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <div className="flex items-center gap-1.5 font-bold"><AlertTriangle className="w-3.5 h-3.5" /> Needs your review</div>
              <ul className="mt-1 list-disc list-inside space-y-0.5">{proposal.issues.map((i) => <li key={i}>{i}</li>)}</ul>
            </div>
          )}
          {proposal.issues?.length === 0 && !proposal.duplicate_of && (
            <div className="flex items-center gap-1.5 text-xs text-[#54D9AE]"><CheckCircle2 className="w-3.5 h-3.5" /> Extracted cleanly — confidence {Math.round((proposal.confidence || 0) * 100)}%.</div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div><label className={labelCls}>Kind</label>
              <select value={proposal.fields.kind} onChange={(e) => setField("kind", e.target.value)} className={inputCls}>
                <option value="expense">Expense</option><option value="income">Income</option>
              </select>
            </div>
            <div><label className={labelCls}>Category</label>
              <select value={proposal.fields.category} onChange={(e) => setField("category", e.target.value)} className={inputCls}>
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Merchant / payer</label><input value={proposal.fields.merchant || ""} onChange={(e) => setField("merchant", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Date</label><input type="date" value={proposal.fields.tx_date || ""} onChange={(e) => setField("tx_date", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Total</label><input type="number" step="0.01" value={proposal.fields.total ?? ""} onChange={(e) => setField("total", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Subtotal</label><input type="number" step="0.01" value={proposal.fields.subtotal_amount ?? ""} onChange={(e) => setField("subtotal_amount", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>GST</label><input type="number" step="0.01" value={proposal.fields.tax_detail?.gst ?? ""} onChange={(e) => setField("tax_detail", { ...(proposal.fields.tax_detail || {}), gst: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>PST / QST</label><input type="number" step="0.01" value={proposal.fields.tax_detail?.pst || proposal.fields.tax_detail?.qst || ""} onChange={(e) => setField("tax_detail", { ...(proposal.fields.tax_detail || {}), pst: e.target.value })} className={inputCls} /></div>
            <div className="col-span-2"><label className={labelCls}>Description</label><input value={proposal.fields.description || ""} onChange={(e) => setField("description", e.target.value)} className={inputCls} /></div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={saveProposal} disabled={busy} className="flex-1 rounded-full bg-[#187B65] text-white font-bold px-4 py-2.5 text-sm disabled:opacity-50">{busy ? "Saving…" : "Confirm & save"}</button>
            <button onClick={reset} className="rounded-full border border-white/20 text-white/70 font-bold px-4 py-2.5 text-sm">Discard</button>
          </div>
        </div>
      )}

      {mode === "manual" && (
        <form onSubmit={saveManual} className="mt-4 grid grid-cols-2 gap-2">
          <div><label className={labelCls}>Kind</label>
            <select name="kind" className={inputCls}><option value="expense">Expense</option><option value="income">Income</option></select>
          </div>
          <div><label className={labelCls}>Category</label>
            <select name="category" className={inputCls}>{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select>
          </div>
          <div><label className={labelCls}>Merchant / payer</label><input name="merchant" className={inputCls} required /></div>
          <div><label className={labelCls}>Date</label><input name="tx_date" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} className={inputCls} /></div>
          <div><label className={labelCls}>Total ($)</label><input name="amount" type="number" step="0.01" required className={inputCls} /></div>
          <div><label className={labelCls}>Payment method</label><input name="payment_method" placeholder="Cash, card, e-transfer…" className={inputCls} /></div>
          <div className="col-span-2"><label className={labelCls}>Description</label><input name="description" className={inputCls} /></div>
          <button type="submit" disabled={busy} className="col-span-2 flex items-center justify-center gap-2 rounded-full bg-[#187B65] text-white font-bold px-4 py-2.5 text-sm disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Add transaction</>}
          </button>
        </form>
      )}
    </div>
  );
}