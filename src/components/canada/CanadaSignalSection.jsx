import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Info } from "lucide-react";
import CanadaSignal from "./CanadaSignal";
import { SIGNAL_CATEGORY_LABEL } from "./canadaShared";
import useLivingSignals from "@/components/signals/useLivingSignals";
import DiscoveryStream from "@/components/signals/DiscoveryStream";
import DataFreshness from "@/components/signals/DataFreshness";
import { CITIES } from "@/lib/cities";
import { setRexContext } from "@/lib/rexSession";

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
  const mi = data?.market_interest;
  const kp = data?.keyword_planner;

  const categories = (signal?.categories || []).map((c) => ({
    ...c,
    label: SIGNAL_CATEGORY_LABEL[c.key] || c.key,
  }));
  const selectedCat = categories.find((c) => c.key === category);
  const shortPeriod = signal?.data_start
    ? `since ${new Date(signal.data_start).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}`
    : `last ${days} days`;

  const layerChips = [
    {
      label: "Recorded activity",
      value: gauges?.recorded_activity?.available ? `${gauges.recorded_activity.value} observations` : "No verified records yet",
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
    <section id="canada-signal" className="rounded-[24px] border border-si-line bg-white p-4 shadow-sm sm:p-6 md:p-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="text-[26px] font-bold tracking-tight text-si-ink md:text-[34px]">
            The Canada <span className="text-ri-amber-ink">Signal</span>
          </h2>
          <p className="mt-1 text-sm text-si-muted md:text-base">
            Canada's Service Intelligence — Powered by Recycling OS. Actual customer search counts for our services (Google Search Console), plus whole-market online interest for all of Canada — every layer labelled, never merged.
          </p>
        </div>
        <select
          aria-label="Choose a geography"
          value={city}
          onChange={(e) => {
            setCity(e.target.value);
            if (e.target.value) setRexContext({ city: e.target.value, page: "canada-signal" });
          }}
          className="w-full max-w-full rounded-full border border-si-line bg-ri-ivory px-4 py-2 text-sm font-semibold text-si-ink sm:w-auto"
        >
          <option value="">All of Canada</option>
          {CITIES.map((c) => (
            <option key={c.slug} value={c.name}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid gap-6 md:mt-8 md:gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:items-start">
        {/* Gauge + category chips */}
        <div>
          <CanadaSignal
            value={signal?.available ? signal.value : null}
            period={signal?.period}
            categories={categories}
            selected={category}
            onSelect={setCategory}
            marketInterest={mi}
            geoLabel={city || "Canada"}
            coverageCount={(data?.coverage_cities || []).length}
            updatedAt={data?.generated_at}
            isLoading={feed.isLoading}
            periodOverride={shortPeriod}
          />
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
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
                    <span className="font-bold text-ri-charcoal">{selectedCat.value}</span> actual customer search{selectedCat.value === 1 ? "" : "es"} for this category in the {signal.period}, across {selectedCat.record_count} distinct search term{selectedCat.record_count === 1 ? "" : "s"} — {selectedCat.clicks} of them clicked through to the site. Real Google Search Console counts, never a score or estimate.
                  </p>
                ) : (
                  <p className="mt-1.5 text-sm leading-relaxed text-si-muted">
                    No customer searches for this category recorded in Search Console in the {signal.period} yet — shown as zero rather than estimated.
                  </p>
                )}
              </>
            ) : (
              <>
                <h3 className="text-base font-bold text-si-ink">Real searches, one honest basis</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-si-muted">
                  The Canada Signal counts actual customer searches for our services — verified Google Search Console records, grouped by service category. The amber inner arcs show whole-market online interest — everyone searching Canada-wide, including searches that never reach this site — as a relative index, never a count. Requests, contractor availability and pricing stay as separate layers below — never merged into one number.
                </p>
              </>
            )}
            <div className="mt-3 flex items-start gap-1.5 text-xs text-ri-slate">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="font-plex leading-snug">{signal?.methodology || "Documented methodology: actual customer search counts (impressions) from Google Search Console, matched to service categories by keyword rules."}</span>
            </div>
            {signal?.window_note && (
              <p className="mt-2 rounded-lg bg-ri-amber/10 px-3 py-2 text-xs leading-snug text-ri-amber-ink">{signal.window_note}</p>
            )}
          </div>

          {/* Separate layers — never blended into the index */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {layerChips.map((l) => (
              <div key={l.label} className="rounded-2xl border border-si-line bg-white p-4" title={l.title}>
                <div className="text-xs font-bold text-si-muted">{l.label}</div>
                <div className={`mt-1 text-lg font-bold ${l.ok ? "text-ri-forest" : "text-ri-slate"}`}>{l.value}</div>
              </div>
            ))}
          </div>

          {/* Market-wide online activity — whole-market layer, labelled */}
          <div className="rounded-2xl border border-si-line bg-white p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-base font-bold text-si-ink">Canada's online market activity</h3>
              <span className="font-plex text-xs text-ri-slate">Google Trends · relative interest, 0-100</span>
            </div>
            {mi?.available ? (
              <>
                <p className="mt-1 text-sm leading-relaxed text-si-muted">
                  Whole-market search interest from public Google Trends — everyone searching, including searches that never reach this site. A relative index, never a count — the same interest also drawn as the amber inner arcs on the gauge.
                </p>
                <ul className="mt-3 space-y-2">
                  {mi.categories.slice(0, 5).map((c) => (
                    <li key={c.key} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 truncate text-xs font-bold text-ri-charcoal sm:w-44">{SIGNAL_CATEGORY_LABEL[c.key] || c.key}</span>
                      <div className="h-2 min-w-0 flex-1 rounded-full bg-ri-ivory">
                        <div className="h-2 rounded-full bg-ri-forest" style={{ width: `${Math.max(3, Math.min(100, c.index))}%` }} />
                      </div>
                      <span className="w-7 shrink-0 text-right font-plex text-xs font-bold text-ri-forest">{c.index}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-1 text-sm leading-relaxed text-si-muted">
                No whole-market trend records yet — shown as nothing rather than estimated.
              </p>
            )}
            {kp && !kp.configured && (
              <p className="mt-3 rounded-lg bg-ri-amber/10 px-3 py-2 text-xs leading-snug text-ri-amber-ink">
                Actual monthly search counts for the entire Canadian market — by province and city — come from Google Ads Keyword Planner. That connection isn't active yet, so this layer shows relative interest only.
              </p>
            )}
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