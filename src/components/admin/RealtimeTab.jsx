import { useEffect, useState } from "react";
import { RefreshCw, Users, Clock, Monitor, Globe2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const DEVICE_COLORS = { desktop: "#0c3b24", mobile: "#1d9e56", tablet: "#7fd8a8" };
const DEVICE_LABELS = { desktop: "Desktop", mobile: "Mobile", tablet: "Tablet" };

export default function RealtimeTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = async (silent) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("analyticsRealtime", {});
      if (res.data?.error) {
        setError(res.data.error);
        setData(null);
      } else {
        setData(res.data);
        setUpdatedAt(new Date());
      }
    } catch (e) {
      setError(e?.message || "Could not load realtime analytics");
      setData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    const id = setInterval(() => load(true), 30000);
    return () => clearInterval(id);
  }, []);

  const perMinute = (data?.per_minute || []).map((p) => ({
    label: p.minutes_ago === 0 ? "now" : `${p.minutes_ago}m`,
    users: p.users,
  }));

  const totalDevices = (data?.devices || []).reduce((s, d) => s + d.users, 0);
  const deviceRows = (data?.devices || []).map((d) => ({
    ...d,
    label: DEVICE_LABELS[d.device] || d.device,
    pct: totalDevices ? Math.round((d.users / totalDevices) * 100) : 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#0c3b24]">Realtime</h2>
          <p className="text-sm text-slate-500">Live visitors on the site right now, from Google Analytics</p>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="hidden sm:inline text-xs text-slate-400">
              Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={() => load()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-full bg-[#0c3b24] text-[#1d9e56] font-bold px-4 py-2 text-sm disabled:opacity-60"
          >
            <RefreshCw className={"w-4 h-4" + (loading ? " animate-spin" : "")} />
            Refresh
          </button>
        </div>
      </div>

      {loading && !data ? (
        <div className="rounded-2xl border border-slate-200 p-10 text-center text-slate-500">
          Loading realtime analytics...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {error}
          <p className="mt-2 text-xs text-red-600">
            Make sure the Google Analytics property for samedayrecycling.ca is under the Google account connected to this app.
          </p>
        </div>
      ) : data ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-8 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 inline-flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1d9e56]" /> Users in last 30 minutes
            </p>
            <p className="mt-2 text-6xl font-bold text-[#0c3b24] tabular-nums">{data.users_30min.toLocaleString()}</p>
            <p className="mt-2 text-xs text-slate-500 inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#1d9e56] animate-pulse" />
              Auto-refreshes every 30 seconds
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 p-4">
            <p className="text-sm font-bold text-[#0c3b24] mb-3 inline-flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#1d9e56]" /> Users per minute (last 30 min)
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={perMinute}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="label" fontSize={10} interval={4} tickMargin={6} />
                <YAxis fontSize={11} allowDecimals={false} width={30} />
                <Tooltip formatter={(v) => [v, "Users"]} labelFormatter={(l) => (l === "now" ? "This minute" : `${l} ago`)} />
                <Bar dataKey="users" fill="#1d9e56" radius={[4, 4, 0, 0]} name="Users" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-[#0c3b24] mb-3 inline-flex items-center gap-2">
                <Monitor className="w-4 h-4 text-[#1d9e56]" /> Users by device
              </p>
              {deviceRows.length ? (
                <div className="flex items-center gap-6">
                  <ResponsiveContainer width="55%" height={200}>
                    <PieChart>
                      <Pie
                        data={deviceRows}
                        dataKey="users"
                        nameKey="label"
                        innerRadius={58}
                        outerRadius={88}
                        paddingAngle={2}
                        strokeWidth={0}
                      >
                        {deviceRows.map((d) => (
                          <Cell key={d.device} fill={DEVICE_COLORS[d.device] || "#94a3b8"} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => [`${v} users`, undefined]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <ul className="flex-1 space-y-2">
                    {deviceRows.map((d) => (
                      <li key={d.device} className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-slate-700">
                          <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: DEVICE_COLORS[d.device] || "#94a3b8" }} />
                          {d.label}
                        </span>
                        <span className="font-semibold text-[#0c3b24]">
                          {d.pct}%<span className="text-slate-400 font-normal"> · {d.users}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-slate-500">No device data yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-[#0c3b24] mb-3 inline-flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-[#1d9e56]" /> Active users by country
              </p>
              {data.countries.length ? (
                <ul className="divide-y divide-slate-100">
                  {data.countries.map((c, i) => (
                    <li key={c.country} className="flex items-center justify-between py-2 text-sm">
                      <span className="flex items-center gap-3 text-slate-700">
                        <span className="w-5 text-xs font-bold text-slate-400">{i + 1}</span>
                        {c.country}
                      </span>
                      <span className="font-semibold text-[#0c3b24]">{c.users}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No country data yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}