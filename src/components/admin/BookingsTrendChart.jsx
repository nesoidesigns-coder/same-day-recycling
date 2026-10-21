import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 holo-panel-deep backdrop-blur-sm p-4";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

export default function BookingsTrendChart({ bookings }) {
  const days = [];
  for (let i = 13; i >= 0; i--) days.push(new Date(Date.now() - i * 86400000).toLocaleDateString("en-CA"));
  const counts = new Map(days.map((d) => [d, 0]));
  bookings.forEach((b) => {
    const key = new Date(b.created_date).toLocaleDateString("en-CA");
    if (counts.has(key)) counts.set(key, counts.get(key) + 1);
  });
  const data = days.map((d) => ({ date: d.slice(5), bookings: counts.get(d) }));

  return (
    <div className={panel}>
      <p className={`${label} mb-3`}>Bookings per day (last 14 days)</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(24,123,101,0.15)" vertical={false} />
          <XAxis dataKey="date" fontSize={10} interval={1} tickMargin={6} stroke="#7fd8a8" tick={{ fill: "#a7f3d0", opacity: 0.6 }} />
          <YAxis fontSize={11} allowDecimals={false} width={28} stroke="#7fd8a8" tick={{ fill: "#a7f3d0", opacity: 0.6 }} />
          <Tooltip
            formatter={(v) => [v, "Bookings"]}
            cursor={{ fill: "rgba(24,123,101,0.1)" }}
            contentStyle={{ background: "#06251a", border: "1px solid rgba(24,123,101,0.4)", borderRadius: 12, color: "#ecfdf5" }}
            itemStyle={{ color: "#ecfdf5" }}
          />
          <Bar dataKey="bookings" fill="#187B65" radius={[4, 4, 0, 0]} name="Bookings" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}