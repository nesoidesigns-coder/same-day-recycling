import { useCallback, useEffect, useState } from "react";
import { Globe2, Loader2, RefreshCw, TrendingDown, TrendingUp } from "lucide-react";
import { base44 } from "@/api/base44Client";
import PulseRing, { useCountUp, prefersReducedMotion } from "@/components/sdr/pulse/PulseRing";

const TRACKED = [
  { category: "junk_removal", label: "Junk Removal" },
  { category: "furniture_removal", label: "Furniture Removal" },
  { category: "appliance_removal", label: "Appliance Removal" },
];

function TrendBadge({ direction, pct }) {
  if (pct === null || pct === undefined) {
    if (!direction || direction === "unknown") return null;
    const up = direction === "rising";
    const Icon = up ? TrendingUp : TrendingDown;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${up ? "bg-[#187B65]/15 text-[#187B65]" : "bg-amber-100 text-amber-700"}`}>
        <Icon className="h-3 w-3" /> {direction}
      </span>
    );
  }
  const up = pct >= 0;
  const Icon = up ? TrendingUp : TrendingDown;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${up ? "bg-[#187B65]/15 text-[#187B65]" : "bg-amber-100 text-amber-700"}`}>
      <Icon className="h-3 w-3" /> {up ? "+" : ""}{pct}% vs prior period
    </span>
  );
}

function GaugeCard({ label, cat }) {
  const animate = !prefersReducedMotion();
  const display = useCountUp(cat?.available ? cat.value : 0, { animate });

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-5 flex flex-col items-center text-center">
      <PulseRing value={cat?.available ? cat.value : 1} size={110} kind="activity" palette="emerald" spin={cat?.available}>
        {cat?.available ? (
          <>
            <span className="text-xl font-extrabold text-[#102B2A] tabular-nums">{Math.round(display)}</span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-500">interest index</span>
          </>
        ) : (
          <>
            <span className="text-lg font-bold text-slate-400">—</span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">pending</span>
          </>
        )}
      </PulseRing>
      <div className="mt-2 text-sm font-bold text-[#102B2A]">{label}</div>
      <div className="mt-1"><TrendBadge pct={cat?.trend_pct ?? null} direction={cat?.trend_direction} /></div>
      <div className="mt-1 text-[10px] text-slate-500 leading-tight">
        {cat?.available
          ? `Google Trends · relative interest (0–100) · updated ${cat.last_updated || "—"}`
          : "Awaiting verified data — run the trends refresh"}
      </div>
    </div>
  );
}

// National market demand gauges: Google Trends relative-interest indices for
// the three core removal categories. Industry-wide, source-labeled, and never
// presented as search counts. A 100 reading = peak Canadian interest for the
// keyword in the trailing 30 days.
export default function MarketDemandGauges() {
  const [cats, setCats] = useState(null);
  const [period, setPeriod] = useState("");
  const [refreshedAt, setRefreshedAt] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await base44.functions.invoke("demandReport", {});
      const scope = res.data?.market?.scopes?.CA || res.data?.market?.scopes?.ca;
      const map = new Map((scope?.categories || []).map((c) => [c.category, c]));
      setCats(TRACKED.map((t) => ({ ...t, ...map.get(t.category) })));
      setPeriod(scope?.latest_period || res.data?.market?.latest_period || "");
    } catch {
      setCats(TRACKED.map((t) => ({ ...t, available: false })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const refresh = async () => {
    setSyncing(true);
    setSyncError("");
    try {
      await base44.functions.invoke("industryTrendsSync", {});
      await load();
      setRefreshedAt(new Date());
    } catch (e) {
      setSyncError(e?.message || "Trends refresh failed — try again in a moment.");
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 inline-flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-[#187B65]" /> National market demand — Canada
        </h2>
        <div className="flex items-center gap-2">
          {refreshedAt && (
            <span className="text-[10px] text-slate-500">
              Refreshed {refreshedAt.toLocaleTimeString("en-CA", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            onClick={refresh}
            disabled={syncing}
            className="inline-flex items-center gap-2 rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white hover:bg-[#125C4E] disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Reading Google Trends…" : "Refresh industry trends"}
          </button>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mb-4 max-w-2xl">
        Industry-wide Google Trends interest for the three core removal categories — the whole Canadian market, not
        just this company. Relative interest (0–100) is not a search count; 100 = peak Canadian interest for the
        keyword in the trailing 30 days.
      </p>
      {syncError && <p className="mb-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs text-red-700">{syncError}</p>}
      {loading ? (
        <div className="flex items-center justify-center py-10 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading market data…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TRACKED.map((t) => {
            const cat = cats?.find((c) => c.category === t.category);
            return <GaugeCard key={t.category} label={t.label} cat={cat} />;
          })}
        </div>
      )}
      <p className="mt-3 text-[10px] text-slate-500">
        Source: Google Trends (live web research){period ? ` · reporting period ${period}` : ""} · refreshed on demand ·
        indices are only compared within the same 30-day window and geography.
      </p>
    </div>
  );
}