import { MapPin } from "lucide-react";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");

export default function RegionalPerformance({ bookings }) {
  const byCity = new Map();
  bookings.forEach((b) => {
    const city = (b.city || "").trim() || "Unspecified";
    const cur = byCity.get(city) || { bookings: 0, revenue: 0 };
    cur.bookings += 1;
    cur.revenue += Number(b.job_value) || 0;
    byCity.set(city, cur);
  });
  const rows = Array.from(byCity.entries())
    .map(([city, v]) => ({ city, ...v }))
    .sort((a, b) => b.revenue - a.revenue || b.bookings - a.bookings)
    .slice(0, 8);
  const maxBookings = Math.max(...rows.map((r) => r.bookings), 1);

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <p className="text-sm font-bold text-[#0c3b24] mb-3 inline-flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#1d9e56]" /> Regional performance (recent bookings)
      </p>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.city} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-[#0c3b24]">{r.city}</span>
                <span className="text-slate-500">
                  {r.bookings} booking{r.bookings === 1 ? "" : "s"} · {money(r.revenue)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[#1d9e56]" style={{ width: `${Math.round((r.bookings / maxBookings) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">No bookings yet.</p>
      )}
    </div>
  );
}