import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, FileCheck2, ShieldCheck } from "lucide-react";

// Chain-of-custody form for one completed job (admin view). The contractor
// uploads the facility receipt from their phone; the admin verifies. All
// figures come from entered records — diversion is computed from entered
// group counts, never invented.
const WEIGHT_SOURCES = [
  { id: "not_measured", label: "Not measured" },
  { id: "estimated", label: "Estimated" },
  { id: "measured", label: "Weigh-scale measured" },
];

export default function CustodyPanel({ booking, onSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    donated: 0, recycled: 0, ewaste: 0, disposed: 0,
    estimated_weight_kg: 0, weight_source: "not_measured",
    destination_facility: "", disposal_receipt_uri: "", notes: "", verify: false,
  });

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("jobTracking", { action: "custody_get", booking_id: booking.id });
      const c = res.data.custody;
      if (c) {
        const cats = c.material_categories || {};
        setForm({
          donated: (cats.donated || []).length,
          recycled: (cats.recycled || []).length,
          ewaste: (cats.ewaste || []).length,
          disposed: (cats.disposed || []).length,
          estimated_weight_kg: c.estimated_weight_kg || 0,
          weight_source: c.weight_source || "not_measured",
          destination_facility: c.destination_facility || "",
          disposal_receipt_uri: c.disposal_receipt_uri || "",
          notes: c.notes || "",
          verify: c.documentation_status === "verified",
        });
      }
    } catch {
      setMsg("Could not load the existing custody record.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [booking.id]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const up = await base44.integrations.Core.UploadPrivateFile({ file });
      set("disposal_receipt_uri", up.file_uri);
      setMsg("Receipt attached. Press Save to file it with the record.");
    } catch {
      setMsg("Upload failed — try a smaller photo or PDF.");
    }
    setSaving(false);
  };

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      const total = Number(form.donated) + Number(form.recycled) + Number(form.ewaste) + Number(form.disposed);
      const diverted = Number(form.donated) + Number(form.recycled) + Number(form.ewaste);
      await base44.functions.invoke("jobTracking", {
        action: "custody_save",
        booking_id: booking.id,
        material_categories: {
          donated: Array.from({ length: Number(form.donated) }, (_, i) => `item-${i + 1}`),
          recycled: Array.from({ length: Number(form.recycled) }, (_, i) => `item-${i + 1}`),
          ewaste: Array.from({ length: Number(form.ewaste) }, (_, i) => `item-${i + 1}`),
          disposed: Array.from({ length: Number(form.disposed) }, (_, i) => `item-${i + 1}`),
        },
        total_item_groups: total,
        diverted_groups: diverted,
        estimated_weight_kg: Number(form.estimated_weight_kg),
        weight_source: form.weight_source,
        destination_facility: form.destination_facility,
        disposal_receipt_uri: form.disposal_receipt_uri,
        notes: form.notes,
        verify: form.verify,
      });
      setMsg("Custody record saved to the job's lifecycle timeline.");
      onSaved?.();
    } catch (e) {
      setMsg(e?.response?.data?.error || "Save failed.");
    }
    setSaving(false);
  };

  if (loading) return <div className="flex items-center gap-2 py-4 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Loading custody record…</div>;

  const num = (k, label) => (
    <label className="block">
      <span className="text-xs font-bold text-slate-600">{label}</span>
      <input type="number" min="0" value={form[k]} onChange={(e) => set(k, Number(e.target.value) || 0)} className="input py-2 mt-1" />
    </label>
  );

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h4 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#187B65]" /> Chain of custody</h4>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        {num("donated", "Donated items")}
        {num("recycled", "Recycled items")}
        {num("ewaste", "E-waste items")}
        {num("disposed", "Disposed items")}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {num("estimated_weight_kg", "Load weight (kg)")}
        <label className="block">
          <span className="text-xs font-bold text-slate-600">Weight source</span>
          <select value={form.weight_source} onChange={(e) => set("weight_source", e.target.value)} className="input py-2 mt-1">
            {WEIGHT_SOURCES.map((w) => <option key={w.id} value={w.id}>{w.label}</option>)}
          </select>
        </label>
      </div>
      <label className="block mt-2">
        <span className="text-xs font-bold text-slate-600">Destination facility (recycling, disposal or donation)</span>
        <input value={form.destination_facility} onChange={(e) => set("destination_facility", e.target.value)} className="input py-2 mt-1" placeholder="Facility name as on the receipt" />
      </label>
      <label className="block mt-2">
        <span className="text-xs font-bold text-slate-600">Facility receipt</span>
        <input type="file" accept="image/*,application/pdf" onChange={uploadReceipt} className="input py-2 mt-1 text-xs" />
        {form.disposal_receipt_uri && <span className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#187B65]"><FileCheck2 className="w-3.5 h-3.5" /> Receipt attached (stored privately)</span>}
      </label>
      <label className="block mt-2">
        <span className="text-xs font-bold text-slate-600">Notes</span>
        <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="input py-2 mt-1" />
      </label>
      <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-700">
        <input type="checkbox" checked={form.verify} onChange={() => set("verify", !form.verify)} className="accent-[#187B65] w-4 h-4" />
        Verify against the facility receipt (marks this record verified)
      </label>
      <button onClick={save} disabled={saving} className="mt-3 rounded-full bg-[#187B65] px-5 py-2 text-xs font-bold text-white hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center gap-2">
        {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Save custody record
      </button>
      {msg && <p className="mt-2 text-xs text-slate-600">{msg}</p>}
    </div>
  );
}