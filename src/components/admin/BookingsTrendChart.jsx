import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

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
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm font-bold text-[#0c3b24] mb-3">Bookings per day (last 14 days)</p>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="date" fontSize={10} interval={1} tickMargin={6} />
          <YAxis fontSize={11} allowDecimals={false} width={28} />
          <Tooltip formatter={(v) => [v, "Bookings"]} />
          <Bar dataKey="bookings" fill="#1d9e56" radius={[4, 4, 0, 0]} name="Bookings" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}