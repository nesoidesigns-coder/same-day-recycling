import { STATUS, money, timestamp } from "@/components/observatory-v2/observatoryData";
import { MapPin, ArrowUpRight, Truck, Users, Clock, Recycle } from "lucide-react";

const TIERS = [
  ["minimum_pickup", "Minimum pickup"], ["eighth_truck", "1/8 truck"], ["quarter_truck", "1/4 truck"],
  ["half_truck", "1/2 truck"], ["three_quarter_truck", "3/4 truck"], ["full_truck", "Full truck"],
];

// Contextual intelligence revealed by selection — one honest local readout:
// verified coverage facts, recorded-signal count, city rates and nearby
// verified facilities. Every block labels its basis.
export default function CityIntelPanel({ city, capacity, status, observations, prices, facilities, pricesLoading }) {
  if (!city) return null;
  const [statusLabel, statusHint] = STATUS[status] || STATUS.currently_unavailable;
  const href = city.href || `/request-service?city=${encodeURIComponent(city.name)}`;
  return (
    <section aria-label={`Local intelligence for ${city.name}`} className="obs-panel p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight text-obs-ink md:text-2xl">
            <MapPin className="size-5 text-obs-mint" /> {city.name}{city.province ? `, ${city.province}` : ""}
          </h3>
          <p className="mt-1.5 max-w-xl text-sm text-obs-muted">{statusLabel} — {statusHint}</p>
        </div>
        <a href={href} className="obs-button">Request service here <ArrowUpRight className="size-4" /></a>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="obs-stat">
          <Users className="size-4 text-obs-mint" />
          <div className="text-2xl font-bold tabular-nums text-obs-ink">{capacity ? capacity.contractors.length : 0}</div>
          <div className="obs-stat-label">Verified contractors</div>
        </div>
        <div className="obs-stat">
          <Truck className="size-4 text-obs-mint" />
          <div className="text-2xl font-bold tabular-nums text-obs-ink">{capacity ? capacity.trucks : 0}</div>
          <div className="obs-stat-label">Truck capacity</div>
        </div>
        <div className="obs-stat">
          <Clock className="size-4 text-obs-mint" />
          <div className="text-2xl font-bold tabular-nums text-obs-ink">{capacity ? capacity.same_day : 0}</div>
          <div className="obs-stat-label">Same-day confirmed</div>
        </div>
        <div className="obs-stat">
          <div className="text-2xl font-bold tabular-nums text-obs-ink">{observations == null ? "—" : observations}</div>
          <div className="obs-stat-label">Recorded signals in current sample</div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div>
          <div className="obs-section-label">City rate card · basis: platform rate settings, not a market benchmark</div>
          {pricesLoading ? (
            <p className="mt-3 text-sm text-obs-muted">Loading rates…</p>
          ) : prices ? (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TIERS.map(([key, label]) => (
                <div key={key} className="rounded-lg border border-obs-line/50 bg-obs-surface px-3 py-2">
                  <div className="text-[10px] uppercase tracking-[0.14em] text-obs-muted">{label}</div>
                  <div className="mt-0.5 text-sm font-bold tabular-nums text-obs-ink">{money(prices[key])}</div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-obs-muted">Rates are not published for this city yet. Any quote is preliminary until you approve it.</p>
          )}
        </div>
        <div>
          <div className="obs-section-label">Nearby facilities · source: verified operator research</div>
          {facilities?.length ? (
            <ul className="mt-3 space-y-2">
              {facilities.slice(0, 4).map((f) => (
                <li key={f.id} className="flex items-start justify-between gap-3 rounded-lg border border-obs-line/50 bg-obs-surface px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-obs-ink">{f.name}</div>
                    <div className="truncate text-xs text-obs-muted">{f.accepts || f.note || "Facility details on the directory"}</div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${f.verification === "verified" ? "border-obs-mint/40 text-obs-mint" : "border-obs-line text-obs-muted"}`}>{f.verification}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-obs-muted"><Recycle className="size-4" /> No researched facilities listed for this city yet.</p>
          )}
        </div>
      </div>
      <p className="mt-5 font-plex text-[10px] tracking-wide text-obs-muted/70">
        COVERAGE FACTS: VERIFIED PARTNER RECORDS · RATES: PLATFORM SETTINGS · GENERATED {timestamp(new Date().toISOString())}
      </p>
    </section>
  );
}