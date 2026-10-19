import { useEffect, useState } from "react";
import { Radar, RefreshCw, Trash2, Search, MessageCircle, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SOURCE_BADGES = {
  web_hunt: { label: "Web hunt", cls: "bg-[#0c3b24] text-[#1d9e56]", icon: Globe },
  receptionist: { label: "Asked on site", cls: "bg-emerald-100 text-emerald-800", icon: MessageCircle },
  search_console: { label: "Google", cls: "bg-slate-200 text-slate-700", icon: Search },
};

const STATUS_STYLES = {
  new: "bg-[#1d9e56]/15 text-[#0c3b24] font-bold",
  reviewed: "bg-slate-200 text-slate-700",
  acted: "bg-blue-100 text-blue-800",
  dismissed: "bg-slate-100 text-slate-400 line-through",
};

export default function QueryTrackerTab() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const page = await base44.entities.ServiceQuery.filter(
        sourceFilter === "all" ? {} : { source: sourceFilter },
        { sort: "-created_date", limit: 100 }
      );
      setItems(page.items || []);
    } catch (e) {
      setError("Could not load queries: " + e.message);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [sourceFilter]);

  const runHunt = async () => {
    setRunning(true);
    setError("");
    setResult("");
    try {
      const res = await base44.functions.invoke("queryHunter", {});
      setResult(res.data.saved_new + " new queries saved (AI found " + res.data.web_found + " on the web, " + res.data.keywords_found + " Google terms)");
      await load();
    } catch (e) {
      setError("Hunt failed: " + e.message);
    }
    setRunning(false);
  };

  const setStatus = async (id, status) => {
    await base44.entities.ServiceQuery.update(id, { status });
    setItems((prev) => prev.map((q) => (q.id === id ? { ...q, status } : q)));
  };

  const remove = async (id) => {
    await base44.entities.ServiceQuery.delete(id);
    setItems((prev) => prev.filter((q) => q.id !== id));
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="font-bold text-[#0c3b24]">Service Query Tracker</h2>
          <p className="text-sm text-slate-500">Everywhere people ask about your services: live web, Google searches and site chat</p>
        </div>
        <button
          onClick={runHunt}
          disabled={running}
          className="rounded-full bg-[#0c3b24] text-[#1d9e56] font-bold px-5 py-2.5 text-sm flex items-center gap-2 disabled:opacity-50"
        >
          {running ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
          {running ? "Hunting the web..." : "Run AI Search Now"}
        </button>
      </div>

      {result && <div className="rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm px-4 py-3 mb-4">{result}</div>}
      {error && <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 mb-4">{error}</div>}

      <div className="flex gap-2 mb-5">
        {[["all", "All"], ["web_hunt", "Web hunt"], ["receptionist", "Asked on site"], ["search_console", "Google"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSourceFilter(key)}
            className={sourceFilter === key
              ? "rounded-full bg-[#0c3b24] text-[#1d9e56] font-bold px-4 py-1.5 text-xs"
              : "rounded-full bg-slate-100 text-slate-700 font-medium px-4 py-1.5 text-xs hover:bg-slate-200 transition-colors"}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-slate-400 text-sm">Loading queries...</div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
          <Radar className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 text-sm">No queries tracked yet. Hit "Run AI Search Now" and the AI will hunt the live web and Google for people asking about your services.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((q) => {
            const badge = SOURCE_BADGES[q.source] || SOURCE_BADGES.web_hunt;
            const BadgeIcon = badge.icon;
            return (
              <div key={q.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-bold text-[#0c3b24] text-sm break-words">"{q.query_text}"</p>
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
                      <span className={"rounded-full px-2.5 py-0.5 font-bold flex items-center gap-1 " + badge.cls}>
                        <BadgeIcon className="w-3 h-3" /> {badge.label}
                      </span>
                      {q.city && <span className="text-slate-500">{q.city}</span>}
                      {q.service && <span className="text-slate-500">{q.service}</span>}
                      {q.platform && <span className="text-slate-500">via {q.platform}</span>}
                      <span className={"rounded-full px-2.5 py-0.5 font-bold " + (STATUS_STYLES[q.status] || STATUS_STYLES.new)}>{q.status}</span>
                    </div>
                    {q.intent && <p className="text-xs text-slate-600 mt-2">{q.intent}</p>}
                    {q.asker_or_url && (
                      <p className="text-xs text-slate-400 mt-1 break-all">{q.asker_or_url}</p>
                    )}
                  </div>
                  <button onClick={() => remove(q.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors shrink-0" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <select
                  value={q.status}
                  onChange={(e) => setStatus(q.id, e.target.value)}
                  className="mt-3 text-xs rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-slate-700"
                >
                  <option value="new">New</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="acted">Acted on</option>
                  <option value="dismissed">Dismissed</option>
                </select>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}