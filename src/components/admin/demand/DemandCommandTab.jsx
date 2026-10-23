import { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import MarketGauge from "./MarketGauge";
import MarketFilters from "./MarketFilters";
import MarketHistory from "./MarketHistory";
import MarketRankings from "./MarketRankings";
import MarketKeywords from "./MarketKeywords";
import MarketMovers from "./MarketMovers";
import MarketTrends from "./MarketTrends";
import { CurrentCapturePanel } from "./SitePerformancePanel";
import RexRecommendPanel from "./RexRecommendPanel";
import { Globe2, Loader2 } from "lucide-react";

const DEFAULT_FILTERS = { province: "", city: "", category: "all", periodFrom: "", periodTo: "" };

// Market Intelligence Command Center — one screen, four layers, clearly
// separated: current market command (per-service gauges), history &
// seasonality, geographic rankings, and keyword screening. Rex's AI analysis
// and the measured Search Console capture are embedded but visually distinct.
export default function DemandCommandTab({ report, loading, onOpenImport }) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [data, setData] = useState(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.functions.invoke("demandReport", { view: "command", filters });
        if (alive) setData(res.data);
      } catch {
        if (alive) setData(null);
      }
    })();
    return () => { alive = false; };
  }, [filters]);

  if (loading || (filters === DEFAULT_FILTERS && !data)) {
    return <div className="flex items-center justify-center py-16 text-slate-500">
      <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#187B65]" /> Assembling the market command center…
    </div>;
  }
  if (!data) {
    return <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-8 text-center text-sm text-slate-500">
      <Globe2 className="w-8 h-8 text-[#187B65] mx-auto mb-2" /> Market intelligence is temporarily unavailable.
    </div>;
  }

  const shown = data.categories.filter((c) => c.available).slice(0, 6);
  const serviceGauges = shown.length ? shown : data.categories.slice(0, 4);

  return (
    <div className="rounded-3xl bg-market-bg p-5 md:p-7 text-market-ink">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold">Market Intelligence Command Center</h2>
          <p className="text-sm text-market-muted">Canadian search-demand estimates for the tracked recycling and removal categories — with the site's own measured performance and Rex's AI interpretation kept separate.</p>
        </div>
        <span className="rounded-full border border-market-line px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-market-muted">All figures are labeled estimates</span>
      </div>

      <div className="mt-4"><MarketFilters data={data} filters={filters} onChange={setFilters} /></div>

      <p className="mt-3 text-xs text-market-muted">{data.coverage_note}</p>

      {/* Layer 1: current command */}
      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MarketGauge label="Estimated monthly searches" metric={data.overview} />
        <MarketGauge label="Month-over-month change" metric={data.overview} change />
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {serviceGauges.map((cat) => <MarketGauge key={cat.category} label={cat.label} metric={cat} />)}
      </div>

      {/* Layers 2 & 3: history, seasonality, geography */}
      <div className="mt-5"><MarketHistory data={data} /></div>
      <div className="mt-4"><MarketRankings data={data} onSelect={(r) => setFilters({ ...filters, province: r.geo_type === "province" ? r.key : "", city: r.geo_type === "city" ? r.key : "" })} /></div>

      {/* Layer 4: keyword screening */}
      <div className="mt-4"><MarketKeywords data={data} /></div>
      <div className="mt-4"><MarketMovers data={data} /></div>

      {/* Layer 5: emerging interest, sampled indices only */}
      <div className="mt-4"><MarketTrends data={data} /></div>

      {/* Layer 6: AI estimate on the current snapshot */}
      <RexRecommendPanel report={report} />

      {/* Layer 7: measured site performance, always separate */}
      <CurrentCapturePanel data={report?.capture && report} />

      {data.overview && !data.overview.available && (
        <div className="mt-4 rounded-2xl border border-dashed border-market-line p-5 text-center text-sm text-market-muted">
          No verified demand observations on file yet for this selection.
          {onOpenImport && <button onClick={onOpenImport} className="ml-2 font-bold text-market-accent hover:underline">Open the import tab</button>}
        </div>
      )}

      <p className="mt-5 text-[11px] leading-relaxed text-market-muted">{data.methodology}</p>
    </div>
  );
}