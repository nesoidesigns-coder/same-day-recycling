import { useEffect, useState } from "react";
import { LIVE_CATEGORIES } from "@/lib/liveCategories";
import { Loader2 } from "lucide-react";

// The National Intelligence Radar — the LIVE Centre's signature instrument.
// Eight fixed service-category segments; radial extension shows the real
// record count for each. Zero observations render as a flat base segment —
// never estimated, never animated as if activity were incoming.

const KEYS = Object.keys(LIVE_CATEGORIES);

const SHORT = {
  furniture_appliance_removal: "Furniture & Appliances",
  moving_downsizing: "Moving",
  renovation_construction_debris: "Construction",
  property_management_turnover: "Property Mgmt",
  recycling_specialty_disposal: "Recycling",
  commercial_office_cleanouts: "Commercial",
  urgent_same_day: "Same-Day",
  donation_reuse_circular: "Donation",
};

const COLORS = {
  furniture_appliance_removal: "#168977",
  moving_downsizing: "#2FB097",
  renovation_construction_debris: "#123F34",
  property_management_turnover: "#6FCDB6",
  recycling_specialty_disposal: "#0F5C4B",
  commercial_office_cleanouts: "#4FA892",
  urgent_same_day: "#F6A000",
  donation_reuse_circular: "#8FD9C4",
};

const CX = 170, CY = 170, INNER = 50, BASE = 70, MAX = 124;
const LABEL_R = 140;

const polar = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};

const sector = (r0, r1, a0, a1) => {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r1} ${r1} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} A ${r0} ${r0} 0 0 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`;
};

const periodLabel = (days) =>
  ({ 7: "last 7 days", 30: "last 30 days", 90: "last 90 days", 365: "last 12 months" }[days] || `last ${days} days`);

export default function NationalRadar({ data, loading, error, selected, onSelect, days = 30 }) {
  const [pulseKey, setPulseKey] = useState(0);
  useEffect(() => {
    // One-shot pulse when the underlying feed actually refreshes.
    if (data?.generated_at) setPulseKey((k) => k + 1);
  }, [data?.generated_at]);

  if (loading) {
    return (
      <div className="rounded-2xl bg-white border border-si-line p-8 flex items-center justify-center gap-2 text-sm text-ri-slate">
        <Loader2 className="w-4 h-4 animate-spin" /> Preparing the radar…
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="rounded-2xl bg-white border border-si-line p-6 text-sm text-ri-slate">
        The intelligence feed is unavailable right now. Please try again shortly — nothing here is estimated while it reconnects.
      </div>
    );
  }

  const rows = KEYS.map((key) => ({
    key,
    label: SHORT[key],
    fullLabel: LIVE_CATEGORIES[key],
    count: (data.rows || []).find((r) => r.key === key)?.count || 0,
    fill: COLORS[key],
  }));
  const max = Math.max(1, ...rows.map((r) => r.count));
  const total = data.total || 0;
  const refreshedAt = data.generated_at
    ? new Date(data.generated_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    : null;

  return (
    <div>
      <div className="relative mx-auto w-full max-w-[380px]">
        <svg viewBox="0 0 340 340" className="block w-full" role="group" aria-label="National intelligence radar by service category">
          {/* measurement rings + radial ticks */}
          {[BASE, 92, 112, MAX].map((r) => (
            <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="#123F34" strokeOpacity="0.08" strokeWidth="1" />
          ))}
          {KEYS.map((_, i) => {
            const [x1, y1] = polar(BASE, i * 45 - 90);
            const [x2, y2] = polar(MAX + 6, i * 45 - 90);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#123F34" strokeOpacity="0.08" strokeWidth="1" />;
          })}

          {/* interactive category segments */}
          {rows.map((r, i) => {
            const a0 = i * 45 - 90 + 2;
            const a1 = i * 45 - 90 + 43;
            const r1 = r.count ? BASE + (r.count / max) * (MAX - BASE) : BASE;
            const dim = selected && selected !== r.key;
            const mid = (a0 + a1) / 2;
            const [tx, ty] = polar((INNER + r1) / 2 + 6, mid);
            return (
              <g
                key={r.key}
                role="button"
                tabIndex={0}
                aria-label={`${r.fullLabel}: ${r.count} observations`}
                onClick={() => onSelect(r.key)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(r.key)}
                className="cursor-pointer outline-none focus-visible:opacity-100"
              >
                <path
                  d={sector(INNER, r1, a0, a1)}
                  fill={r.fill}
                  opacity={r.count ? (dim ? 0.28 : 0.92) : 0.14}
                  stroke={selected === r.key ? "#123F34" : "none"}
                  strokeWidth={selected === r.key ? 1.5 : 0}
                  style={{ transition: "opacity 300ms ease, d 500ms ease" }}
                />
                {r.count > 0 && (
                  <text x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" className="font-plex" fontSize="11" fontWeight="700" fill="#F7F8F5">
                    {r.count}
                  </text>
                )}
                <title>{`${r.fullLabel} — ${r.count} observation${r.count === 1 ? "" : "s"}`}</title>
              </g>
            );
          })}

          {/* outer labels */}
          {rows.map((r, i) => {
            const mid = i * 45 - 90 + 22.5;
            const [x, y] = polar(LABEL_R, mid);
            const flip = mid > 90 || mid < -90;
            return (
              <text
                key={r.key}
                x={x}
                y={y}
                textAnchor={Math.abs(mid - -90) < 1 ? "middle" : flip ? "end" : "start"}
                dominantBaseline="middle"
                fontSize="8.5"
                fontWeight="700"
                fill={selected === r.key ? "#123F34" : "#657670"}
                style={{ transition: "fill 300ms ease" }}
              >
                {r.label}
              </text>
            );
          })}
        </svg>

        {/* center display */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="relative inline-grid place-items-center">
              <span key={pulseKey} className="signal-pulse-ring absolute inset-0 rounded-full" aria-hidden="true" />
              <div>
                <div className="text-[9px] font-bold tracking-[0.22em] text-ri-slate">CANADA LIVE</div>
                <div className="mt-1 text-4xl font-extrabold tabular-nums text-ri-forest">{total}</div>
                <div className="text-[10px] font-bold text-ri-slate">observation{total === 1 ? "" : "s"} · {periodLabel(days)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {refreshedAt && (
        <p className="mt-2 text-center font-plex text-[11px] text-ri-slate">Feed refreshed {refreshedAt} — updates only when new verified records are collected.</p>
      )}

      {/* category legend — mirrors segment selection for touch and screen readers */}
      <ul className="mt-4 grid grid-cols-2 gap-1.5">
        {rows.map((r) => (
          <li key={r.key}>
            <button
              onClick={() => onSelect(r.key)}
              className={`w-full rounded-xl border px-2.5 py-2 text-left text-xs font-semibold transition-colors ${selected === r.key ? "border-ri-forest bg-ri-mint/60 text-ri-charcoal" : "border-si-line bg-white text-ri-charcoal hover:border-ri-emerald"}`}
            >
              <span className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: r.count ? r.fill : "#CBD5D1" }} />
                  {r.label}
                </span>
                <span className="tabular-nums text-ri-slate">{r.count}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      {total === 0 && (
        <p className="mt-3 rounded-xl bg-ri-mint/40 border border-si-line px-3.5 py-2.5 text-xs text-ri-slate">
          No verified observations match this selection yet. {data.empty_note || ""} Try a wider window or fewer filters — segments stay flat rather than estimating.
        </p>
      )}
    </div>
  );
}