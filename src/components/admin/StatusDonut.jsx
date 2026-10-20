import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const COLORS = {
  new: "#d9a422",
  confirmed: "#0c3b24",
  contacted: "#1d9e56",
  scheduled: "#7fd8a8",
  completed: "#17a04c",
  cancelled: "#f87171",
};

const panel = "relative overflow-hidden rounded-2xl border border-[#1d9e56]/25 holo-panel-deep backdrop-blur-sm p-4";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#1d9e56]/90";

export default function StatusDonut({ bookings }) {
  const counts = new Map();
  bookings.forEach((b) => counts.set(b.status || "new", (counts.get(b.status || "new") || 0) + 1));
  const data = Array.from(counts.entries()).map(([status, count]) => ({ status, count }));
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className={panel}>
      <p className={`${label} mb-3`}>Booking pipeline by status</p>
      {data.length ? (
        <div className="flex items-center gap-6">
          <ResponsiveContainer width="55%" height={190}>
            <PieChart>
              <Pie data={data} dataKey="count" nameKey="status" innerRadius={54} outerRadius={84} paddingAngle={2} strokeWidth={0}>
                {data.map((d) => (
                  <Cell key={d.status} fill={COLORS[d.status] || "#7fd8a8"} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => [v, "Bookings"]}
                contentStyle={{ background: "#06251a", border: "1px solid rgba(29,158,86,0.4)", borderRadius: 12, color: "#ecfdf5" }}
                itemStyle={{ color: "#ecfdf5" }}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="flex-1 space-y-2">
            {data.map((d) => (
              <li key={d.status} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-emerald-100/80 capitalize">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[d.status] || "#7fd8a8" }} />
                  {d.status}
                </span>
                <span className="font-semibold text-white tabular-nums">
                  {d.count}<span className="text-emerald-100/40 font-normal"> · {total ? Math.round((d.count / total) * 100) : 0}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-sm text-emerald-100/50">No bookings yet.</p>
      )}
    </div>
  );
}