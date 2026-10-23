import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle2, XCircle, MinusCircle, AlertTriangle } from "lucide-react";

const SOURCE_META = {
  google_search_console: { label: "Google Search Console", note: "Our capture: impressions, clicks, positions (Canada-filtered, 28-day window)." },
  google_analytics: { label: "Google Analytics", note: "Site engagement: sessions, users, engagement rate (28 days)." },
  google_ads_keyword_planner: { label: "Google Ads Keyword Planner", note: "Industry volumes. No API connection — verified exports are imported below." },
  google_trends: { label: "Google Trends", note: "Relative interest indices only; recorded manually with their source." },
  recycling_os: { label: "Recycling OS", note: "Verified inquiries, bookings and completed pickups from platform records." },
  import: { label: "Imports", note: "History of volume data imports." },
};

const STATUS_ICON = {
  success: { icon: CheckCircle2, cls: "text-[#187B65]" },
  failed: { icon: XCircle, cls: "text-red-500" },
  unavailable: { icon: MinusCircle, cls: "text-slate-400" },
  partial: { icon: AlertTriangle, cls: "text-amber-500" },
  skipped: { icon: MinusCircle, cls: "text-slate-400" },
};

export default function DemandHealthTab({ report }) {
  const [logs, setLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const loadLogs = async () => {
    const { items } = await base44.entities.DemandSyncLog.filter({}, { sort: "-created_date", limit: 30 });
    setLogs(items || []);
  };

  useEffect(() => { loadLogs(); }, []);

  const runSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke("demandSync", {});
      setLastSync(res.data);
      await loadLogs();
    } finally {
      setSyncing(false);
    }
  };

  const live = lastSync?.sources || report?.capture?.sources || {};

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-extrabold text-[#102B2A] text-lg">Source Health</h2>
          <p className="text-sm text-slate-500">Each provider refreshes on its own real cadence. Unavailable providers are shown honestly — nothing is estimated silently.</p>
        </div>
        <Button onClick={runSync} disabled={syncing} className="gap-2 bg-[#187B65] hover:bg-[#125C4E]">
          <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} /> {syncing ? "Refreshing sources…" : "Refresh all sources"}
        </Button>
      </div>

      {lastSync && (
        <div className="mb-4 rounded-xl bg-[#187B65]/5 border border-[#187B65]/20 px-4 py-3 text-sm text-[#102B2A]">
          Last refresh {new Date(lastSync.refreshed_at).toLocaleTimeString("en-CA")} — Search Console: {live.google_search_console?.status || "—"}, Analytics: {live.google_analytics?.status || "—"}, Recycling OS: {live.recycling_os?.status || "success"}.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3 mb-8">
        {Object.entries(SOURCE_META).map(([key, meta]) => {
          const st = key === "import" ? null : live[key];
          const s = st ? (STATUS_ICON[st.status] || STATUS_ICON.skipped) : STATUS_ICON.skipped;
          return (
            <div key={key} className="rounded-2xl bg-white border border-slate-100 p-4">
              <div className="flex items-center gap-2">
                <s.icon className={`w-4 h-4 ${s.cls}`} />
                <span className="font-bold text-[#102B2A] text-sm">{meta.label}</span>
                {st && <span className="ml-auto text-[10px] font-bold uppercase text-slate-500">{st.status}</span>}
              </div>
              <p className="text-xs text-slate-500 mt-1.5">{st?.note || meta.note}</p>
            </div>
          );
        })}
      </div>

      <h3 className="font-bold text-[#102B2A] mb-2">Update log</h3>
      {logs.length === 0 ? (
        <p className="text-sm text-slate-500">No sync history yet — run "Refresh all sources" to record the first update.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full text-sm bg-white">
            <thead className="bg-[#f6f9f8] text-left">
              <tr>
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">When</th>
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Source</th>
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Status</th>
                <th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-2.5 text-xs text-slate-500 whitespace-nowrap">{new Date(l.created_date).toLocaleString("en-CA", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="px-4 py-2.5 text-xs font-semibold text-[#102B2A] whitespace-nowrap">{SOURCE_META[l.source]?.label || l.source}</td>
                  <td className="px-4 py-2.5 text-xs font-bold capitalize">{l.status}</td>
                  <td className="px-4 py-2.5 text-xs text-slate-500 max-w-[420px]">{l.coverage_note || l.error || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}