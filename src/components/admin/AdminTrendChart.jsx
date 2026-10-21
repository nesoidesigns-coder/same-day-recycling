import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function AdminTrendChart({ bookings, days = 14 }) {
  const today = new Date();
  const rows = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    rows.push({
      date: key.slice(5),
      bookings: (bookings || []).filter((b) => (b.created_date || "").slice(0, 10) === key).length,
    });
  }

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
      <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#0c3b24] mb-1">Bookings — last {days} days</h3>
      <p className="text-xs text-slate-500 mb-3">Daily booking submissions from real records</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
            <defs>
              <linearGradient id="emeraldFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1d9e56" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#1d9e56" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
            <Tooltip cursor={{ stroke: "#1d9e56", strokeOpacity: 0.2 }} />
            <Area type="monotone" dataKey="bookings" stroke="#1d9e56" strokeWidth={2} fill="url(#emeraldFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}