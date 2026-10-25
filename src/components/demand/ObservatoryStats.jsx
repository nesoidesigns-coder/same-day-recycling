import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import DataSourceLabel from "@/components/li/DataSourceLabel";

const CATEGORY_LABELS = {
  furniture_appliance_removal: "Furniture & appliance removal",
  moving_downsizing: "Moving & downsizing",
  renovation_construction_debris: "Renovation & construction debris",
  property_management_turnover: "Property management turnover",
  recycling_specialty_disposal: "Recycling & specialty disposal",
  commercial_office_cleanouts: "Commercial & office cleanouts",
  urgent_same_day: "Urgent same-day",
  donation_reuse_circular: "Donation & reuse",
};

const DEMAND_TYPE_LABELS = {
  observed_public_request: "public requests",
  search_interest: "search interest",
  platform_inquiry: "platform inquiries",
  confirmed_booking: "confirmed bookings",
  qualified_opportunity: "qualified opportunities",
  market_indicator: "market indicators",
};

export default function ObservatoryStats() {
  const [feed, setFeed] = useState(null);
  const [overview, setOverview] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    (async () => {
      const [gaugeRes, overviewRes] = await Promise.allSettled([
        base44.functions.invoke("liveIntelligence", { action: "gauge", days: 30 }),
        base44.functions.invoke("liveIntelligence", { action: "overview", days: 30 }),
      ]);
      if (gaugeRes.status === "fulfilled") setFeed(gaugeRes.value.data);
      if (overviewRes.status === "fulfilled") setOverview(overviewRes.value.data);
      if (gaugeRes.status === "rejected" && overviewRes.status === "rejected") setFailed(true);
    })();
  }, []);

  if (failed) {
    return (
      <div className="rounded-3xl border border-li-steel bg-white p-6 text-sm text-li-slate">
        Live demand data is unavailable right now — check back shortly.
      </div>
    );
  }

  const loading = !feed;
  const rows = (feed?.rows || []).slice(0, 6);
  const maxCount = Math.max(1, ...rows.map((r) => r.count));

  return (
    <section id="live-demand" className="py-14">
      <div className="max-w-2xl mb-8">
        <div className="text-xs font-bold tracking-[0.2em] text-li-infra uppercase mb-3">Live demand intelligence</div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-li-carbon">What Canada needs removed right now</h2>
        <p className="mt-3 text-li-slate">
          A live window into real service demand across the country — measured honestly, one signal type at a time.
          Search interest is never counted as a request, and requests are never counted as bookings.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 mb-8">
        {(loading ? [null, null, null] : [
          { label: "Service requests", value: overview?.service_requests?.value ?? 0, note: "last 30 days" },
          { label: "Verified service areas", value: overview?.service_areas?.value ?? 0, note: `${overview?.service_areas?.contractors ?? 0} verified contractors` },
          { label: "Market signals", value: feed?.total ?? 0, note: "last 30 days" },
        ]).map((m, i) => (
          <div key={i} className="rounded-2xl border border-li-steel bg-white p-5">
            {loading ? (
              <div className="h-16 flex items-center"><Loader2 className="w-5 h-5 animate-spin text-li-infra" /></div>
            ) : (
              <>
                <div className="text-3xl font-bold text-li-forest">{m.value}</div>
                <div className="mt-1 text-sm font-semibold text-li-carbon">{m.label}</div>
                <div className="text-xs text-li-slate">{m.note}</div>
              </>
            )}
          </div>
        ))}
      </div>

      {loading ? (
        <div className="rounded-3xl border border-li-steel bg-white p-8 flex justify-center" role="status">
          <Loader2 className="w-6 h-6 animate-spin text-li-infra" />
        </div>
      ) : !rows.length ? (
        <div className="rounded-3xl border border-li-steel bg-white p-6 text-sm text-li-slate">
          Insufficient observations for this period yet — demand data appears as real signals are collected.
        </div>
      ) : (
        <>
          <div className="rounded-3xl border border-li-steel bg-white p-6 md:p-8">
            <h3 className="text-lg font-bold text-li-carbon mb-1">Demand by market</h3>
            <p className="text-xs text-li-slate mb-6">Each market is measured separately — signals can belong to several markets.</p>
            <div className="space-y-4">
              {rows.map((r) => (
                <div key={r.key}>
                  <div className="flex items-baseline justify-between gap-3 mb-1.5">
                    <span className="text-sm font-semibold text-li-carbon">{CATEGORY_LABELS[r.key] || r.key}</span>
                    <span className="font-plex text-sm font-bold text-li-infra">{r.count}</span>
                  </div>
                  <div className="h-2.5 rounded-full bg-li-pale overflow-hidden">
                    <div className="h-full rounded-full bg-li-infra" style={{ width: `${Math.round((r.count / maxCount) * 100)}%` }} />
                  </div>
                  <div className="mt-1 font-plex text-[11px] text-li-slate">
                    {Object.entries(r.demand_types)
                      .map(([t, n]) => `${n} ${DEMAND_TYPE_LABELS[t] || t}`)
                      .join(" · ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {feed.cities?.length ? (
            <div className="mt-6 rounded-3xl border border-li-steel bg-white p-6 md:p-8">
              <h3 className="text-lg font-bold text-li-carbon mb-1">Most active municipalities</h3>
              <p className="text-xs text-li-slate mb-5">Supported locations only — signals with an unresolved location are never assigned to a city.</p>
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
                {feed.cities.slice(0, 8).map((c) => (
                  <div key={c.city} className="flex items-center justify-between border-b border-li-steel/60 py-2 last:border-0">
                    <span className="text-sm font-medium text-li-carbon">{c.city}{c.province_code ? `, ${c.province_code}` : ""}</span>
                    <span className="font-plex text-sm font-bold text-li-infra">{c.count}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-4 rounded-2xl bg-li-cloud border border-li-steel p-5">
            <div className="text-sm font-bold text-li-carbon mb-2">How to read this page</div>
            <ul className="text-xs text-li-slate space-y-1.5 list-disc pl-4">
              <li>Every number comes from real platform records and named external sources — nothing is modelled or blended.</li>
              <li>Observed public requests, platform inquiries and confirmed bookings are each counted as their own type.</li>
              <li>Search interest is aggregate keyword data — never an individual lead or a live score.</li>
              <li>Public posters are never identified; city marks show macro-geographic level only.</li>
            </ul>
            <div className="mt-3">
              <DataSourceLabel
                what="National demand signals"
                scope="Canada"
                period="last 30 days"
                source="Recycling OS demand records"
                updatedAt={feed.generated_at ? new Date(feed.generated_at).toLocaleString("en-CA") : ""}
                basis="verified counts by demand type"
              />
            </div>
          </div>
        </>
      )}
    </section>
  );
}