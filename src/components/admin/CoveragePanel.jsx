import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MapPin } from "lucide-react";

export default function CoveragePanel() {
  const [rows, setRows] = useState(null);

  useEffect(() => {
    base44.entities.Booking
      .aggregate({ query: {}, groupBy: "city" })
      .then((res) => setRows((res.rows || []).filter((r) => r.city && r.count > 0)))
      .catch(() => setRows([]));
  }, []);

  const sorted = (rows || []).sort((a, b) => b.count - a.count);
  const max = sorted.length ? sorted[0].count : 1;

  return (
    <div className="rounded-2xl bg-white border border-slate-100 p-5">
      <div className="flex items-center gap-2 mb-1">
        <MapPin className="w-4 h-4 text-[#187B65]" />
        <h2 className="font-bold text-[#102B2A]">Coverage demand by city</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">All-time bookings per city · all markets</p>
      {rows === null ? (
        <div className="flex items-center justify-center py-8 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-sm text-slate-400 py-6 text-center">No bookings have a city recorded yet.</p>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((r) => (
            <div key={r.city} className="flex items-center gap-3">
              <span className="w-32 shrink-0 text-sm font-semibold text-[#102B2A] truncate">{r.city}</span>
              <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#187B65]"
                  style={{ width: `${Math.max((r.count / max) * 100, 4)}%` }}
                />
              </div>
              <span className="w-10 text-right text-sm font-bold text-[#102B2A]">{r.count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}