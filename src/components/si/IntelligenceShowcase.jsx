import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import ConsumerIntelligenceGauge from "./ConsumerIntelligenceGauge";
import PriceIntelligenceGauge from "./PriceIntelligenceGauge";
import { shortcutForCategory, COVERAGE_STATUS } from "./siShared";

const pct = (v, t) => (t > 0 ? Math.round((v / t) * 100) : 0);
const SHORT_STATUS = {
  same_day: "Available",
  matching: "Matching",
  recruiting: "Requests open",
  currently_unavailable: "Unknown",
};

// Section — "Discover What's Happening Across Canada".
// One featured gauge (activity) with two supporting visualizations (coverage,
// price). The city selector updates every component; the category selection is
// shared with the hero shortcuts. Explanations are generated only from real data.
export default function IntelligenceShowcase({ si, city, onCity, category, onCategory, cities }) {
  const { activity, activitySegments, activityTotal, coverageSegments, coverage, prices } = si;
  const selIdx = activitySegments.findIndex((s) => s.key === category);
  const sel = selIdx >= 0 ? activitySegments[selIdx] : null;
  const shortcut = shortcutForCategory(category);
  const quoteTo = `/request-service${city ? `?city=${encodeURIComponent(city)}` : ""}`;

  // Coverage centre: selected city status, or the national distribution total.
  const monitored = coverageSegments.reduce((s, x) => s + x.value, 0);
  const verified = coverageSegments.find((s) => s.key === "same_day")?.value || 0;
  const cityStatus = city ? coverage.statusFor(city) : null;
  const covIdx = coverageSegments.findIndex((s) => s.key === cityStatus);
  const covSelIdx = covIdx >= 0 ? covIdx : null;

  const priceObj = prices.data?.prices || null;

  let activityStory;
  if (activity.isLoading) activityStory = "Loading recorded observations…";
  else if (activity.error) activityStory = "The live intelligence feed is unavailable right now — nothing is shown rather than guessed.";
  else if (!activityTotal) activityStory = "No recorded observations in this period yet. The gauge never invents segments to fill the ring.";
  else if (sel) activityStory = `${sel.label} account for ${pct(sel.value, activityTotal)}% of recorded activity in this dataset (${sel.value} of ${activityTotal} observations).`;
  else {
    const top = [...activitySegments].sort((a, b) => b.value - a.value)[0];
    activityStory = top ? `${top.label} represent the largest share of observed requests in this dataset (${top.value} of ${activityTotal}).` : "No recorded observations in this period yet.";
  }

  const coverageStory = city
    ? cityStatus
      ? COVERAGE_STATUS[cityStatus].note
      : "Checking verified coverage for this city…"
    : monitored
      ? `Across ${monitored} monitored cities, ${verified} have a verified provider. Fulfillment is always confirmed per job.`
      : "Checking verified coverage records…";

  return (
    <section id="intelligence" className="py-12 md:py-16">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-[24px] font-bold tracking-tight text-si-ink md:text-[30px]">Discover What's Happening Across Canada</h2>
          <p className="mt-1.5 text-sm text-si-muted md:text-base">
            Explore service activity, local options, pricing information, and recycling opportunities.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm font-semibold text-si-ink">
          <span className="text-si-muted">Area</span>
          <select
            value={city}
            onChange={(e) => onCity(e.target.value)}
            aria-label="Select a city"
            className="h-11 min-w-[190px] rounded-xl border border-si-line bg-white px-3 text-sm font-semibold text-si-ink outline-none focus:border-si-mint"
          >
            <option value="">All Canada (national view)</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)]">
        {/* Featured: Canadian Service Activity */}
        <div className="rounded-[20px] border border-si-line bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-si-ink">Canadian Service Activity</h3>
            <span className="font-plex text-[10px] tracking-wide text-si-muted">GAUGE A · OBSERVED ACTIVITY</span>
          </div>
          <ConsumerIntelligenceGauge
            label="Canadian Service Activity by market category"
            segments={activitySegments}
            total={activityTotal}
            centerPrimary={sel ? String(sel.value) : String(activityTotal)}
            centerSub={sel ? `${pct(sel.value, activityTotal)}% of activity · ${sel.label}` : "recorded observations"}
            selectedIndex={selIdx >= 0 ? selIdx : null}
            onSelect={onCategory ? (i) => onCategory(i == null ? "" : activitySegments[i].key) : undefined}
            period={activity.data ? `Last ${activity.data.filters?.window_days || 90} days` : undefined}
            scope="Canada"
            source="Platform demand records (labelled requests, inquiries, bookings — search interest excluded)"
            generatedAt={activity.data?.generated_at}
            emptyLabel={activity.isLoading ? "Loading live observations…" : activity.error ? "Live feed unavailable right now." : "No recorded observations yet."}
            className="mx-auto mt-3 max-w-[340px]"
          />
          <p className="mt-3 min-h-[44px] text-sm leading-relaxed text-si-muted">{activityStory}</p>
          <div className="mt-2 flex flex-wrap gap-3">
            {shortcut && (
              <Link to={shortcut.to} className="inline-flex items-center gap-1.5 rounded-full bg-si-forest px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-si-mint hover:text-si-forest">
                Explore {shortcut.label} <ArrowRight className="size-3.5" />
              </Link>
            )}
            <Link to={quoteTo} className="inline-flex items-center gap-1.5 rounded-full border border-si-forest/25 px-4 py-2 text-sm font-bold text-si-forest transition-colors hover:bg-si-forest hover:text-white">
              Get a Quote
            </Link>
          </div>
        </div>

        {/* Supporting: coverage + price */}
        <div className="grid gap-5">
          <div className="rounded-[20px] border border-si-line bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-si-ink">Local Service Coverage</h3>
              <span className="font-plex text-[10px] tracking-wide text-si-muted">GAUGE B · VERIFIED COVERAGE</span>
            </div>
            <div className="grid items-center gap-4 sm:grid-cols-2">
              <ConsumerIntelligenceGauge
                label="Verified service coverage distribution"
                segments={coverageSegments}
                total={monitored}
                centerPrimary={city ? (cityStatus ? SHORT_STATUS[cityStatus] : "…") : String(verified)}
                centerSub={city ? city || "" : `of ${monitored} cities with a provider`}
                selectedIndex={covSelIdx}
                period="Live snapshot"
                scope={city || "All monitored cities"}
                source="Verified partner records"
                generatedAt={coverage.generatedAt}
                emptyLabel="Checking verified coverage…"
                className="max-w-[230px]"
              />
              <p className="text-sm leading-relaxed text-si-muted">{coverageStory}</p>
            </div>
          </div>

          <div className="rounded-[20px] border border-si-line bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-bold text-si-ink">Price Intelligence</h3>
              <span className="font-plex text-[10px] tracking-wide text-si-muted">GAUGE C · PUBLISHED RATES</span>
            </div>
            {prices.isLoading ? (
              <p className="py-10 text-center text-sm text-si-muted">Loading published rates…</p>
            ) : (
              <PriceIntelligenceGauge
                prices={priceObj}
                cityLabel={city}
                generatedAt={prices.data ? new Date().toISOString() : null}
                className="mt-2"
              />
            )}
            <p className="mt-2 text-sm leading-relaxed text-si-muted">
              The displayed price assumes a standard pickup with no specialty disposal fees. Travel within 30 km of the
              city centre is included; staging items curbside saves $25. Preliminary estimate — the final price is
              approved by you before any work.
            </p>
            <Link to={quoteTo} className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-si-forest/25 px-4 py-2 text-sm font-bold text-si-forest transition-colors hover:bg-si-forest hover:text-white">
              Get a Quote <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* Advanced intelligence stays one step away, never in the way */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[20px] border border-si-line bg-si-bg2 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Sparkles className="size-4 text-si-mint" />
          <p className="text-sm text-si-muted">
            <span className="font-bold text-si-ink">Recycling OS LIVE — Advanced Intelligence.</span> Full filters,
            coverage layers and source inspection for deeper research.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link to="/live" className="text-sm font-bold text-si-forest underline-offset-4 hover:underline">Open LIVE Centre</Link>
          <Link to="/prototype-observatory" className="text-sm font-bold text-si-forest underline-offset-4 hover:underline">Advanced Observatory</Link>
        </div>
      </div>
    </section>
  );
}