import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle2, XCircle, MinusCircle, AlertTriangle, Download, FileSpreadsheet } from "lucide-react";
import { COVERAGE } from "@/lib/coverage";
import { CATEGORY_LABELS } from "@/lib/demandShared";

const SOURCE_META = {
  google_search_console: { label: "Google Search Console", note: "Our capture: impressions, clicks, positions (Canada-filtered, 28-day window).", cadence: "Daily (reporting lags ~2 days)" },
  google_analytics: { label: "Google Analytics", note: "Site engagement: sessions, users, engagement rate (28 days).", cadence: "Daily" },
  google_ads_keyword_planner: { label: "Google Ads Keyword Planner", note: "Volume estimates via the official Google Ads API, or verified monthly exports.", cadence: "Monthly" },
  google_trends: { label: "Google Trends", note: "Sampled relative-interest indices from official exports; never search counts.", cadence: "Manual export import" },
  recycling_os: { label: "Recycling OS", note: "Verified inquiries, bookings and completed pickups from platform records.", cadence: "Live" },
  import: { label: "Imports", note: "History of volume data imports.", cadence: "On import" },
};

const STATUS_ICON = {
  success: { icon: CheckCircle2, cls: "text-[#187B65]" },
  failed: { icon: XCircle, cls: "text-red-500" },
  unavailable: { icon: MinusCircle, cls: "text-slate-400" },
  partial: { icon: AlertTriangle, cls: "text-amber-500" },
  skipped: { icon: MinusCircle, cls: "text-slate-400" },
};

const KP_SETUP = `Keyword Planner automations (official API retrieval and the monthly refresh workflow) stay disabled until a Google Ads OAuth client with the adwords scope is set up — at which point the platform uses them as designed.`;
const TRENDS_API_NOTE = `The official Google Trends API is in a limited alpha (application-based access, no published pricing or availability date). Until access is granted, Trends data is added through CSV exports imported below — indices only, never search counts.`;

const CITY_CHOICES = COVERAGE.map((c) => c.name).concat(["Toronto", "Mississauga", "Ottawa", "Montreal", "Calgary", "Edmonton", "Winnipeg", "Halifax"]);

export default function DemandHealthTab({ report }) {
  const [logs, setLogs] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [kp, setKp] = useState(null);
  const [kpRunning, setKpRunning] = useState(false);
  const [kpResult, setKpResult] = useState(null);

  const loadLogs = async () => {
    const { items } = await base44.entities.DemandSyncLog.filter({}, { sort: "-created_date", limit: 30 });
    setLogs(items || []);
  };

  const checkKp = async () => {
    try {
      const res = await base44.functions.invoke("keywordVolume", { checkOnly: true });
      setKp(res.data);
    } catch {
      setKp(null);
    }
  };

  const runKp = async () => {
    setKpRunning(true);
    setKpResult(null);
    try {
      const res = await base44.functions.invoke("keywordVolume", {});
      setKpResult(res.data);
      await loadLogs();
      await checkKp();
    } catch (e) {
      setKpResult({ status: "failed", error: e?.response?.data?.error || e.message });
    } finally {
      setKpRunning(false);
    }
  };

  useEffect(() => { loadLogs(); checkKp(); }, []);

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

      {kp && (
        <div className={`mb-8 rounded-2xl border p-4 ${kp.connected ? "border-[#187B65]/30 bg-[#187B65]/5" : "border-amber-300 bg-amber-50"}`}>
          <div className="flex flex-wrap items-center gap-2">
            {kp.connected ? <CheckCircle2 className="w-4 h-4 text-[#187B65]" /> : <AlertTriangle className="w-4 h-4 text-amber-600" />}
            <span className="font-bold text-[#102B2A] text-sm">Keyword Planner connection</span>
            <span className={`ml-auto rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${kp.connected ? "bg-[#187B65] text-white" : "bg-amber-200 text-amber-900"}`}>
              {kp.connected ? "connected" : "credentials missing"}
            </span>
          </div>
          {kp.connected ? (
            <p className="text-xs text-slate-600 mt-1.5">
              Google Ads API is authorized. Monthly volumes for all major Canadian categories are retrieved for
              Canada, each province and key cities. Refresh cadence: {kp.cadence}.
            </p>
          ) : (
            <div className="text-xs text-slate-600 mt-1.5">
              <p>Missing credentials: <span className="font-semibold">{(kp.missing || []).join(", ") || "none"}</span>.</p>
              <p className="mt-1">{KP_SETUP}</p>
              <p className="mt-1">Until then, verified Keyword Planner exports can be imported in the Import tab.</p>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Button onClick={runKp} disabled={!kp.connected || kpRunning} className="gap-2 bg-[#187B65] hover:bg-[#125C4E]">
              <RefreshCw className={`w-4 h-4 ${kpRunning ? "animate-spin" : ""}`} /> {kpRunning ? "Retrieving volumes…" : "Retrieve Keyword Planner volumes"}
            </Button>
            {kpResult && (
              <span className="text-xs text-slate-600">
                {kpResult.status === "success" || kpResult.status === "partial"
                  ? `${kpResult.records_upserted} keyword observations upserted for ${kpResult.period} across ${kpResult.geos_ok} of ${kpResult.geos_total} geographies.`
                  : `Retrieval failed: ${kpResult.error || kpResult.status}.`}
              </span>
            )}
          </div>
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-[#102B2A] text-sm">Google Trends</span>
          <span className="ml-auto rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[10px] font-bold uppercase">API alpha · access pending</span>
        </div>
        <p className="text-xs text-slate-600 mt-1.5">{TRENDS_API_NOTE}</p>
      </div>

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
              <p className="mt-1 text-[10px] text-slate-400">Cadence: {meta.cadence}</p>
            </div>
          );
        })}
      </div>

      <ExportCard />

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

// CSV prefill generator so the import sheet matches the accepted columns.
function ExportCard() {
  const buildCsv = () => {
    const header = ["keyword", "service_category", "province", "city", "est_monthly_volume", "metric_type", "period", "source", "trend_index", "competition"];
    const rows = [];
    for (const city of CITY_CHOICES) {
      for (const [cat, label] of Object.entries(CATEGORY_LABELS)) {
        if (cat === "other") continue;
        rows.push([`junk removal ${city}`, cat, "", city, "", "monthly_volume", "", "Google Ads Keyword Planner export", "", ""]);
        break;
      }
    }
    return [header.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
  };
  const download = () => {
    const blob = new Blob([buildCsv()], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "demand-import-template.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };
  return (
    <div className="mb-8 rounded-2xl border border-slate-200 bg-[#f6f9f8] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <FileSpreadsheet className="w-4 h-4 text-[#187B65]" />
        <span className="font-bold text-[#102B2A] text-sm">Import sheet helpers</span>
        <Button variant="outline" onClick={download} className="ml-auto gap-2">
          <Download className="w-4 h-4" /> Download CSV template
        </Button>
      </div>
      <p className="text-xs text-slate-600 mt-1.5">The template carries the accepted column set (keyword, service_category, province, city, est_monthly_volume, metric_type, period, source, trend_index, competition) and one prefilled city/service row to copy.</p>
    </div>
  );
}