import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info } from "lucide-react";
import CanadaSignal from "./CanadaSignal";
import { SIGNAL_CATEGORY_LABEL } from "./canadaShared";
import useLivingSignals from "@/components/signals/useLivingSignals";
import DiscoveryStream from "@/components/signals/DiscoveryStream";
import DataFreshness from "@/components/signals/DataFreshness";
import { CITIES } from "@/lib/cities";

// The Canada Signal — homepage placement. One master gauge, one documented
// index basis, separate labelled layers for availability and pricing, and
// the verified discovery feed beneath. Never fabricated activity.
export default function CanadaSignalSection() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const days = 28;

  const feed = useLivingSignals({ scope: city ? "city" : "national", city, category, days });
  const data = feed.data;
  const signal = data?.signal;
  const gauges = data?.gauges;

  const categories = (signal?.categories || []).map((c) => ({
    ...c,
    label: SIGNAL_CATEGORY_LABEL[c.key] || c.key,
  }));
  const selectedCat = categories.find((c) => c.key === category);

  const layerChips = [
    {
      label: "Recorded activity",
      value: gauges?.recorded_activity?.available ? `${gauges.recorded_activity.value} observations` : "No records yet",
      ok: Boolean(gauges?.recorded_activity?.available),
      title: "Counted demand records — public requests, inquiries and confirmed work, each labelled separately.",
    },
    {
      label: "Verified contractors",
      value: gauges?.contractor_availability?.available ? `${gauges.contractor_availability.value}` : "None listed yet",
      ok: Boolean(gauges?.contractor_availability?.available),
      title: "Active verified contractors whose confirmed territory includes this location.",
    },
    {
      label: "Published pricing",
      value: gauges?.published_pricing?.available ? `from $${gauges.published_pricing.value}` : "—",
      ok: Boolean(gauges?.published_pricing?.available),
      title: "Published base rate for the minimum pickup tier — final price approved by you before any work.",
    },
  ];

  return (
    <section id="canada-signal" className="rounded-[24px] border border-si-line bg-white p-6 shadow-sm md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-[26px] font-bold tracking-tight text-si-ink md:text-[34px]">
            The Canada <span className="text-ri-emerald">Signal</span>
          </h2>
          <p className="mt-1 text-sm text-si-muted md:text-base">
            Canada's Service Intelligence — Powered by Recycling OS. Verified search-interest signals across the services we provide, explained in plain language.
          </p>
        </div>
        <select
          aria-label="Choose a geography"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-full border border-si-line bg-ri-ivory px-4 py-2 text-sm font-semibold text-si-ink"
        >
          <option value="">All of Canada</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        {/* Gauge + category chips */}
        <div>
          <CanadaSignal
            value={signal?.available ? signal.value : null}
            period={signal?.period}
            categories={categories}
            selected={category}
            onSelect={setCategory}
            geoLabel={city || "Canada"}
            coverageCount={(data?.coverage_cities || []).length}
            updatedAt={data?.generated_at}
            isLoading={feed.isLoading}
          />
          <div className="mt-5 flex flex-wrap justify-center gap-1.5">
            <button
              onClick={() => setCategory("")}
              className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${!category ? "bg-ri-forest text-white" : "bg-ri-ivory text-ri-charcoal hover:bg-ri-mint"}`}
            >
              All markets
            </button>
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setCategory(category === c.key ? "" : c.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${category === c.key ? "bg-ri-forest text-white" : "bg-ri-ivory text-ri-charcoal hover:bg-ri-mint"}`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Insight panel */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl bg-ri-ivory border border-si-line p-5">
            {selectedCat ? (
              <>
                <h3 className="text-base font-bold text-si-ink">{selectedCat.label}</h3>
                {selectedCat.available ? (
                  <p className="mt-1.5 text-sm leading-relaxed text-si-muted">
                    Relative search interest scored <span className="font-bold text-ri-charcoal">{selectedCat.value} / 100</span> across the {signal.period} — from {selectedCat.record_count} verified search-interest record{selectedCat.record_count === 1 ? "" : "s"}. Search interest only: it is never counted as requests or booked work.
                  </p>
                ) : (
                  <p className="mt-1.5 text-sm leading-relaxed text-si-muted">
                    No verified search-interest records for this category in the {signal.period} yet — shown as unavailable rather than estimated.
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-si-ink">One index, one honest basis</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-si-muted">
                  The National Signal Index is the equal-weight mean of relative search-interest readings (0–100) from Search Console syncs and keyword datasets. Requests, contractor availability and pricing are shown as separate layers below — never merged into one number.
                </p>
              </>
            )}
            <div className="mt-3 flex items-start gap-1.5 text-[11px] text-ri-slate">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="font-plex leading-snug">{signal?.methodology || "Documented methodology: equal-weight mean of relative search-interest indices from verified search-intelligence records."}</span>
            </div>
          </div>

          {/* Separate layers — never blended into the index */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {layerChips.map((l) => (
              <div key={l.label} className="rounded-2xl border border-si-line bg-white p-4" title={l.title}>
                <div className="text-[11px] font-bold text-si-muted">{l.label}</div>
                <div className={`mt-1 text-lg font-bold ${l.ok ? "text-ri-forest" : "text-ri-slate"}`}>{l.value}</div>
              </div>
            ))}
          </div>

          {/* What Canada Is Looking For */}
          <div>
            <h3 className="text-base font-bold text-si-ink">What Canada Is Looking For</h3>
            <p className="mt-0.5 text-xs text-si-muted">Verified findings from public and search-intelligence sources — never fabricated activity.</p>
            <DiscoveryStream className="mt-3" signals={data?.findings || []} isLoading={feed.isLoading} limit={4} />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/request-service${city ? `?city=${encodeURIComponent(city)}` : ""}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-ri-amber px-5 py-2.5 text-sm font-bold text-ri-charcoal transition-colors hover:brightness-95"
            >
              Request service {city ? `in ${city}` : "in your city"} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/coverage" className="text-sm font-bold text-ri-forest underline-offset-4 hover:underline">
              See verified coverage
            </Link>
            <DataFreshness
              source={signal?.source}
              updatedAt={data?.generated_at}
              verification="verified"
              size="xs"
            />
          </div>
        </div>
      </div>
    </section>
  );
}