import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DemandGauge, { DEMAND_PALETTE } from "@/components/demand/DemandGauge";
import { LIVE_CATEGORIES } from "@/lib/liveCategories";

// National Demand Pulse — the homepage's headline intelligence module, sitting
// just below the booking entry. One verified national figure with a category
// breakdown, drawn from the same liveIntelligence records as every other gauge
// on the platform. Progressive disclosure: drill-down lives on /live, not here.

export default function NationalDemandPulse() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.functions.invoke("liveIntelligence", { action: "gauge", days: 30 })
      .then((res) => { if (alive) setData(res.data); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, []);

  const rows = (data?.rows || []).filter((r) => r.count > 0).sort((a, b) => b.count - a.count);
  const total = data?.total ?? 0;
  const loading = !data && !failed;
  const status = failed || (data && total === 0) ? "unavailable" : "verified";
  const updated = data?.generated_at
    ? new Date(data.generated_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })
    : null;

  const segments = rows.map((r, i) => ({
    key: r.key,
    label: LIVE_CATEGORIES[r.key] || r.key.replace(/_/g, " "),
    value: r.count,
    color: DEMAND_PALETTE[i % DEMAND_PALETTE.length],
  }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[25px] md:text-[32px] font-semibold tracking-tight text-li-carbon">National Demand Pulse</h2>
          <p className="mt-1 max-w-2xl text-sm text-li-slate">What Canadians are asking for right now, measured from verified platform records. Every number is counted, never projected.</p>
        </div>
        <Link to="/live" className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[14px] border border-li-steel bg-white px-4 text-sm font-bold text-li-infra hover:border-li-mint transition-colors duration-200">
          Full demand explorer <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <DemandGauge
          variant="ring"
          label="Verified demand records"
          value={total}
          unit="records"
          centerSub="Last 30 days"
          period="Last 30 days"
          source="Platform demand records"
          updatedAt={updated}
          methodology="Sum of deduplicated verified demand records across all eight service markets. Observed activity only — search interest, public requests, inquiries and bookings stay separate."
          status={status}
          segments={segments}
          loading={loading}
        />
        <div className="space-y-4">
          {loading && <div className="h-64 animate-pulse rounded-[14px] border border-li-steel bg-white" aria-hidden="true" />}
          {!loading && segments.length > 0 && (
            <DemandGauge
              variant="bar"
              label="Demand by service category"
              unit="records"
              period="Last 30 days"
              source="Platform demand records"
              updatedAt={updated}
              methodology="Share of verified records per market, ranked by count. Select a category to explore it in the full demand explorer."
              status="verified"
              segments={segments}
              onSelect={() => navigate("/live")}
            />
          )}
          {!loading && status === "unavailable" && (
            <p className="rounded-[14px] border border-li-steel bg-li-pale p-4 text-sm text-li-slate">
              No verified records in this period yet. The pulse fills in automatically as verified demand activity is recorded — nothing is estimated to fill the space.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}