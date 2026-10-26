import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";
import OSIntelligenceGauge from "@/components/os/OSIntelligenceGauge";

// Compact homepage preview of the master Live Intelligence gauge — the same
// circular geometry, midnight palette, lighting and honest empty states as the
// Canadian Service Radar on /live. One verified metric: observed service
// records in the last 30 days (real records only — never estimates).
export default function LiveGaugePreview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    base44.functions
      .invoke("liveIntelligence", { action: "gauge", days: 30 })
      .then((res) => {
        if (!alive) return;
        setData(res.data);
        setError(false);
        setLoading(false);
      })
      .catch(() => {
        if (!alive) return;
        setError(true);
        setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const total = data?.total ?? null;
  const bookings = (data?.rows || []).reduce(
    (s, r) => s + (r.demand_types?.confirmed_booking || 0),
    0
  );

  const layers = [
    { type: "dial", ticks: 24, tickMajorEvery: 6 },
    { type: "orbital" },
    { type: "ring", radius: 0.62, dash: "1 5", opacity: 0.2 },
    ...(total > 0 && bookings > 0
      ? [
          {
            type: "arc",
            r0: 0.78,
            r1: 0.9,
            a0: 60,
            spanDeg: Math.max(12, Math.round(340 * (bookings / total))),
            color: "#55C7A1",
            title: `Confirmed bookings: ${bookings} of ${total} records`,
          },
        ]
      : total > 0
        ? [
            {
              type: "arc",
              r0: 0.78,
              r1: 0.9,
              a0: 60,
              spanDeg: 16,
              color: "#32C7D5",
              title: "Observed service records",
            },
          ]
        : []),
  ];

  return (
    <section
      aria-label="Live intelligence preview"
      className="surface-dark overflow-hidden p-5 md:p-8"
      style={{ background: "linear-gradient(135deg, hsl(var(--os-core)), hsl(var(--os-surface)))" }}
    >
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div>
          <div className="data-label text-cine-cyan">Recycling OS · Live Intelligence</div>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight text-cine-ink md:text-2xl">
            The Canadian Service Radar — at a glance
          </h2>

          {/* One verified metric, honestly labelled */}
          {total == null ? (
            <p className="mt-2 flex items-center gap-2 text-sm text-cine-muted">
              {loading ? "Measuring recent service records…" : "Live intelligence is unavailable right now — check back shortly."}
            </p>
          ) : total === 0 ? (
            <p className="mt-2 text-sm leading-relaxed text-cine-muted">
              Awaiting data — no service records in the last 30 days yet. Collection continues; nothing is estimated or animated.
            </p>
          ) : (
            <>
              <p className="mt-2 text-sm leading-relaxed text-cine-muted">
                <span className="metric text-xl text-cine-ink">{total}</span>{" "}
                observed service record{total === 1 ? "" : "s"} in the last 30 days — real requests, inquiries and bookings, never estimates.
              </p>
              {bookings > 0 && (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-cine-green">
                  <MapPin className="h-3.5 w-3.5" /> {bookings} confirmed booking{bookings === 1 ? "" : "s"} included
                </p>
              )}
            </>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              to="/live"
              className="inline-flex items-center gap-1.5 rounded-full bg-cine-cyan px-5 py-2.5 text-sm font-bold text-[#081421] transition-colors hover:brightness-110"
            >
              Explore Live Intelligence <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/coverage" className="text-sm font-bold text-cine-ink underline-offset-4 hover:underline">
              Verified coverage
            </Link>
          </div>
        </div>

        <OSIntelligenceGauge
          size="standard"
          loading={loading}
          error={error}
          center={{
            title: "RECORDS",
            value: total == null ? "" : total === 0 ? "—" : String(total),
            status: "LAST 30 DAYS",
          }}
          layers={layers}
          ariaLabel="Observed service records in the last 30 days"
        />
      </div>
    </section>
  );
}