import { Link } from "react-router-dom";
import { ArrowRight, Building2, MapPin, Sigma, Users } from "lucide-react";
import CategoryDonut from "./CategoryDonut";

const WINDOWS = [
  { value: 7, label: "7D" },
  { value: 30, label: "30D" },
  { value: 90, label: "90D" },
];

function Stat({ label, value, note, Icon }) {
  return (
    <div className="rounded-xl border border-lm-line bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="font-plex text-[9px] font-bold uppercase tracking-[0.16em] text-lm-muted">{label}</span>
        <Icon className="h-3.5 w-3.5 text-[hsl(var(--ri-emerald))]" />
      </div>
      <div className="mt-1.5 font-heading text-[24px] font-extrabold leading-none text-lm-ink tabular-nums">{value}</div>
      <div className="mt-1 text-[10px] leading-tight text-lm-muted">{note}</div>
    </div>
  );
}

// The public read of the same verified feed the operator console uses — one
// window selector driving every number below it.
export default function LiveIntelligenceSection({ gauge, cov, rows, days, onDays, loading }) {
  const total = gauge?.total || 0;
  const cities = gauge?.cities || [];
  const verified = cov.verifiedCityNames?.length || 0;
  const recruiting = cov.recruitingCityNames?.length || 0;
  const top = cities.slice(0, 5);
  const max = Math.max(1, ...top.map((c) => c.count));

  return (
    <section className="mx-auto max-w-[1280px] px-4">
      <div className="rounded-2xl border border-lm-line bg-[hsl(var(--ri-mint)/0.28)] p-4 md:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-[19px] font-extrabold tracking-tight text-lm-ink">Live Intelligence Across Canada</h2>
            <p className="mt-0.5 text-[12px] text-lm-muted">Observed demand, verified coverage and contractor gaps — updated as records arrive.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 rounded-lg border border-lm-line bg-white p-0.5" role="group" aria-label="Reporting window">
              {WINDOWS.map((w) => (
                <button
                  key={w.value}
                  onClick={() => onDays(w.value)}
                  aria-pressed={days === w.value}
                  className={`rounded-md px-2.5 py-1.5 font-plex text-[10.5px] font-bold transition-colors ${
                    days === w.value ? "bg-[hsl(var(--lm-teal))] text-white" : "text-lm-muted hover:text-lm-ink"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <Link
              to="/live"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--lm-teal))] px-3.5 py-2.5 text-[11.5px] font-bold text-white hover:opacity-90"
            >
              View full intelligence <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
          <Stat label="Service observations" value={loading ? "—" : total} note="Verified requests, searches and public needs." Icon={Sigma} />
          <Stat label="Cities with demand" value={loading ? "—" : cities.length} note="Cities with at least one verified record." Icon={MapPin} />
          <Stat label="Verified contractor city" value={cov.loaded ? verified : "—"} note="Coverage confirmed by an active partner." Icon={Users} />
          <Stat label="Cities seeking contractors" value={cov.loaded ? recruiting : "—"} note="Demand recorded before a partner is on file." Icon={Building2} />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="h-full rounded-2xl border border-lm-line bg-white p-4">
              <h3 className="font-heading text-[13px] font-bold text-lm-ink">Top cities by observed demand</h3>
              <p className="mt-0.5 text-[10.5px] text-lm-muted">Ranked by verified records in the selected window.</p>

              <div className="mt-2.5">
                {top.map((c, i) => (
                  <div key={c.city} className="flex items-center gap-2 border-b border-lm-line/70 py-1.5 last:border-0">
                    <span className="w-3 font-plex text-[10px] font-bold text-lm-muted">{i + 1}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11.5px] font-semibold text-lm-ink">{c.city}</span>
                      <span className="mt-1 block h-1 w-full overflow-hidden rounded-full bg-[hsl(var(--ri-mint))]">
                        <span className="block h-full rounded-full bg-[#00B5AD]" style={{ width: `${(c.count / max) * 100}%` }} />
                      </span>
                    </span>
                    <span className="w-6 text-right font-plex text-[10.5px] font-bold text-lm-ink tabular-nums">{c.count}</span>
                  </div>
                ))}
                {!top.length && (
                  <p className="py-6 text-center text-[11.5px] text-lm-muted">
                    {loading ? "Loading verified records…" : "No city records in this window yet."}
                  </p>
                )}
              </div>

              <Link to="/coverage" className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-[hsl(var(--lm-teal))] hover:underline">
                Check coverage in your city <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5">
            <CategoryDonut rows={rows} total={total} loading={loading} />
          </div>
        </div>
      </div>
    </section>
  );
}