import { useEffect, useState } from "react";
import { RefreshCw, TrendingUp, Filter, CalendarDays, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

const CHANNEL_LABELS = {
  "Organic Search": "Google",
  "Social": "Facebook",
  "Organic Social": "Facebook",
  "Direct": "Direct",
  "Referral": "Yelp",
  "Paid Search": "Google Ads",
  "Unassigned": "Other",
};

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
  const [counts, setCounts] = useState(null);
  const [bookingsList, setBookingsList] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [res, quotes, bookingCount, recent] = await Promise.all([
        base44.functions.invoke("googleAnalyticsReport", {}),
        base44.entities.QuoteLead.count({}),
        base44.entities.Booking.count({}),
        base44.entities.Booking.filter(
          { created_date: { $gte: new Date(Date.now() - 13 * 86400000).toISOString().slice(0, 10) } },
          { sort: "-created_date", limit: 200 }
        ),
      ]);
      if (res.data?.error) {
        setError(res.data.error);
        setData(null);
      } else {
        setData(res.data);
      }
      setCounts({ quotes, bookings: bookingCount });
      setBookingsList(recent.items || recent);
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

  // Bookings per day (Vancouver local days), last 14 days.
  const byDay = new Map();
  bookingsList.forEach((b) => {
    const key = new Date(b.created_date).toLocaleDateString("en-CA");
    byDay.set(key, (byDay.get(key) || 0) + 1);
  });
  const bookingDays = [];
  for (let i = 13; i >= 0; i--) {
    const key = new Date(Date.now() - i * 86400000).toLocaleDateString("en-CA");
    bookingDays.push({ date: key.slice(5), bookings: byDay.get(key) || 0 });
  }

  const visitors = data?.totals?.users || 0;
  const quotesN = counts?.quotes ?? 0;
  const bookingsN = counts?.bookings ?? 0;
  const pctOf = (a, b) => (b > 0 ? Math.round((a / b) * 100) : 0);
  const quotePct = pctOf(quotesN, visitors);
  const bookingOverallPct = pctOf(bookingsN, visitors);
  const funnel = [
    { label: "Visitors (28d)", value: visitors, width: 100, note: null, color: "#0c3b24" },
    { label: "Quote requests", value: quotesN, width: Math.max(quotePct, 4), note: `${quotePct}% of visitors`, color: "#1d9e56" },
    { label: "Bookings", value: bookingsN, width: Math.max(bookingOverallPct, 3), note: `${pctOf(bookingsN, quotesN)}% of quotes`, color: "#d9a422" },
  ];

  const srcRows = (data?.sources || []).map((s) => ({
    label: CHANNEL_LABELS[s.channel] || s.channel,
    raw: s.channel,
    sessions: s.sessions,
  }));

  const top5 = (data?.top_pages || []).slice(0, 5);
  const maxTop = Math.max(...top5.map((p) => p.pageviews), 1);

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
              <TrendingUp className="w-4 h-4 text-[#1d9e56]" /> Visitors &amp; page views per day
            </p>
            {data.daily.length ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.daily}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tickFormatter={fmtDate} fontSize={11} />
                  <YAxis fontSize={11} allowDecimals={false} />
                  <Tooltip formatter={(v) => [v, undefined]} labelFormatter={(l) => l} />
                  <Line type="monotone" dataKey="users" stroke="#1d9e56" strokeWidth={2} dot={false} name="Visitors" />
                  <Line type="monotone" dataKey="pageviews" stroke="#0c3b24" strokeWidth={2} dot={false} name="Pageviews" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-500">No daily data yet.</p>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-[#0c3b24] mb-3 inline-flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-[#1d9e56]" /> Bookings per day (last 14 days)
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bookingDays}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" fontSize={10} interval={1} tickMargin={6} />
                  <YAxis fontSize={11} allowDecimals={false} width={28} />
                  <Tooltip formatter={(v) => [v, "Bookings"]} />
                  <Bar dataKey="bookings" fill="#1d9e56" radius={[4, 4, 0, 0]} name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-[#0c3b24] mb-4 inline-flex items-center gap-2">
                <Filter className="w-4 h-4 text-[#1d9e56]" /> Conversion funnel
              </p>
              <div className="space-y-4">
                {funnel.map((step) => (
                  <div key={step.label}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-semibold text-[#0c3b24]">{step.label}</span>
                      <span className="text-slate-500">
                        {step.value.toLocaleString()}
                        {step.note ? ` · ${step.note}` : ""}
                      </span>
                    </div>
                    <div className="h-7 rounded-xl bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-xl" style={{ width: `${step.width}%`, backgroundColor: step.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-[#0c3b24] mb-3 inline-flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#1d9e56]" /> Traffic sources
              </p>
              {srcRows.length ? (
                <ResponsiveContainer width="100%" height={Math.max(srcRows.length * 44 + 40, 160)}>
                  <BarChart data={srcRows} layout="vertical">
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="label" width={92} fontSize={11} />
                    <Tooltip
                      formatter={(v) => [v, "Sessions"]}
                      labelFormatter={(l, payload) => (payload && payload[0] ? payload[0].payload.raw : l)}
                    />
                    <Bar dataKey="sessions" fill="#1d9e56" radius={[0, 6, 6, 0]} barSize={18} name="Sessions" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-500">No source data yet.</p>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-bold text-[#0c3b24] mb-3">Top 5 pages</p>
              {top5.length ? (
                <ul className="space-y-3">
                  {top5.map((p) => (
                    <li key={p.path} className="text-sm">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <span className="truncate text-slate-700">{p.path}</span>
                        <span className="font-semibold text-[#0c3b24] whitespace-nowrap">
                          {p.pageviews.toLocaleString()} views
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div className="h-full rounded-full bg-[#0c3b24]" style={{ width: `${Math.round((p.pageviews / maxTop) * 100)}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No page data yet.</p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}