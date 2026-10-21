import { useEffect, useMemo, useState } from "react";
import { Route as RouteIcon, RefreshCw, Loader2, Sparkles, CircleAlert, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import RouteMap from "@/components/admin/RouteMap";

function StatCard({ label, value, hint }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200/80 p-5">
      <div className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400">{label}</div>
      <div className="mt-2 text-3xl font-bold text-[#0c3b24]">{value}</div>
      <div className="text-xs text-slate-500 mt-1">{hint}</div>
    </div>
  );
}

export default function AdminRoutes() {
  const [plan, setPlan] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [activeCluster, setActiveCluster] = useState(null);
  const [pendingNew, setPendingNew] = useState(0);

  const loadLatest = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("routeOptimizer", { action: "latest" });
      setPlan(res.data?.plan || null);
      setMessage(res.data?.plan ? "" : "No route plan yet — run the optimizer.");
    } catch {
      setMessage("Could not load the last route plan.");
      setPlan(null);
    }
    setLoading(false);
  };

  useEffect(() => { loadLatest(); }, []);

  // Real-time: flag new requests that arrive after the current plan was computed.
  useEffect(() => {
    const unsubscribe = base44.entities.Booking.subscribe((event) => {
      if (event.type === "create") setPendingNew((n) => n + 1);
      if (event.type === "update" && plan) setPendingNew((n) => n + 1);
    });
    return unsubscribe;
  }, [plan]);

  const optimize = async () => {
    setOptimizing(true);
    setMessage("");
    try {
      const res = await base44.functions.invoke("routeOptimizer", { action: "optimize" });
      if (res.data?.plan) {
        setPlan(res.data.plan);
        setPendingNew(0);
        setActiveCluster(null);
        setMessage(
          res.data.unmatched?.length
            ? `Plan built — ${res.data.unmatched.length} stop(s) could not be geolocated and are excluded.`
            : ""
        );
      } else {
        setMessage(res.data?.message || "Nothing to optimize right now.");
        setPlan(null);
      }
    } catch {
      setMessage("Optimization failed — check function logs.");
    }
    setOptimizing(false);
  };

  const clusters = useMemo(() => {
    if (!plan?.stops) return [];
    const map = {};
    for (const s of plan.stops) {
      if (!map[s.cluster]) map[s.cluster] = [];
      map[s.cluster].push(s);
    }
    return Object.keys(map).map((key) => ({ key, stops: map[key] }));
  }, [plan]);

  const shown = activeCluster ? clusters.find((c) => c.key === activeCluster) : clusters[0];

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#0c3b24] flex items-center gap-2.5">
            <RouteIcon className="w-7 h-7 text-[#1d9e56]" /> Route Intelligence
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Live route optimization across the national network — active jobs geolocated, clustered by city, and
            ordered stop-by-stop.
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadLatest} disabled={loading} className="rounded-xl border border-slate-200 bg-white text-slate-600 font-bold px-4 py-2.5 text-sm hover:border-slate-400 disabled:opacity-60">
            <RefreshCw className="w-4 h-4 inline mr-1.5" /> Refresh
          </button>
          <button onClick={optimize} disabled={optimizing} className="rounded-xl bg-[#1d9e56] text-[#0c3b24] font-bold px-4 py-2.5 text-sm hover:bg-[#17a04c] disabled:opacity-60">
            {optimizing ? <Loader2 className="w-4 h-4 inline mr-1.5 animate-spin" /> : <Sparkles className="w-4 h-4 inline mr-1.5" />}
            {optimizing ? "Optimizing…" : "Optimize now"}
          </button>
        </div>
      </div>

      {pendingNew > 0 && (
        <div className="mb-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm font-semibold flex items-center gap-2">
          <CircleAlert className="w-4 h-4 shrink-0" />
          {pendingNew} booking change{pendingNew === 1 ? "" : "s"} since this plan was computed — re-optimize to include them.
        </div>
      )}
      {message && <p className="mb-4 text-sm text-slate-500">{message}</p>}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading plan…
        </div>
      ) : !plan ? (
        <div className="rounded-2xl bg-white border border-slate-200/80 p-10 text-center">
          <RouteIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h2 className="font-bold text-[#0c3b24]">No route plan yet</h2>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            When active jobs exist, "Optimize now" geolocates every stop, clusters them, and builds the shortest
            stop order for each territory.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard label="Live stops" value={plan.stop_count} hint="Active jobs in this plan" />
            <StatCard label="Territories" value={plan.cluster_count} hint="City clusters optimized" />
            <StatCard label="Total route" value={`${plan.total_km} km`} hint="Optimized stop order (estimate)" />
            <StatCard label="Distance saved" value={`${plan.saved_km} km`} hint={`vs. booking order (${plan.unoptimized_km} km)`} />
          </div>

          {plan.unmatched_count > 0 && (
            <p className="mb-4 text-sm text-amber-700 flex items-center gap-2">
              <CircleAlert className="w-4 h-4" /> {plan.unmatched_count} stop(s) not geolocated — excluded from the route.
            </p>
          )}

          {clusters.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {clusters.map((c) => (
                <button
                  key={c.key}
                  onClick={() => setActiveCluster(c.key)}
                  className={`rounded-full px-4 py-2 text-sm font-bold capitalize transition-colors ${
                    (activeCluster || clusters[0].key) === c.key
                      ? "bg-[#0c3b24] text-[#1d9e56]"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-400"
                  }`}
                >
                  {c.key} · {c.stops.length} stop{c.stops.length === 1 ? "" : "s"}
                </button>
              ))}
            </div>
          )}

          {shown && (
            <div className="grid lg:grid-cols-5 gap-4">
              <div className="lg:col-span-3"><RouteMap stops={shown.stops} /></div>
              <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-4 max-h-[360px] overflow-y-auto">
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 capitalize">{shown.key} · stop order</div>
                <ol className="space-y-2">
                  {shown.stops.map((s) => (
                    <li key={s.booking_id} className="flex items-start gap-3 text-sm">
                      <span className="w-6 h-6 rounded-full bg-[#0c3b24] text-[#1d9e56] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {s.stop_number}
                      </span>
                      <div>
                        <div className="font-semibold text-[#0c3b24]">{s.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{s.address}</div>
                        {s.leg_km > 0 && <div className="text-xs text-[#1d9e56] font-semibold mt-0.5">+{s.leg_km} km</div>}
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          <p className="mt-4 text-xs text-slate-400">
            Live data: stops come from active bookings; distances are great-circle estimates from geocoded
            addresses. Plan computed {plan.plan_date ? new Date(plan.plan_date).toLocaleString("en-CA") : "—"}.
          </p>
        </>
      )}
    </div>
  );
}