import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Upload, FileCheck2, Scale, CheckCircle2 } from "lucide-react";

// Contractor chain-of-custody recorder: after completing a job, the contractor
// documents what was collected, the weight and where it went, and uploads the
// facility receipt from their phone (stored privately). Records start as
// 'reported' until a Same Day Recycling admin verifies them.
export default function CustodyRecorder({ history, onChanged }) {
  const jobs = (history || []).filter((h) => h.reference_code || h.id);
  const [jobId, setJobId] = useState("");
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [form, setForm] = useState({
    donated: 0, recycled: 0, ewaste: 0, disposed: 0,
    estimated_weight_kg: 0, weight_source: "not_measured",
    destination_facility: "", disposal_receipt_uri: "", notes: "",
  });

  const load = async (id) => {
    setExisting(null);
    setMsg("");
    if (!id) return;
    setLoading(true);
    setForm({ donated: 0, recycled: 0, ewaste: 0, disposed: 0, estimated_weight_kg: 0, weight_source: "not_measured", destination_facility: "", disposal_receipt_uri: "", notes: "" });
    try {
      const res = await base44.functions.invoke("partnerPortal", { action: "custody_get", booking_id: id });
      const c = res.data.custody;
      setExisting(c);
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
        });
      }
    } catch {
      setMsg("Could not load this job's custody record.");
    }
    setLoading(false);
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const uploadReceipt = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSaving(true);
    try {
      const up = await base44.integrations.Core.UploadPrivateFile({ file });
      set("disposal_receipt_uri", up.file_uri);
      setMsg("Receipt attached. Press Submit to file it.");
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
      await base44.functions.invoke("partnerPortal", {
        action: "custody_save",
        booking_id: jobId,
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
      });
      setMsg("Submitted. The customer's recycling report will use these verified records once an admin confirms them.");
      await load(jobId);
      onChanged?.();
    } catch (e) {
      setMsg(e?.response?.data?.error || "Submit failed.");
    }
    setSaving(false);
  };

  const num = (k, label) => (
    <label className="block">
      <span className="text-xs font-bold text-emerald-100/80">{label}</span>
      <input type="number" min="0" value={form[k]} onChange={(e) => set(k, Number(e.target.value) || 0)} className="w-full rounded-xl border border-[#187B65]/30 bg-[#051511] px-3 py-2 mt-1 text-emerald-50 tabular-nums" />
    </label>
  );

  return (
    <div className={`${"relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm"} p-5 md:p-6 mb-10`}>
      <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2"><Scale className="w-5 h-5 text-[#187B65]" /> Recycling chain of custody</h2>
      <p className="text-sm text-emerald-100/60 mt-1">Document where each completed load went. Only verified records appear in customer reports — nothing is estimated.</p>

      <label className="block mt-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90">Completed job</span>
        <select value={jobId} onChange={(e) => load(e.target.value)} className="w-full rounded-xl border border-[#187B65]/30 bg-[#051511] px-3 py-2.5 mt-1 text-emerald-50 text-sm">
          <option value="">Select a job…</option>
          {jobs.map((j) => <option key={j.id} value={j.id}>{j.reference_code || j.id} · {j.name} — {j.city || "—"}</option>)}
        </select>
      </label>

      {jobId && loading && <div className="flex items-center gap-2 mt-4 text-sm text-emerald-100/60"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Loading…</div>}

      {jobId && !loading && (
        <div className="mt-4 space-y-3">
          {existing && (
            <p className="flex items-center gap-2 text-xs font-bold text-[#187B65]"><CheckCircle2 className="w-4 h-4" /> A custody record exists for this job ({existing.documentation_status}) — your save updates it.</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {num("donated", "Donated")}
            {num("recycled", "Recycled")}
            {num("ewaste", "E-waste")}
            {num("disposed", "Disposed")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {num("estimated_weight_kg", "Load weight (kg)")}
            <label className="block">
              <span className="text-xs font-bold text-emerald-100/80">Weight source</span>
              <select value={form.weight_source} onChange={(e) => set("weight_source", e.target.value)} className="w-full rounded-xl border border-[#187B65]/30 bg-[#051511] px-3 py-2 mt-1 text-emerald-50">
                <option value="not_measured">Not measured</option>
                <option value="estimated">Estimated</option>
                <option value="measured">Weigh-scale measured</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-emerald-100/80">Destination facility</span>
            <input value={form.destination_facility} onChange={(e) => set("destination_facility", e.target.value)} placeholder="Facility name exactly as on the receipt" className="w-full rounded-xl border border-[#187B65]/30 bg-[#051511] px-3 py-2 mt-1 text-emerald-50" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-emerald-100/80">Facility receipt (photo or PDF)</span>
            <input type="file" accept="image/*,application/pdf" onChange={uploadReceipt} className="w-full rounded-xl border border-[#187B65]/30 bg-[#051511] px-3 py-2 mt-1 text-emerald-100/70 text-xs" />
            {form.disposal_receipt_uri && <span className="mt-1 flex items-center gap-1.5 text-[11px] font-bold text-[#187B65]"><FileCheck2 className="w-3.5 h-3.5" /> Receipt attached (stored privately)</span>}
          </label>
          <label className="block">
            <span className="text-xs font-bold text-emerald-100/80">Notes</span>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className="w-full rounded-xl border border-[#187B65]/30 bg-[#051511] px-3 py-2 mt-1 text-emerald-50" />
          </label>
          <button onClick={save} disabled={saving} className="rounded-full bg-[#187B65] text-[#032015] font-bold px-5 py-2.5 text-sm hover:bg-[#1FA184] transition-colors disabled:opacity-60 flex items-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Submit custody record
          </button>
          {msg && <p className="text-xs text-emerald-100/70">{msg}</p>}
        </div>
      )}
    </div>
  );
}