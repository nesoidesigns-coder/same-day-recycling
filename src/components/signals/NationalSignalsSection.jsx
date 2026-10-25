import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SignalGauge from "./SignalGauge";
import InsightCard from "./InsightCard";
import DiscoveryStream from "./DiscoveryStream";
import GeographicSignal from "./GeographicSignal";
import DataFreshness from "./DataFreshness";
import useLivingSignals from "./useLivingSignals";

// National discovery display for the homepage: one central signature gauge,
// selectable service categories, regional filtering, three insight cards and
// an optional expandable discovery stream. Compact by design — booking stays
// one click away above it.
const CATEGORIES = [
  { key: "", label: "All services" },
  { key: "furniture_appliance_removal", label: "Furniture & appliances" },
  { key: "moving_downsizing", label: "Moving & downsizing" },
  { key: "renovation_construction_debris", label: "Renovation debris" },
  { key: "property_management_turnover", label: "Property & estate" },
  { key: "recycling_specialty_disposal", label: "Specialty recycling" },
  { key: "commercial_office_cleanouts", label: "Commercial" },
  { key: "urgent_same_day", label: "Same-day" },
  { key: "donation_reuse_circular", label: "Donation & reuse" },
];

const money = (n) => (Number.isFinite(n) ? `$${Math.round(n)}` : null);

export default function NationalSignalsSection() {
  const [category, setCategory] = useState("");
  const [scope, setScope] = useState("national");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");

  const query = useLivingSignals({ scope, province, city, category, days: 90 });
  const data = query.data;

  const demand = data?.gauges?.recorded_activity;
  const search = data?.gauges?.search_interest;
  const availability = data?.gauges?.contractor_availability;
  const pricing = data?.gauges?.published_pricing;

  const provinces = useMemo(
    () => Array.from(new Set((data?.findings || []).map((f) => f.location.province_code).filter(Boolean))).sort(),
    [data?.findings]
  );
  const cities = useMemo(() => data?.coverage_cities || [], [data?.coverage_cities]);

  const scopeSummary =
    scope === "national" ? "Showing national findings"
    : scope === "province" && province ? `Showing ${province} findings`
    : scope === "city" && city ? `Showing ${city} findings` : "";

  const pricingText = pricing?.available && money(pricing.value)
    ? `Published base rate for a minimum pickup is ${money(pricing.value)} CAD. You approve the final price before anything is lifted — loads taking less truck space cost less.`
    : null;

  const demandText = demand?.available
    ? `${demand.value} recorded ${demand.unit} in the last 90 days for this selection — counted from real demand records, each labelled by source.`
    : null;

  const availabilityText = availability?.available
    ? `${availability.value} verified contractor${availability.value === 1 ? "" : "s"} cover this selection. Availability is re-confirmed per job — search demand never guarantees a contractor is free.`
    : null;

  const searchText = search?.available
    ? `${search.value} search-interest record${search.value === 1 ? "" : "s"} observed. This is a relative interest indicator, not a count of requests.`
    : null;

  return (
    <section aria-label="National market intelligence" className="mt-12 rounded-[20px] border border-si-line bg-white p-5 shadow-sm md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-si-ink md:text-2xl">National market intelligence</h2>
          <p className="mt-1 text-xs text-si-muted">Recorded findings from verified sources — demand, pricing and availability shown separately, never blended.</p>
        </div>
        <DataFreshness source="Recycling OS · living signals" updatedAt={data?.generated_at} verification="verified" size="xs" />
      </div>

      {/* Selectable service categories */}
      <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label="Service category">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors duration-200 ${
              category === c.key ? "bg-si-forest text-white" : "bg-si-bg2 text-si-ink hover:bg-si-bg2/70"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Central gauge + regional filtering */}
      <div className="mt-6 grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] md:items-start">
        <div className="rounded-2xl bg-ri-ivory border border-si-line p-5">
          <SignalGauge
            value={demand?.available ? demand.value : null}
            max={Math.max(12, demand?.value || 0)}
            unit={demand?.available ? demand.unit : "observations"}
            label="Recorded demand observations"
            sub="Counted from real records only — observed requests, inquiries and confirmed work."
            source="Recycling OS demand records"
            updatedAt={demand?.updated_at}
            observedAt={demand?.observed_at}
            unavailableReason={demand?.available ? null : (data?.insufficient?.recorded_activity || "Loading verified observations…")}
            size={190}
          />
        </div>

        <div>
          <GeographicSignal
            scope={scope}
            onScope={setScope}
            provinces={provinces}
            province={province}
            onProvince={setProvince}
            cities={cities}
            city={city}
            onCity={setCity}
            summary={scopeSummary}
          />

          {/* Three supporting insight cards */}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <InsightCard
              signalType="recorded_activity"
              title="Demand"
              text={demandText}
              emptyReason={data?.insufficient?.recorded_activity || (query.isLoading ? "Loading…" : undefined)}
              source="Recycling OS demand records"
              updatedAt={demand?.updated_at}
              verification="verified"
            />
            <InsightCard
              signalType="search_interest"
              title="Search interest"
              text={searchText}
              emptyReason={data?.insufficient?.search_interest || (query.isLoading ? "Loading…" : undefined)}
              source="Search intelligence records"
              updatedAt={search?.updated_at}
              verification="verified"
            />
            <InsightCard
              signalType="contractor_availability"
              title="Availability"
              text={availabilityText}
              emptyReason={data?.insufficient?.contractor_availability || (query.isLoading ? "Loading…" : undefined)}
              source="Verified partner territory records"
              updatedAt={availability?.updated_at}
              verification="verified"
            />
          </div>
          {pricing?.available && (
            <InsightCard
              className="mt-3"
              signalType="published_pricing"
              title="Pricing"
              text={pricingText}
              source="Published pricing configuration"
              updatedAt={pricing.updated_at}
              verification="verified"
            />
          )}
        </div>
      </div>

      {/* Optional expandable discovery stream */}
      <div className="mt-6">
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-si-muted">Discovery stream</div>
        <DiscoveryStream className="mt-2" signals={data?.findings || []} isLoading={query.isLoading} />
      </div>

      <div className="mt-5 text-xs text-si-muted">
        Looking for local numbers?{" "}
        <Link to="/request-service" className="font-bold text-ri-emerald hover:underline">
          Request a pickup
        </Link>{" "}
        and the intelligence panel filters to your city automatically.
      </div>
    </section>
  );
}