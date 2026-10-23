import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ShieldCheck, FileUp, AlertTriangle, CheckCircle2, Save } from "lucide-react";

const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

// Contractor self-serve compliance: CRA business number, GST/HST registration,
// liability-insurance certificate (COI, stored privately) with expiry, and
// provincial credentials. Expiry status is derived from the recorded date.
export default function ComplianceCard() {
  const [compliance, setCompliance] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.functions.invoke("partnerPortal", { action: "compliance_get" })
      .then((r) => setCompliance(r.data?.compliance || {}))
      .catch(() => setCompliance(null));
  }, []);

  if (!compliance) {
    return <div className={`${panel} p-8 mb-10 text-center`}><Loader2 className="w-6 h-6 text-[#187B65] animate-spin mx-auto" /></div>;
  }

  const set = (k, v) => setCompliance((c) => ({ ...c, [k]: v }));

  const expiryState = (() => {
    if (!compliance.coi_expiry) return { tone: "warn", text: "No insurance certificate on file" };
    const days = Math.round((new Date(compliance.coi_expiry) - new Date()) / 86400000);
    if (days < 0) return { tone: "expired", text: `Insurance expired ${compliance.coi_expiry}` };
    if (days < 30) return { tone: "warn", text: `Insurance expires in ${days} days` };
    return { tone: "ok", text: `Insurance valid until ${compliance.coi_expiry}` };
  })();

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      set("coi_uri", file_uri);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("partnerPortal", { action: "compliance_save", ...compliance });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  const expiryTone = expiryState.tone === "ok"
    ? "text-[#187B65] border-[#187B65]/40 bg-[#187B65]/10"
    : "text-amber-300 border-amber-400/40 bg-amber-400/10";

  return (
    <div className={`${panel} p-5 md:p-6 mb-10`}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-[#187B65]" /> Compliance &amp; insurance
        </h2>
        <span className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${expiryTone}`}>
          {expiryState.text}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className={`${label} block mb-1.5`}>CRA business number</span>
          <input
            value={compliance.business_number || ""}
            onChange={(e) => set("business_number", e.target.value)}
            placeholder="e.g. 123456789 RT0001"
            className="w-full rounded-xl border border-[#187B65]/25 bg-white/95 px-3 py-2.5 text-sm text-[#102B2A] focus:border-[#187B65] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className={`${label} block mb-1.5`}>Sales tax registration</span>
          <select
            value={compliance.tax_registered || "unknown"}
            onChange={(e) => set("tax_registered", e.target.value)}
            className="w-full rounded-xl border border-[#187B65]/25 bg-white/95 px-3 py-2.5 text-sm text-[#102B2A] focus:border-[#187B65] focus:outline-none"
          >
            <option value="unknown">Not confirmed yet</option>
            <option value="gst_registered">GST/HST registered</option>
            <option value="not_registered">Not registered (small supplier)</option>
          </select>
        </label>
        <label className="block">
          <span className={`${label} block mb-1.5`}>Liability insurance expiry</span>
          <input
            type="date"
            value={compliance.coi_expiry || ""}
            onChange={(e) => set("coi_expiry", e.target.value)}
            className="w-full rounded-xl border border-[#187B65]/25 bg-white/95 px-3 py-2.5 text-sm text-[#102B2A] focus:border-[#187B65] focus:outline-none"
          />
        </label>
        <label className="block">
          <span className={`${label} block mb-1.5`}>Credentials (WCB, disposal accounts…)</span>
          <input
            value={compliance.credentials || ""}
            onChange={(e) => set("credentials", e.target.value)}
            placeholder="One per line is fine"
            className="w-full rounded-xl border border-[#187B65]/25 bg-white/95 px-3 py-2.5 text-sm text-[#102B2A] focus:border-[#187B65] focus:outline-none"
          />
        </label>
      </div>

      <div className="mt-3 rounded-xl border border-[#187B65]/25 bg-[#0a2b1e]/50 px-3 py-3 flex flex-wrap items-center gap-3">
        <FileUp className="w-4 h-4 text-[#187B65]" />
        <span className="text-xs text-emerald-100/70 flex-1">
          {compliance.coi_uri
            ? "Insurance certificate on file (stored privately — only you and the network admin can open it)."
            : "Upload your liability insurance certificate (PDF or image, stored privately)."}
        </span>
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.webp"
          onChange={(e) => upload(e.target.files?.[0])}
          className="text-xs text-emerald-100/70 file:mr-2 file:rounded-full file:border-0 file:bg-[#187B65] file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-[#032015]"
        />
        {uploading && <Loader2 className="w-4 h-4 text-[#187B65] animate-spin" />}
      </div>

      <div className="mt-4 flex items-center gap-3">
        <button onClick={save} disabled={saving || uploading} className="rounded-full bg-[#187B65] text-[#032015] font-bold px-5 py-2.5 text-sm hover:bg-[#1FA184] transition-colors disabled:opacity-60 flex items-center gap-2">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
        </button>
        {saved && <span className="text-[11px] text-[#187B65] inline-flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Saved.</span>}
      </div>
      {expiryState.tone !== "ok" && (
        <p className="mt-3 text-[11px] text-amber-300 flex items-start gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          Keep your insurance current — dispatch checks certificates before assigning jobs.
        </p>
      )}
    </div>
  );
}