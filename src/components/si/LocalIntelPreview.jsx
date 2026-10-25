import { Link } from "react-router-dom";
import { ArrowRight, MapPin, Recycle } from "lucide-react";
import MiniCanadaMap from "./MiniCanadaMap";
import { COVERAGE_STATUS, keyOf, money, timestamp } from "./siShared";

// Section — "Your Area, Explained.": a compact map and one information panel.
// Nothing here dominates the homepage; the deep experience stays on /live.
export default function LocalIntelPreview({ city, locations, coverage, prices, resources, activity, onCity }) {
  const cityRecord = locations.find((l) => keyOf(l.name) === keyOf(city));
  const status = city ? coverage.statusFor(city) : null;
  const meta = status ? COVERAGE_STATUS[status] : null;
  const startingAt = money(Number(prices?.minimum_pickup));
  const centers = (resources.data?.centers || []).slice(0, 3);
  const cityObservations = activity?.cities?.find((c) => keyOf(c.city) === keyOf(city));

  return (
    <section id="local" className="py-12 md:py-16">
      <div className="max-w-2xl">
        <h2 className="text-[24px] font-bold tracking-tight text-si-ink md:text-[30px]">Your Area, Explained.</h2>
        <p className="mt-1.5 text-sm text-si-muted md:text-base">
          Select a city on the map or from the intelligence section above to see what verified records say about it.
        </p>
      </div>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="rounded-[20px] border border-si-line bg-white p-5 shadow-sm">
          <MiniCanadaMap locations={locations} selected={city} onSelectCity={onCity} />
        </div>

        <div className="rounded-[20px] border border-si-line bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="flex items-center gap-2 text-lg font-bold text-si-ink">
              <MapPin className="size-4 text-si-forest" />
              {city || "Canada"}
              {cityRecord?.province ? <span className="text-sm font-semibold text-si-muted">· {cityRecord.province}</span> : null}
            </h3>
            {meta && (
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold"
                style={{ background: `${meta.color}1A`, color: "hsl(var(--ri-forest))" }}
              >
                <span className="inline-block size-2 rounded-full" style={{ background: meta.color }} />
                {meta.label}
              </span>
            )}
          </div>

          {meta ? (
            <p className="mt-3 text-sm leading-relaxed text-si-muted">{meta.note}</p>
          ) : (
            <p className="mt-3 text-sm text-si-muted">Checking verified coverage records…</p>
          )}

          <dl className="mt-5 grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs font-semibold text-si-muted">Starting pickup price</dt>
              <dd className="mt-1 text-xl font-bold text-si-ink">{startingAt ? `From ${startingAt}` : "Not published yet"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-si-muted">Recorded activity here</dt>
              <dd className="mt-1 text-xl font-bold text-si-ink">
                {cityObservations ? `${cityObservations.count} observations` : "None recorded"}
              </dd>
              <dd className="text-[11px] text-si-muted/70">in the current reporting window</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold text-si-muted">Nearby recycling resources</dt>
              <dd className="mt-1 text-xl font-bold text-si-ink">{resources.data ? resources.data.count : "…"}</dd>
            </div>
          </dl>

          {centers.length > 0 && (
            <ul className="mt-4 space-y-1.5">
              {centers.map((c) => (
                <li key={c.id || c.name} className="flex items-center gap-2 text-sm text-si-muted">
                  <Recycle className="size-3.5 text-si-mint" /> {c.name}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Link to="/live" className="inline-flex items-center gap-1.5 rounded-full bg-si-forest px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-si-mint hover:text-si-forest">
              Explore Full Local Intelligence <ArrowRight className="size-3.5" />
            </Link>
            {coverage.generatedAt && (
              <span className="font-plex text-[11px] text-si-muted">Coverage snapshot {timestamp(coverage.generatedAt)}</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}