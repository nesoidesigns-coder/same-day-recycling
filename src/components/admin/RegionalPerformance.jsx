import { MapPin } from "lucide-react";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");

const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 holo-panel-deep backdrop-blur-sm p-4";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

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
    <div className={panel}>
      <p className={`${label} mb-3 inline-flex items-center gap-2`}>
        <MapPin className="w-4 h-4 text-[#187B65]" /> Regional performance (recent bookings)
      </p>
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((r) => (
            <li key={r.city} className="text-sm">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-white">{r.city}</span>
                <span className="text-emerald-100/50 tabular-nums">
                  {r.bookings} booking{r.bookings === 1 ? "" : "s"} · {money(r.revenue)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#102B2A] overflow-hidden">
                <div className="h-full rounded-full bg-[#187B65] shadow-[0_0_10px_rgba(24,123,101,0.7)]" style={{ width: `${Math.round((r.bookings / maxBookings) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-emerald-100/50">No bookings yet.</p>
      )}
    </div>
  );
}