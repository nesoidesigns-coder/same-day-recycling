import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = {
  new: "#d9a422",
  confirmed: "#0c3b24",
  contacted: "#1d9e56",
  scheduled: "#7fd8a8",
  completed: "#17a04c",
  cancelled: "#f87171",
};

export default function StatusDonut({ bookings }) {
  const counts = new Map();
  bookings.forEach((b) => counts.set(b.status || "new", (counts.get(b.status || "new") || 0) + 1));
  const data = Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm font-bold text-[#0c3b24] mb-3">Booking pipeline by status</p>
      {data.length ? (
        <div className="flex items-center gap-6">
          <ResponsiveContainer width="55%" height={190}>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="status" innerRadius={54} outerRadius={84} paddingAngle={2} strokeWidth={0}>
                {data.map((d) => (
                  <Cell key={d.status} fill={COLORS[d.status] || "#94a3b8"} />
                ))}
              </Pie>
              <Tooltip formatter={(v) => [v, "Bookings"]} />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex-1 space-y-2">
            {data.map((d) => (
              <li key={d.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-700 capitalize">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[d.status] || "#94a3b8" }} />
                  {d.status}
                </span>
                <span className="font-semibold text-[#0c3b24]">
                  {d.count}<span className="text-slate-400 font-normal"> · {total ? Math.round((d.count / total) * 100) : 0}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No bookings yet.</p>
      )}
    </div>
  );
}