import { useEffect, useState } from "react";
import { Database, Save } from "lucide-react";
import { base44 } from "@/api/base44Client";

const WEIGHT_FACTORS = [
  ["relevance", "Relevance to offered services"],
  ["evidence", "Evidence strength"],
  ["geo_confidence", "Geographic confidence"],
  ["recency", "Recency (source timestamp)"],
  ["intent", "Expressed commercial intent"],
  ["urgency", "Urgency"],
  ["capacity", "Contractor fulfillment capacity"],
];

function sourceState(row) {
  if (!row.last_collected) return "Not collected yet";
  const days = (Date.now() - new Date(row.last_collected).getTime()) / 86400000;
  if (days <= 2) return "connected";
  if (days <= 7) return "delayed";
  return "stale";
}

export default function SourcesTab({ feed, onRefresh }) {
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const s = feed.settings || {};
    setForm({ weights: { ...WEIGHT_FACTORS.reduce((a, [k]) => ({ ...a, [k]: 0 }), {}), ...(s.weights || {}) }, queue_threshold: s.queue_threshold ?? 60, stale_days: s.stale_days ?? 30 });
  }, [feed]);

  const save = async () => {
    setSaving(true);
    try {
      await base44.functions.invoke("demandSignalEngine", { action: "settings", save: true, ...form });
      setSaved(true);
      await onRefresh();
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid gap-7 lg:grid-cols-2">
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider text-slate-500"><Database className="h-4 w-4 text-[#187B65]" /> Source health & coverage</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-100">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#f6f9f8] text-left text-xs uppercase tracking-wide text-slate-500"><th className="p-3">Source</th><th className="p-3">Signals</th><th className="p-3">Last collected</th><th className="p-3">State</th></tr></thead>
            <tbody>
              {(feed.sources || []).map((s) => (
                <tr key={`${s.source_type}:${s.source_platform}`} className="border-t border-slate-100">
                  <td className="p-3 font-bold text-[#102B2A]">{s.source_platform}<span className="ml-1 text-xs font-normal text-slate-400">({s.source_type.replace(/_/g, " ")})</span></td>
                  <td className="p-3 text-slate-600">{s.count}</td>
                  <td className="p-3 text-slate-600">{fmt(s.last_collected)}</td>
                  <td className="p-3"><span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${sourceState(s) === "connected" ? "bg-[#187B65]/10 text-[#0d5c4b]" : sourceState(s) === "delayed" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"}`}>{sourceState(s)}</span></td>
                </tr>
              ))}
              {!feed.sources?.length && <tr><td className="p-3 text-slate-400" colSpan={4}>No signals collected yet. Run a sync.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">Public discovery respects API limits and platform terms (official endpoints, bounded volume). Search-intelligence datasets are labeled with their reporting period and basis. Sources without credentials (e.g. Google Trends API) are shown as unavailable, never fabricated.</p>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-extrabold uppercase tracking-wider text-slate-500">Opportunity scoring weights (owner-controlled)</h2>
        {form && (
          <div className="space-y-3 rounded-2xl border border-slate-100 p-4">
            {WEIGHT_FACTORS.map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-600">{label}</span>
                <input type="number" min="0" max="50" value={form.weights[key] ?? 0}
                  onChange={(e) => setForm({ ...form, weights: { ...form.weights, [key]: Number(e.target.value) } })}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
              </label>
            ))}
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Review-queue score threshold</span>
              <input type="number" min="20" max="95" value={form.queue_threshold}
                onChange={(e) => setForm({ ...form, queue_threshold: Number(e.target.value) })}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
            </label>
            <label className="flex items-center justify-between gap-3 text-sm">
              <span className="text-slate-600">Stale request window (days)</span>
              <input type="number" min="7" max="120" value={form.stale_days}
                onChange={(e) => setForm({ ...form, stale_days: Number(e.target.value) })}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
            </label>
            <button onClick={save} disabled={saving} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#102B2A] px-4 text-sm font-bold text-white disabled:opacity-60">
              <Save className="h-4 w-4" /> {saving ? "Saving…" : saved ? "Saved" : "Save scoring settings"}
            </button>
            <p className="text-xs text-slate-500">Weights take effect on the next signal sync. Every change is recorded in the settings history; scores always show their factor breakdown in the queue.</p>
          </div>
        )}
      </section>
    </div>
  );
}

const fmt = (v) => (v && new Date(v).getTime() ? new Date(v).toLocaleDateString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "unavailable");