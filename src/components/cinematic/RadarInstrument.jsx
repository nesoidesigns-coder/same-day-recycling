import { useMemo } from "react";
import { LIVE_CATEGORIES, DEMAND_TYPE_LABELS } from "@/lib/liveCategories";

// The Canadian Service Radar — the Live Intelligence centrepiece instrument.
// A precision multi-layer circular display, every ring measured and labelled:
//   dial          — hairline rings, minute ticks, slow orbital elements
//   sectors       — observed demand by service category (record counts)
//   evidence ring — record types, kept separate (search interest never blended)
//   geography ring— cities where records resolved with confidence
//   core arcs     — verified opportunities · contractor supply
//   core display  — the national (or focused) observation count
// Nothing is estimated: zero observations render as quiet stub sectors,
// missing data reads "Collecting observations", and no counter ever animates
// to imply activity that has not occurred.

export const KEYS = Object.keys(LIVE_CATEGORIES);

const SHORT = {
  furniture_appliance_removal: "Furniture",
  moving_downsizing: "Moving",
  renovation_construction_debris: "Construction",
  property_management_turnover: "Property",
  recycling_specialty_disposal: "Recycling",
  commercial_office_cleanouts: "Commercial",
  urgent_same_day: "Same-Day",
  donation_reuse_circular: "Donation",
};

// Cinematic category family: luminous cyan → arctic blue → restrained violet.
const COLORS = {
  furniture_appliance_removal: "#22D3EE",
  moving_downsizing: "#7DD3FC",
  renovation_construction_debris: "#60A5FA",
  property_management_turnover: "#818CF8",
  recycling_specialty_disposal: "#38BDF8",
  commercial_office_cleanouts: "#93C5FD",
  urgent_same_day: "#A78BFA",
  donation_reuse_circular: "#C4B5FD",
};

const TYPE_COLORS = {
  observed_public_request: "#22D3EE",
  platform_inquiry: "#60A5FA",
  confirmed_booking: "#34D399",
  qualified_opportunity: "#F6A000",
  search_interest: "#A78BFA",
  market_indicator: "#7DD3FC",
  unknown: "#64748B",
};

export const periodLabel = (days) =>
  ({ 7: "7-day window", 30: "30-day window", 90: "90-day window", 365: "12-month window" }[days] || `${days}-day window`);

// One shared derivation for the instrument, the floating indicators and the
// category chips — a single source of truth per render.
export function deriveModel(data) {
  const rows = KEYS.map((key) => {
    const row = (data?.rows || []).find((r) => r.key === key);
    return { key, label: SHORT[key], fullLabel: LIVE_CATEGORIES[key], count: row?.count || 0, types: row?.demand_types || {}, fill: COLORS[key] };
  });
  const max = Math.max(1, ...rows.map((r) => r.count));
  const typeAgg = {};
  rows.forEach((r) => Object.entries(r.types).forEach(([t, n]) => (typeAgg[t] = (typeAgg[t] || 0) + n)));
  const typeTotal = Math.max(1, Object.values(typeAgg).reduce((a, b) => a + b, 0));
  const cityList = (data?.cities || []).slice(0, 8);
  const cityMax = Math.max(1, ...cityList.map((c) => c.count));
  const qualified = Object.entries(typeAgg).reduce((a, [t, n]) => a + (t === "qualified_opportunity" ? n : 0), 0);
  const total = data?.total || 0;
  const nowMonth = new Date().toISOString().slice(0, 7);
  const complete = (data?.trend || []).filter((t) => t.month < nowMonth);
  const prev = complete[complete.length - 2];
  const last = complete[complete.length - 1];
  const change = prev && last ? { prev: prev.month, last: last.month, delta: last.count - prev.count } : null;
  const sources = Object.keys(data?.by_source || {}).length;
  return { rows, max, typeAgg, typeTotal, cityList, cityMax, qualified, total, change, sources };
}

