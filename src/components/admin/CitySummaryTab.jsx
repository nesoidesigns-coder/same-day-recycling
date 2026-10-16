import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import { Loader2 } from "lucide-react";

export default function CitySummaryTab() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    (async () => {
      const [all, completed] = await Promise.all([
        base44.entities.Booking.aggregate({ groupBy: "city" }),
        base44.entities.Booking.aggregate({ query: { status: "completed" }, groupBy: "city" }),
      ]);
      const doneMap = Object.fromEntries((completed.rows || []).map((r) => [r.city, r.count]));
      const totals = (all.rows || []).reduce((acc, r) => acc + r.count, 0);
      const list = CITIES.map((c) => ({
        city: c.name,
        total: (all.rows || []).find((r) => r.city === c.name)?.count || 0,
        completed: doneMap[c.name] || 0,
      })).sort((a, b) => b.total - a.total || a.city.localeCompare(b.city));
      setRows({ list, totals });
    })();
  }, []);

  if (!rows) return <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin mx-auto my-12" />;

  const max = Math.max(1, ...rows.list.map((r) => r.total));

  return (
    <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8">
      <h2 className="text-xl font-bold text-[#0c3b24]">Bookings by city</h2>
      <p className="text-sm text-slate-500 mt-1">
        {rows.totals} booking{rows.totals === 1 ? "" : "s"} across all cities.
      </p>
      <div className="mt-6 space-y-4">
        {rows.list.map((r) => (
          <div key={r.city}>
            <div className="flex items-center justify-between text-sm mb-1.5">
              <span className="font-bold text-[#0c3b24]">{r.city}</span>
              <span className="text-slate-500">
                <span className="font-bold text-[#0c3b24]">{r.total}</span> total
                {r.total > 0 && <> · {r.completed} completed ({Math.round((r.completed / r.total) * 100)}%)</>}
              </span>
            </div>
            <div className="h-3 rounded-full bg-[#f4f7f5] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#1d9e56] transition-all"
                style={{ width: `${Math.round((r.total / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}