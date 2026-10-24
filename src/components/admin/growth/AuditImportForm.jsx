import { useState } from "react";
import { Upload } from "lucide-react";
import { base44 } from "@/api/base44Client";

const num = (v) => (v === "" ? null : v);

// Admin form for importing a verified external audit report (e.g. an
// independently observed DebugBear test). Nothing here is invented: the
// administrator enters exactly what the tool reported.
export default function AuditImportForm({ onImported }) {
  const [form, setForm] = useState({
    test_date: new Date().toISOString().slice(0, 10),
    run_label: "",
    test_source: "admin_imported",
    strategy: "mobile",
    observation_type: "independent_observed",
    tested_url: "https://samedayrecycling.ca/",
    performance: "", accessibility: "", seo: "", best_practices: "",
    ai_score: "", ai_score_max: "",
    lcp_seconds: "", tbt_ms: "", cls: "", fcp_seconds: "", speed_index_seconds: "",
    notes: "", deployment_context: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const scoreField = (k, label, placeholder) => (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</span>
      <input type="number" step="any" value={form[k]} onChange={set(k)} placeholder={placeholder}
        className="input mt-1 !py-2 !text-sm" />
    </label>
  );

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const res = await base44.functions.invoke("performanceIntelligence", { action: "import", audit: form });
      const d = res.data || {};
      setMessage(
        `Recorded. ${d.comparison
          ? `Compared with ${d.comparison.previous_label}: ${d.comparison.changes.length ? d.comparison.changes.map((c) => `${c.metric} ${c.direction} by ${Math.abs(c.change)}`).join(", ") : "no measurable change"}.`
          : "No earlier comparable test for this URL and device yet."}`
      );
      const blank = { ...form, run_label: "", notes: "", performance: "", accessibility: "", seo: "", best_practices: "", ai_score: "", ai_score_max: "", lcp_seconds: "", tbt_ms: "", cls: "", fcp_seconds: "", speed_index_seconds: "" };
      setForm(blank);
      onImported?.();
    } catch (err) {
      setError(err?.message || "Import failed.");
    }
    setSaving(false);
  };

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
      <div className="flex items-center gap-2 mb-3">
        <Upload className="w-4 h-4 text-[#187B65]" />
        <div className="text-sm font-bold text-[#102B2A]">Import a verified report</div>
      </div>
      <p className="text-xs text-slate-500 mb-4">For audits run outside the platform (independently observed). Enter only values the tool actually reported — blank fields stay blank.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Test date</span>
          <input type="date" value={form.test_date} onChange={set("test_date")} required className="input mt-1 !py-2 !text-sm" />
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Tool</span>
          <select value={form.test_source} onChange={set("test_source")} className="input mt-1 !py-2 !text-sm">
            <option value="admin_imported">Other independent tool</option>
            <option value="independent_debugbear">DebugBear (independent)</option>
            <option value="pagespeed_insights">PageSpeed Insights</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Device</span>
          <select value={form.strategy} onChange={set("strategy")} className="input mt-1 !py-2 !text-sm">
            <option value="mobile">Mobile</option>
            <option value="desktop">Desktop</option>
          </select>
        </label>
        <label className="block">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Run label</span>
          <input value={form.run_label} onChange={set("run_label")} placeholder="e.g. DebugBear Test 3" className="input mt-1 !py-2 !text-sm" />
        </label>
        {scoreField("performance", "Performance", "0–100")}
        {scoreField("accessibility", "Accessibility", "0–100")}
        {scoreField("seo", "SEO", "0–100")}
        {scoreField("best_practices", "Best Practices", "0–100")}
        {scoreField("ai_score", "AI score", "e.g. 3")}
        {scoreField("ai_score_max", "AI max", "e.g. 3")}
        {scoreField("lcp_seconds", "LCP (s)", "e.g. 2.47")}
        {scoreField("tbt_ms", "TBT (ms)", "e.g. 1550")}
        {scoreField("cls", "CLS", "e.g. 0")}
        {scoreField("fcp_seconds", "FCP (s)", "")}
        {scoreField("speed_index_seconds", "Speed Index (s)", "")}
      </div>
      <label className="block mt-3">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Notes (test context exactly as observed)</span>
        <input value={form.notes} onChange={set("notes")} className="input mt-1 !py-2 !text-sm" />
      </label>
      {error && <p className="mt-3 text-xs text-red-600">{error}</p>}
      {message && <p className="mt-3 text-xs text-[#187B65] font-semibold">{message}</p>}
      <button type="submit" disabled={saving}
        className="mt-4 rounded-full bg-[#187B65] text-white font-bold px-6 py-2.5 text-sm hover:bg-[#125c4c] transition-colors disabled:opacity-50">
        {saving ? "Recording…" : "Record audit"}
      </button>
    </form>
  );
}