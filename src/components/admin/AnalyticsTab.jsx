import { useEffect, useState } from "react";
import { BarChart3, RefreshCw, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[#0c3b24]">{value}</p>
    </div>
  );
}

export default function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("googleAnalyticsReport", {});
      if (res.data?.error) {
        setError(res.data.error);
        setData(null);
      } else {
        setData(res.data);
      }
    } catch (e) {
      setError(e?.message || "Could not load analytics");
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (d) => (d || "").slice(5);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#0c3b24]">Site Analytics (Google)</h2>
          <p className="text-sm text-slate-500">Live traffic from Google Analytics, last 28 days</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-full bg-[#0c3b24] text-[#1d9e56] font-bold px-4 py-2 text-sm disabled:opacity-60"
        >
          <RefreshCw className={"w-4 h-4" + (loading ? " animate-spin" : "")} />
          Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
          Loading analytics...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
          <p className="mt-2 text-xs text-red-600">
            Make sure the Google Analytics property for samedayrecycling.ca (measurement ID G-77FTJJBHE1) is under the Google account connected to this app.
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Visitors (28d)" value={data.totals.users.toLocaleString()} />
            <StatCard label="Page views (28d)" value={data.totals.pageviews.toLocaleString()} />
            <StatCard label="Sessions (28d)" value={data.totals.sessions.toLocaleString()} />
            <StatCard label="Engagement rate" value={data.totals.engagement_rate + "%"} />
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-[#0c3b24] mb-3 inline-flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1d9e56]" /> Visitors per day
            </p>
            {data.daily.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, undefined]} labelFormatter={(l) => l} />
                  <Line type="monotone" dataKey="users" stroke="#1d9e56" strokeWidth={2} dot={false} name="Visitors" />
                  <Line type="monotone" dataKey="sessions" stroke="#0c3b24" strokeWidth={2} dot={false} name="Sessions" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500">No daily data yet.</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-[#0c3b24] mb-3">Top pages</p>
              {data.top_pages.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.top_pages.map((p) => (
                    <li key={p.path} className="flex items-center justify-between py-2 text-sm">
                      <span className="truncate text-slate-700 mr-3">{p.path}</span>
                      <span className="font-semibold text-[#0c3b24] whitespace-nowrap">
                        {p.pageviews.toLocaleString()} views
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No page data yet.</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-[#0c3b24] mb-3 inline-flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#1d9e56]" /> Traffic sources
              </p>
              {data.sources.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.sources.map((s) => (
                    <li key={s.channel} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-700">{s.channel}</span>
                      <span className="font-semibold text-[#0c3b24]">{s.sessions.toLocaleString()} sessions</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No source data yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}