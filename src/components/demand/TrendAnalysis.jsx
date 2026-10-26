import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, TrendingUp, Info } from "lucide-react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from "recharts";
import { formatCount } from "@/components/sdr/pulse/PulseRing";

// Seasonal trend analysis: overlays industry-wide monthly search demand
// (source-labeled estimates) with the platform's own service volume per city.
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const label = (period) => {
  const [y, m] = String(period || "").split("-").map(Number);
  return m >= 1 && m <= 12 ? `${MONTH_NAMES[m - 1]} ${y}` : period;
};

export default function TrendAnalysis() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);
  const [city, setCity] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("demandTrends", {});
        if (alive) {
          setData(res.data);
          const cities = res.data?.cities || [];
          const best = cities.find((c) => c.has_demand) || cities.find((c) => c.has_service) || cities[0];
          if (best) setCity(best.city);
        }
      } catch {
        if (alive) setError(true);
      }
    })();
    return () => { alive = false; };
  }, []);

  const active = useMemo(
    () => (data?.cities || []).find((c) => c.city === city) || null,
    [data, city],
  );

  // Keep month gaps (null demand) instead of fabricating zeros; the line
  // breaks over unobserved months.
  const chartRows = useMemo(
    () => (active ? active.series.map((s) => ({ ...s, label: label(s.period) })) : []),
    [active],
  );
  const hasDemand = active?.has_demand;
  const hasService = active?.has_service;

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 sm:p-8">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="font-extrabold text-[#102B2A] text-lg flex items-center gap-2">
            <TrendingUp className="w-4.5 h-4.5 text-[#187B65]" /> Seasonal trend analysis
          </h2>
          <p className="text-sm text-slate-500 mt-1 max-w-2xl">
            Estimated search demand overlaid with Same Day Recycling's service volume, month by month — see how
            seasonal recycling needs fluctuate in each city.
          </p>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl bg-[#f6f9f8] border border-dashed border-[#187B65]/30 p-6 text-sm text-slate-500">
          Trend data is temporarily unavailable.
        </div>
      )}

      {data && !error && data.cities.length === 0 && (
        <div className="mt-4 rounded-2xl bg-[#f6f9f8] border border-dashed border-[#187B65]/30 p-6 text-sm text-slate-500">
          Data pending — the trend chart appears once city-level demand observations are imported and service activity
          is recorded.
        </div>
      )}

      {data && !error && data.cities.length > 0 && (
        <>
          <div className="mt-4 mb-4 flex flex-wrap gap-2">
            {data.cities.map((c) => (
              <button
                key={c.city}
                onClick={() => setCity(c.city)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold border transition-colors ${
                  c.city === city ? "bg-[#187B65] text-white border-[#187B65]" : "bg-[#f6f9f8] text-slate-600 border-slate-200 hover:border-[#187B65]"
                }`}
                title={c.has_demand ? "Demand and service data on file" : "Service data on file — demand estimates pending"}
              >
                {c.city}{c.province_code ? `, ${c.province_code}` : ""}
              </button>
            ))}
          </div>

          {active && (hasDemand || hasService) ? (
            <>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartRows} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f0" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#64748b" }} />
                    <YAxis yAxisId="demand" tick={{ fontSize: 11, fill: "#64748b" }} width={52} tickFormatter={(v) => formatCount(v)} />
                    <YAxis yAxisId="service" orientation="right" tick={{ fontSize: 11, fill: "#64748b" }} width={30} allowDecimals={false} />
                    <Tooltip
                      formatter={(value, name) => name === "Search demand (est.)"
                        ? [value == null ? "Awaiting records" : formatCount(value), name]
                        : [value == null ? "Awaiting records" : value, name]}
                      labelStyle={{ fontWeight: 700 }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    {hasService && (
                      <Bar yAxisId="service" dataKey="service_volume" name="Service volume (bookings + requests)" fill="#e2b13c" fillOpacity={0.55} radius={[3, 3, 0, 0]} />
                    )}
                    {hasDemand && (
                      <Line yAxisId="demand" dataKey="demand" name="Search demand (est.)" stroke="#187B65" strokeWidth={2.5} dot={{ r: 3, fill: "#187B65" }} connectNulls={false} />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {(active.sources || []).length > 0 && (
                <div className="mt-3 text-[11px] text-slate-400">Sources: {active.sources.join(" · ")}</div>
              )}
            </>
          ) : (
            <div className="mt-4 rounded-2xl bg-[#f6f9f8] border border-dashed border-[#187B65]/30 p-6 text-sm text-slate-500">
              Data pending for this city — monthly demand estimates appear here once a volume source covering it is
              imported in the admin panel.
            </div>
          )}

          <div className="mt-4 flex items-start gap-2 rounded-2xl bg-[#f6f9f8] border border-slate-100 p-4 text-[11px] text-slate-500 leading-relaxed">
            <Info className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
            <span>{data.series_note}</span>
          </div>
        </>
      )}

      {!data && !error && (
        <div className="mt-6 flex items-center justify-center py-10 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#187B65]" /> Loading trend data…
        </div>
      )}
    </div>
  );
}