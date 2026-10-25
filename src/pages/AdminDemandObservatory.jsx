import { useEffect, useState } from "react";
import { Globe2, RefreshCw, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import OverviewTab from "@/components/observatory/signal/OverviewTab";
import SignalMapTab from "@/components/observatory/signal/SignalMapTab";
import QueueTab from "@/components/observatory/signal/QueueTab";
import SourcesTab from "@/components/observatory/signal/SourcesTab";

const TABS = [
  ["overview", "National Overview"],
  ["layers", "Intelligence Layers"],
  ["queue", "Opportunity Queue"],
  ["sources", "Sources & Scoring"],
];

export default function AdminDemandObservatory() {
  const [tab, setTab] = useState("overview");
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("demandSignalEngine", { action: "feed" });
      setFeed(res.data);
    } catch {
      setFeed(null);
    } finally {
      setLoading(false);
    }
  };

  const runSync = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke("demandSignalEngine", { action: "run" });
      await load();
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <span className="w-10 h-10 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center">
          <Globe2 className="w-5 h-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-extrabold text-[#102B2A]">Canadian Demand Observatory</h1>
          <p className="text-sm text-slate-500">Unified demand intelligence: every metric names its source, basis and last update. Search interest is never a lead; public requests are never bookings.</p>
        </div>
        <button onClick={runSync} disabled={running} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[#187B65] px-4 text-sm font-bold text-white disabled:opacity-60">
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {running ? "Syncing…" : "Sync demand signals"}
        </button>
      </div>
      {feed?.settings?.last_run_at && (
        <p className="mb-1 text-xs text-slate-400">Last ingestion run: {new Date(feed.settings.last_run_at).toLocaleString("en-CA")} · {feed.total} live signals</p>
      )}

      <div className="flex gap-2 overflow-x-auto my-5 pb-1">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
              tab === key ? "bg-[#102B2A] text-white border-[#102B2A]" : "bg-white text-slate-600 border-slate-200 hover:border-[#187B65]"}`}>
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-100 bg-white" role="status">
          <Loader2 className="h-6 w-6 animate-spin text-[#187B65]" />
        </div>
      ) : !feed ? (
        <div className="rounded-3xl border border-slate-100 bg-white p-8 text-sm text-slate-500">
          The demand engine is unavailable right now. No results are assumed — run a sync to collect signals from the connected sources.
        </div>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
          {tab === "overview" && <OverviewTab feed={feed} />}
          {tab === "layers" && <SignalMapTab feed={feed} />}
          {tab === "queue" && <QueueTab feed={feed} onRefresh={load} />}
          {tab === "sources" && <SourcesTab feed={feed} onRefresh={load} />}
        </div>
      )}
    </div>
  );
}