const C = 260;
const polar = (r, deg) => {
  const a = (deg * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
const ringSector = (r0, r1, a0, a1) => {
  const [x0, y0] = polar(r1, a0);
  const [x1, y1] = polar(r1, a1);
  const [x2, y2] = polar(r0, a1);
  const [x3, y3] = polar(r0, a0);
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r1} ${r1} 0 0 1 ${x1.toFixed(2)} ${y1.toFixed(2)} L ${x2.toFixed(2)} ${y2.toFixed(2)} A ${r0} ${r0} 0 0 0 ${x3.toFixed(2)} ${y3.toFixed(2)} Z`;
};

export default function RadarInstrument({ data, loading, error, selected, onSelect, days = 30, coverage = null, onCityClick, pulseKey = 0 }) {
  const { rows, max, typeAgg, typeTotal, cityList, cityMax, qualified, total, change } = useMemo(() => deriveModel(data), [data]);
  const supplyShare = coverage && coverage.monitored > 0 ? coverage.verified / coverage.monitored : null;

  const coreTitle = selected ? LIVE_CATEGORIES[selected] : "Canada Live";
  const coreValue = selected ? (rows.find((r) => r.key === selected)?.count ?? 0) : total;
  const coreStatus = loading ? "Calibrating instrument" : error ? "Signal unavailable" : total === 0 ? "Collecting observations" : periodLabel(days);
  const coreNote = loading
    ? "connecting to verified records"
    : error
      ? "the feed reconnects on refresh"
      : total === 0
        ? "no verified signals in this period"
        : selected
          ? "observations in this category"
          : "demand records observed";

  const evidenceArcs = Object.entries(typeAgg)
    .sort((a, b) => b[1] - a[1])
    .reduce(({ arcs, start }, [type, n]) => {
      const span = (n / typeTotal) * 360;
      arcs.push({ type, n, a0: start - 90 + 1, a1: start - 90 + Math.max(3, span - 1) });
      return { arcs, start: start + span };
    }, { arcs: [], start: 0 }).arcs;

  return (
    <div className="relative mx-auto w-full max-w-[540px]">
      <svg viewBox="0 0 520 520" className="block w-full" role="group" aria-label="Canadian Service Radar — multi-layer intelligence instrument">
        <defs>
          <radialGradient id="rad-ambient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.14" />
            <stop offset="45%" stopColor="#1E6FA8" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="rad-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#0E2A44" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#0A1524" stopOpacity="0.96" />
          </radialGradient>
        </defs>

        {/* ambient bloom — one soft cyan halo, never neon */}
        <circle cx={C} cy={C} r={246} fill="url(#rad-ambient)" />

        {/* dial: hairline rings, minute ticks, cardinal spokes */}
        <g className="radar-in" aria-hidden="true">
          <circle cx={C} cy={C} r={246} fill="none" stroke="#4A76A5" strokeOpacity="0.3" strokeWidth="1" className="cine-draw" />
          <circle cx={C} cy={C} r={236} fill="none" stroke="#4A76A5" strokeOpacity="0.12" strokeWidth="0.75" />
          {Array.from({ length: 72 }, (_, i) => {
            const deg = i * 5;
            const major = i % 3 === 0;
            const [x1, y1] = polar(major ? 234 : 239, deg);
            const [x2, y2] = polar(246, deg);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7DD3FC" strokeOpacity={major ? 0.38 : 0.14} strokeWidth="0.75" />;
          })}
          {Array.from({ length: 8 }, (_, i) => {
            const [x1, y1] = polar(112, i * 45 - 90);
            const [x2, y2] = polar(168, i * 45 - 90);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4A76A5" strokeOpacity="0.12" strokeWidth="0.75" />;
          })}
        </g>

        {/* orbital elements — two slow drift dots inside the dial zone */}
        <g className="orb-slow" aria-hidden="true">
          <circle cx={polar(242, 30)[0]} cy={polar(242, 30)[1]} r={7} fill="#22D3EE" opacity="0.08" />
          <circle cx={polar(242, 30)[0]} cy={polar(242, 30)[1]} r={2} fill="#22D3EE" opacity="0.85" />
        </g>
        <g className="orb-fast" aria-hidden="true">
          <circle cx={polar(230, 150)[0]} cy={polar(230, 150)[1]} r={6} fill="#A78BFA" opacity="0.08" />
          <circle cx={polar(230, 150)[0]} cy={polar(230, 150)[1]} r={1.6} fill="#A78BFA" opacity="0.8" />
        </g>

        {/* category sectors — the observed-demand ring */}
        <g className="radar-in" style={{ animationDelay: "150ms" }}>
          {rows.map((r, i) => {
            const a0 = i * 45 - 90 + 3;
            const a1 = i * 45 - 90 + 42;
            const r1 = r.count ? 170 + (r.count / max) * 58 : 178;
            const dim = selected && selected !== r.key;
            const active = selected === r.key;
            return (
              <g key={r.key}>
                {r.count ? (
                  <path
                    d={ringSector(170, r1, a0, a1)}
                    fill={r.fill}
                    opacity={active ? 1 : dim ? 0.14 : 0.85}
                    stroke={active ? "#22D3EE" : "none"}
                    strokeWidth={active ? 1.5 : 0}
                    className="cursor-pointer outline-none transition-opacity duration-500"
                    role="button"
                    tabIndex={0}
                    aria-label={`${r.fullLabel}: ${r.count} observation${r.count === 1 ? "" : "s"}`}
                    onClick={() => onSelect(r.key)}
                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(r.key)}
                  >
                    <title>{`${r.fullLabel} — ${r.count} observation${r.count === 1 ? "" : "s"} · select to focus`}</title>
                  </path>
                ) : (
                  <path
                    d={ringSector(170, 178, a0, a1)}
                    fill="none"
                    stroke="#7DD3FC"
                    strokeOpacity="0.12"
                    strokeWidth="0.75"
                    strokeDasharray="2 4"
                    className="pointer-events-none"
                    aria-label={`${r.fullLabel}: no verified observations`}
                  />
                )}
                {r.count > 0 && r1 - 170 >= 26 && (
                  <text
                    x={polar(170 + (r1 - 170) / 2, i * 45 - 90 + 22.5)[0]}
                    y={polar(170 + (r1 - 170) / 2, i * 45 - 90 + 22.5)[1]}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="10.5"
                    fontWeight="700"
                    fill="#06121F"
                    opacity={dim ? 0.3 : 0.85}
                    className="font-plex pointer-events-none"
                  >
                    {r.count}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* evidence ring — record types, kept separate */}
        <g className="radar-in" style={{ animationDelay: "300ms" }}>
          {evidenceArcs.length ? (
            evidenceArcs.map((s) => (
              <path key={s.type} d={ringSector(146, 162, s.a0, s.a1)} fill={TYPE_COLORS[s.type] || TYPE_COLORS.unknown} opacity="0.8">
                <title>{`${DEMAND_TYPE_LABELS[s.type] || s.type}: ${s.n} record${s.n === 1 ? "" : "s"} (${Math.round((s.n / typeTotal) * 100)}% of window)`}</title>
              </path>
            ))
          ) : (
            <circle cx={C} cy={C} r={154} fill="none" stroke="#4A76A5" strokeOpacity="0.12" strokeWidth="0.75" strokeDasharray="2 5" />
          )}
        </g>

        {/* geography ring — cities where records resolved */}
        <g className="radar-in" style={{ animationDelay: "450ms" }}>
          <circle cx={C} cy={C} r={124} fill="none" stroke="#4A76A5" strokeOpacity="0.16" strokeWidth="0.75" strokeDasharray="2 6" />
          {cityList.map((c, i) => {
            const mid = i * (360 / cityList.length) - 90;
            const [x, y] = polar(124, mid);
            const share = c.count / cityMax;
            return (
              <g key={c.city} className="cursor-pointer" onClick={() => onCityClick?.(c.city)}>
                <circle cx={x} cy={y} r={3 + share * 4} fill="#22D3EE" fillOpacity={0.25 + share * 0.65}>
                  <title>{`${c.city}: ${c.count} record${c.count === 1 ? "" : "s"} — select to focus this city`}</title>
                </circle>
                <text x={x} y={y - 9} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#A9C4DE" className="font-plex pointer-events-none">
                  {c.city.length > 10 ? c.city.slice(0, 9) + "…" : c.city}
                </text>
              </g>
            );
          })}
        </g>

        {/* core arcs — verified opportunities & contractor supply */}
        <g className="radar-in" style={{ animationDelay: "600ms" }}>
          <circle cx={C} cy={C} r={72} fill="url(#rad-core)" />
          <circle cx={C} cy={C} r={72} fill="none" stroke="#4A76A5" strokeOpacity="0.25" strokeWidth="0.75" />
          <circle cx={C} cy={C} r={102} fill="none" stroke="#4A76A5" strokeOpacity="0.12" strokeWidth="4" strokeLinecap="round" />
          {qualified > 0 && (
            <path d={ringSector(98, 106, 60, 60 + Math.min(330, (qualified / Math.max(1, total)) * 330))} fill="#F6A000" opacity="0.85">
              <title>{`Verified opportunities: ${qualified} of ${total} window records`}</title>
            </path>
          )}
          <circle cx={C} cy={C} r={88} fill="none" stroke="#4A76A5" strokeOpacity="0.12" strokeWidth="4" strokeLinecap="round" />
          {supplyShare != null && (
            <path d={ringSector(84, 92, 60, 60 + Math.max(6, supplyShare * 330))} fill="#7DD3FC" opacity="0.85">
              <title>{`Contractor supply: ${coverage.verified} of ${coverage.monitored} monitored cities verified`}</title>
            </path>
          )}
        </g>
      </svg>

      {/* central national display */}
      <div className="pointer-events-none absolute inset-0 grid place-items-center">
        <div className="relative text-center">
          <span key={pulseKey} className="cine-pulse-ring absolute -inset-6 rounded-full" aria-hidden="true" />
          <div className="font-plex text-[9px] font-bold uppercase tracking-[0.3em] text-cine-cyan/90">{coreTitle}</div>
          <div className={`mt-1.5 text-4xl font-extrabold sm:text-5xl ${coreValue ? "tabular-nums text-cine-ink" : "text-cine-muted"}`}>
            {coreValue || "—"}
          </div>
          <div className="mt-1 font-plex text-[9px] uppercase tracking-[0.18em] text-cine-muted">{coreStatus}</div>
          <div className="text-[9px] text-cine-muted/70">{coreNote}</div>
        </div>
      </div>
    </div>
  );
}