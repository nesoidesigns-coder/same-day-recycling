import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { base44 } from "@/api/base44Client";
import StatCard from "@/components/admin/gauges/StatCard";
import GaugeCard from "@/components/admin/gauges/GaugeCard";
import EmptyGauge from "@/components/admin/gauges/EmptyGauge";

const addDays = (ymd, n) => {
  const t = new Date(ymd + "T00:00:00Z");
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};

// Durations are tracked as the span between a session's first and last
// recorded page view — a real derived measure, not an estimate.
const mmss = (sec) => {
  const s = Math.max(0, Math.round(Number(sec) || 0));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m}m ${String(s % 60).padStart(2, "0")}s` : `${s}s`;
};

const SECTION_TITLE = "text-xs font-bold uppercase tracking-[0.2em] text-slate-500 mb-4 mt-10 first:mt-0";

export default function OwnerActivityDashboard({ activity, params }) {
  const [trend, setTrend] = useState(null);
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const range = {
          traffic_class: "owner",
          created_date: { $gte: `${params.start}T00:00:00Z`, $lt: `${addDays(params.end, 1)}T00:00:00Z` },
        };
        const res = await base44.entities.Visit.filter(range, { sort: "created_date", limit: 5000 });
        if (!alive) return;
        const visits = res.items || [];

        // Daily visit trend, all days in the period filled in.
        const counts = {};
        for (const v of visits) {
          const day = (v.created_date || "").slice(0, 10);
          if (day) counts[day] = (counts[day] || 0) + 1;
        }
        const days = [];
        for (let d = params.start; ; d = addDays(d, 1)) {
          days.push({ day: d.slice(5), visits: counts[d] || 0 });
          if (d >= params.end) break;
        }

        // Session durations: first-to-last page-view span per session key.
        const bySid = {};
        for (const v of visits) {
          if (!v.sid) continue;
          const t = new Date(v.created_date).getTime();
          if (!bySid[v.sid]) bySid[v.sid] = { min: t, max: t };
          else {
            if (t < bySid[v.sid].min) bySid[v.sid].min = t;
            if (t > bySid[v.sid].max) bySid[v.sid].max = t;
          }
        }
        const spans = Object.values(bySid).map((s) => (s.max - s.min) / 1000);
        const multi = spans.filter((s) => s > 0);
        const sorted = [...multi].sort((a, b) => a - b);
        setTrend(days);
        setSessions({
          total: spans.length,
          multi: multi.length,
          single: spans.length - multi.length,
          avg: multi.length ? multi.reduce((a, b) => a + b, 0) / multi.length : 0,
          median: sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0,
          longest: multi.length ? Math.max(...multi) : 0,
        });
      } catch {
        if (alive) { setTrend(null); setSessions(null); }
      }
      if (alive) setLoading(false);
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.start, params?.end]);

  const a = activity || {};

  return (
    <>
      <h2 className={SECTION_TITLE}>Owner activity</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Your visits" value={a.owner_visits ?? "—"} sub="Page views identified as yours" tone="emerald" />
        <StatCard title="Testing sessions" value={a.owner_sessions ?? "—"} sub="Distinct sessions in period" tone="slate" />
        <StatCard title="Pages explored" value={a.owner_pages ?? "—"} sub="Distinct pages opened" tone="slate" />
        <StatCard title="Test bookings created" value={a.test_bookings ?? "—"} sub="Internal test records" tone="slate" />
      </div>

      <h2 className={SECTION_TITLE}>Visit trend</h2>
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 text-emerald-500 animate-spin" /></div>
        ) : trend && trend.length ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trend} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={{ stroke: "#e2e8f0" }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                  formatter={(v) => [v, "Page views"]}
                  labelFormatter={(l) => `Day ${l}`}
                />
                <Bar dataKey="visits" fill="#187B65" radius={[4, 4, 0, 0]} name="Page views" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-sm text-slate-500 py-10 text-center">No owner visits recorded in this period yet.</p>
        )}
        <p className="text-[11px] text-slate-500 mt-3">Daily page views from your signed-in admin sessions, for the selected period.</p>
      </div>

      <h2 className={SECTION_TITLE}>Session time</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <GaugeCard title="Average session length" status="Derived" updated="From tracked page views"
          tooltip="Average span between a session's first and last tracked page view. Single-page sessions are excluded (no measurable span).">
          {sessions && sessions.multi > 0 ? (
            <div className="text-4xl font-bold tracking-tight text-emerald-600 tabular-nums">{mmss(sessions.avg)}</div>
          ) : (
            <EmptyGauge title="Average session length" reasons="No multi-page owner sessions in this period yet" />
          )}
        </GaugeCard>
        <GaugeCard title="Longest session" status="Derived" updated="From tracked page views"
          tooltip="Longest first-to-last page-view span across your sessions in the period.">
          {sessions && sessions.multi > 0 ? (
            <div className="text-4xl font-bold tracking-tight text-slate-900 tabular-nums">{mmss(sessions.longest)}</div>
          ) : (
            <EmptyGauge title="Longest session" reasons="No multi-page owner sessions in this period yet" />
          )}
        </GaugeCard>
        <GaugeCard title="Typical session length" status="Derived" updated="Median of measured sessions"
          tooltip="Median span across multi-page owner sessions in the period.">
          {sessions && sessions.multi > 0 ? (
            <div className="text-4xl font-bold tracking-tight text-slate-900 tabular-nums">{mmss(sessions.median)}</div>
          ) : (
            <EmptyGauge title="Typical session length" reasons="No multi-page owner sessions in this period yet" />
          )}
        </GaugeCard>
        {sessions && (
          <div className="sm:col-span-2 lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-5">
            <div className="text-sm font-bold text-slate-800 mb-3">Session mix</div>
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100" role="img" aria-label="Multi-page vs single-page sessions">
              <div className="bg-emerald-500" style={{ width: `${sessions.total ? (sessions.multi / sessions.total) * 100 : 0}%` }} />
              <div className="bg-slate-300" style={{ width: `${sessions.total ? (sessions.single / sessions.total) * 100 : 0}%` }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
              <span><span className="font-bold text-emerald-600">{sessions.multi}</span> multi-page sessions</span>
              <span><span className="font-bold text-slate-500">{sessions.single}</span> single-page sessions</span>
            </div>
          </div>
        )}
      </div>

      {a.owner_paths && a.owner_paths.length > 0 && (
        <>
          <h2 className={SECTION_TITLE}>Pages you opened most</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="space-y-1.5">
              {a.owner_paths.slice(0, 8).map((p) => (
                <div key={p.path} className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-semibold text-slate-700">{p.path}</span>
                  <span className="shrink-0 font-bold text-slate-500">{p.count} views</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <p className="text-[11px] text-slate-500 mt-6">
        Session time is measured as the span between a session's first and last tracked page view — a derived measure, not an estimate. Owner activity is tracked separately and never inflates customer or contractor statistics.
      </p>
    </>
  );
}