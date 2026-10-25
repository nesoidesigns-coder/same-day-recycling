import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DemandGauge from "@/components/demand/DemandGauge";
import { DEMAND_PALETTE } from "@/components/demand/DemandGauge";

const CATEGORY_LABELS = {
  furniture_appliance_removal: "Furniture & appliances",
  moving_downsizing: "Moving & downsizing",
  renovation_construction_debris: "Renovation & construction",
  property_management_turnover: "Property turnover",
  recycling_specialty_disposal: "Recycling & specialty",
  commercial_office_cleanouts: "Commercial",
  urgent_same_day: "Urgent same-day",
  donation_reuse_circular: "Donation & reuse",
};

const TYPE_LABELS = {
  observed_public_request: "Observed public requests",
  platform_inquiry: "Platform inquiries",
  confirmed_booking: "Confirmed bookings",
  search_interest: "Search interest",
  qualified_opportunity: "Qualified opportunities",
  market_indicator: "Market indicators",
};

function delta(current, previous) {
  if (!previous) return current > 0 ? { direction: "up", text: `new · ${current}` } : null;
  const pct = Math.round(((current - previous) / Math.max(1, previous)) * 100);
  if (!pct) return { direction: "flat", text: "no change" };
  return { direction: pct > 0 ? "up" : "down", text: `${pct > 0 ? "+" : ""}${pct}%` };
}

export default function VancouverDemandGauges() {
  const [d90, setD90] = useState(null);
  const [d30, setD30] = useState(null);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    let alive = true;
    Promise.allSettled([
      base44.functions.invoke("liveIntelligence", { action: "gauge", days: 90, city: "Vancouver" }),
      base44.functions.invoke("liveIntelligence", { action: "gauge", days: 30, city: "Vancouver" }),
    ]).then(([p90, p30]) => {
      if (!alive) return;
      const unwrap = (p) => (p.status === "fulfilled" ? p.value?.data ?? p.value : null);
      setD90(unwrap(p90));
      setD30(unwrap(p30));
    });
    return () => { alive = false; };
  }, []);

  const loading = !d90 || !d30;
  const rows = d90?.rows || [];
  const segments = rows.map((r, i) => ({
    key: r.key,
    label: CATEGORY_LABELS[r.key] || r.key,
    value: r.count,
    color: DEMAND_PALETTE[i % DEMAND_PALETTE.length],
  }));
  const selectedRow = rows.find((r) => r.key === selected);
  const updatedAt = d90?.generated_at ? new Date(d90.generated_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "";

  // Per-type totals across all Vancouver rows, with a 30d-vs-prior delta from the 90d trend buckets.
  const typeTotals = {};
  rows.forEach((r) => Object.entries(r.demand_types || {}).forEach(([t, n]) => { typeTotals[t] = (typeTotals[t] || 0) + n; }));
  const trend = d90?.trend || [];
  const lastMonth = trend[trend.length - 1]?.demand_types || {};
  const prevMonth = trend[trend.length - 2]?.demand_types || {};

  const miniGauges = Object.entries(TYPE_LABELS).filter(([t]) => typeTotals[t] > 0);

  return (
    <section aria-label="Vancouver live demand" className="py-12 md:py-20">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 font-plex text-[11px] font-semibold uppercase tracking-wider text-li-infra mb-2">
            <MapPin className="w-3.5 h-3.5" /> Metro Vancouver · live
          </div>
          <h2 className="text-[25px] md:text-[32px] font-semibold tracking-tight text-li-carbon">
            Vancouver demand, in real time
          </h2>
          <p className="mt-1.5 text-sm md:text-base text-li-slate">
            What the city is asking for right now, measured directly from platform records. Tap a sector
            on the gauge to isolate it.
          </p>
        </div>
        <Link to="/live" className="inline-flex items-center gap-1.5 text-sm font-bold text-li-infra hover:text-li-forest">
          Full live centre <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="mt-6 grid lg:grid-cols-[minmax(0,340px)_1fr] gap-5 items-start">
        {/* Sector ring gauge */}
        <DemandGauge
          variant="ring"
          label="Vancouver demand signals · 90 days"
          value={d90?.total}
          unit="signals"
          centerSub="all sectors"
          segments={segments}
          selected={selected}
          onSelect={(key) => setSelected(selected === key ? null : key)}
          period="rolling 90 days"
          source="Recycling OS demand records"
          updatedAt={updatedAt}
          status={loading ? "verified" : d90?.total ? "verified" : "unavailable"}
          loading={loading}
          methodology={
            selectedRow
              ? `${CATEGORY_LABELS[selectedRow.key] || selectedRow.key}: ${Object.entries(selectedRow.demand_types || {}).map(([t, n]) => `${TYPE_LABELS[t] || t} ${n}`).join(", ")}.`
              : "Real platform records for Vancouver. Each demand type is labelled separately — search interest is never blended into request or booking counts."
          }
        />

        {/* Mini gauges by demand type */}
        <div>
          {loading ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-[86px] rounded-[14px] border border-li-steel bg-white animate-pulse" />
              ))}
            </div>
          ) : miniGauges.length ? (
            <div className="grid sm:grid-cols-2 gap-3">
              {miniGauges.map(([type, n], i) => (
                <DemandGauge
                  key={type}
                  variant="mini"
                  label={TYPE_LABELS[type]}
                  value={n}
                  delta={delta(lastMonth[type] || 0, prevMonth[type] || 0)}
                  max={n}
                  loading={false}
                  className={i === 0 ? "sm:col-span-2" : ""}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[14px] border border-li-steel bg-white p-6 text-sm text-li-slate">
              No Vancouver demand signals recorded in the last 90 days yet. As real requests and
              observations arrive, this wall of gauges fills in automatically.
            </div>
          )}

          {/* Monthly trend strip */}
          {trend.length > 1 && (
            <div className="mt-4 rounded-[14px] border border-li-steel bg-white p-5">
              <h3 className="text-sm font-bold text-li-carbon">Monthly signal trend</h3>
              <div className="mt-3 flex items-end gap-2 h-20">
                {trend.map((t, i) => {
                  const max = Math.max(...trend.map((x) => x.count));
                  return (
                    <div key={t.month} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-t transition-all duration-700 ${i === trend.length - 1 ? "bg-li-mint" : "bg-li-infra/60"}`}
                        style={{ height: `${Math.max(6, Math.round((t.count / Math.max(1, max)) * 100))}%` }}
                        title={`${t.month}: ${t.count} signals`}
                      />
                      <span className="font-plex text-[9px] text-li-slate">{t.month.slice(2)}</span>
                    </div>
                  );
                })}
              </div>
              <p className="font-plex mt-3 text-[10px] text-li-slate">Verified counts · monthly buckets · Vancouver · platform records</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}