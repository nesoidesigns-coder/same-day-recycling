import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { LIVE_CATEGORIES, DEMAND_TYPE_LABELS } from "@/lib/liveCategories";

// The Canadian Service Radar — the Live Intelligence centrepiece.
// One concentric instrument, every layer measured and labelled:
//   outer ring  — observed demand by service category (record counts)
//   mid ring    — evidence mix (record types, kept separate)
//   inner ring  — geographic distribution (cities with resolved records)
//   core arcs   — verified opportunities · contractor supply
// Nothing is estimated: zero observations render flat, missing data shows
// "Awaiting data", and every layer's definition is one hover or tap away.

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

const LAYER_DEFS = {
  overall: {
    label: "Overall observed demand",
    def: "The count of real demand records matching the current filters — observed public requests, platform inquiries, qualified opportunities and confirmed bookings, each kept separate in the mix ring. Never a percentage of Canadians, never blended with search interest.",
    source: "Platform demand records (DemandSignal), filtered and counted server-side.",
  },
  categories: {
    label: "Category demand",
    def: "Each sector's radial length is that category's record count relative to the largest category in the window. A share-of-observed-records basis — never a national search volume or a score.",
    source: "Market categories assigned by deterministic keyword rules on the same records.",
  },
  evidence: {
    label: "Evidence mix",
    def: "The window's records separated by type. Search interest is a relative-intensity record type and is never merged into request or booking counts.",
    source: "DemandSignal demand_type field, one record per underlying evidence item.",
  },
  geography: {
    label: "Geographic distribution",
    def: "Cities where records resolved with confidence. Marker brightness follows each city's share of the window's located records — unresolved locations are never projected onto a city.",
    source: "Records with exact_city or metro geo confidence only.",
  },
  opportunity: {
    label: "Verified opportunities",
    def: "Records classified as qualified opportunities. Their arc length is the share of the window's total records — a measured fraction, not a forecast.",
    source: "DemandSignal demand_type = qualified_opportunity.",
  },
  supply: {
    label: "Contractor supply",
    def: "The share of monitored cities (verified + matching + recruiting) that currently has a verified contractor on file. From partner territory records only — never assumed.",
    source: "Verified Partner service territories.",
  },
  change: {
    label: "Demand change",
    def: "The difference between the two most recent complete calendar months in the current window, in records. A measured delta — never a trend projection.",
    source: "Monthly counts of the same verified records.",
  },
};

const C = 200;
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
const periodLabel = (days) =>
  ({ 7: "last 7 days", 30: "last 30 days", 90: "last 90 days", 365: "last 12 months" }[days] || `last ${days} days`);

export default function ServiceRadar({ data, loading, error, selected, onSelect, days = 30, coverage = null, onCityClick }) {
  const [pulseKey, setPulseKey] = useState(0);
  const [detail, setDetail] = useState(null);
  const [lockedDetail, setLockedDetail] = useState(null);

  useEffect(() => {
    if (data?.generated_at) setPulseKey((k) => k + 1);
  }, [data?.generated_at]);

  const model = useMemo(() => {
    if (!data) return null;
    const rows = KEYS.map((key) => ({
      key,
      label: SHORT[key],
      fullLabel: LIVE_CATEGORIES[key],
      count: (data.rows || []).find((r) => r.key === key)?.count || 0,
      types: (data.rows || []).find((r) => r.key === key)?.demand_types || {},
      fill: COLORS[key],
    }));
    const max = Math.max(1, ...rows.map((r) => r.count));
    const typeAgg = {};
    rows.forEach((r) => Object.entries(r.types).forEach(([t, n]) => (typeAgg[t] = (typeAgg[t] || 0) + n)));
    const typeTotal = Math.max(1, Object.values(typeAgg).reduce((a, b) => a + b, 0));
    const cityList = (data.cities || []).slice(0, 8);
    const cityMax = Math.max(1, ...cityList.map((c) => c.count));
    const qualified = Object.entries(typeAgg).reduce((a, [t, n]) => a + (t === "qualified_opportunity" ? n : 0), 0);
    const total = Math.max(1, data.total || 0);
    // Change: two most recent complete calendar months in the window.
    const nowMonth = new Date().toISOString().slice(0, 7);
    const complete = (data.trend || []).filter((t) => t.month < nowMonth);
    const prev = complete[complete.length - 2], last = complete[complete.length - 1];
    const change = prev && last ? { prev, last, delta: last.count - prev.count } : null;
    return { rows, max, typeAgg, typeTotal, cityList, cityMax, qualified, total: data.total || 0, change };
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-24 text-sm text-cine-muted">
        <Loader2 className="h-4 w-4 animate-spin" /> Assembling the Canadian Service Radar…
      </div>
    );
  }
  if (error || !data || !model) {
    return (
      <div className="py-16 text-center text-sm text-cine-muted">
        The intelligence feed is unavailable right now. Please try again shortly — nothing here is estimated while it reconnects.
      </div>
    );
  }

  const { rows, max, typeAgg, typeTotal, cityList, cityMax, qualified, total, change } = model;
  const activeDetail = detail || lockedDetail || LAYER_DEFS.overall;
  const dimDetail = (key) => {
    setDetail(LAYER_DEFS[key]);
    setLockedDetail(null);
  };
  const lockDetail = (key) => setLockedDetail(LAYER_DEFS[key]);

  const supplyShare = coverage && coverage.monitored > 0 ? coverage.verified / coverage.monitored : null;

  return (
    <div>
      <div className="relative mx-auto w-full max-w-[420px]">
        <svg viewBox="0 0 400 400" className="block w-full" role="group" aria-label="Canadian Service Radar — concentric intelligence instrument">
          {/* precision hairline + tick halo (very slow idle drift) */}
          <g className="radar-in" style={{ animationDelay: "0ms" }}>
            <circle cx={C} cy={C} r={192} fill="none" stroke="#4A76A5" strokeOpacity="0.25" strokeWidth="0.75" />
            <g className="radar-halo" aria-hidden="true">
              {Array.from({ length: 72 }, (_, i) => {
                const [x1, y1] = polar(184, i * 5);
                const [x2, y2] = polar(i % 6 === 0 ? 190 : 188, i * 5);
                return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7DD3FC" strokeOpacity={i % 6 === 0 ? 0.4 : 0.18} strokeWidth="0.75" />;
              })}
            </g>
          </g>

          {/* overall + category ring */}
          <g className="radar-in" style={{ animationDelay: "150ms" }} onMouseEnter={() => dimDetail("categories")} onMouseLeave={() => setDetail(null)}>
            {rows.map((r, i) => {
              const a0 = i * 45 - 90 + 2.5;
              const a1 = i * 45 - 90 + 42.5;
              const r1 = r.count ? 128 + (r.count / max) * 52 : 132;
              const dim = selected && selected !== r.key;
              return (
                <path
                  key={r.key}
                  d={ringSector(128, r1, a0, a1)}
                  fill={r.fill}
                  opacity={r.count ? (dim ? 0.18 : 0.92) : 0.1}
                  stroke={selected === r.key ? "#22D3EE" : "none"}
                  strokeWidth={selected === r.key ? 1.25 : 0}
                  className="cursor-pointer outline-none transition-opacity duration-300"
                  role="button"
                  tabIndex={0}
                  aria-label={`${r.fullLabel}: ${r.count} observation${r.count === 1 ? "" : "s"}`}
                  onClick={() => onSelect(r.key)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect(r.key)}
                >
                  <title>{`${r.fullLabel} — ${r.count} observation${r.count === 1 ? "" : "s"}`}</title>
                </path>
              );
            })}
          </g>

          {/* evidence mix ring */}
          <g className="radar-in" style={{ animationDelay: "300ms" }} onMouseEnter={() => dimDetail("evidence")} onMouseLeave={() => setDetail(null)}>
            {Object.entries(typeAgg)
              .sort((a, b) => b[1] - a[1])
              .reduce(({ arcs, start }, [type, n]) => {
                const span = (n / typeTotal) * 360;
                arcs.push({ type, n, a0: start - 90 + 1, a1: start - 90 + Math.max(3, span - 1) });
                return { arcs, start: start + span };
              }, { arcs: [], start: 0 })
              .arcs.map((s) => (
                <path key={s.type} d={ringSector(100, 116, s.a0, s.a1)} fill={TYPE_COLORS[s.type] || TYPE_COLORS.unknown} opacity="0.85">
                  <title>{`${DEMAND_TYPE_LABELS[s.type] || s.type}: ${s.n} record${s.n === 1 ? "" : "s"} (${Math.round((s.n / typeTotal) * 100)}% of window)`}</title>
                </path>
              ))}
          </g>

          {/* geographic distribution ring */}
          <g className="radar-in" style={{ animationDelay: "450ms" }} onMouseEnter={() => dimDetail("geography")} onMouseLeave={() => setDetail(null)}>
            {cityList.length ? (
              cityList.map((c, i) => {
                const mid = i * (360 / cityList.length) - 90;
                const [x, y] = polar(82, mid);
                const share = c.count / cityMax;
                return (
                  <g key={c.city} className="cursor-pointer" onClick={() => onCityClick?.(c.city)}>
                    <circle cx={x} cy={y} r={3 + share * 4} fill="#22D3EE" fillOpacity={0.25 + share * 0.65}>
                      <title>{`${c.city}: ${c.count} record${c.count === 1 ? "" : "s"} — select to focus this city`}</title>
                    </circle>
                    <text x={x} y={y - 8} textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#A9C4DE" className="font-plex pointer-events-none">
                      {c.city.length > 10 ? c.city.slice(0, 9) + "…" : c.city}
                    </text>
                  </g>
                );
              })
            ) : (
              <circle cx={C} cy={C} r={82} fill="none" stroke="#4A76A5" strokeOpacity="0.2" strokeWidth="0.75" strokeDasharray="2 5" />
            )}
          </g>

          {/* core thin arcs: opportunities + supply */}
          <g className="radar-in" style={{ animationDelay: "600ms" }}>
            <circle cx={C} cy={C} r={72} fill="none" stroke="#4A76A5" strokeOpacity="0.18" strokeWidth="2.5" strokeLinecap="round" />
            {qualified > 0 && (
              <path d={ringSector(68, 76, 60, 60 + Math.min(330, (qualified / total) * 330))} fill="#F6A000" opacity="0.9" onMouseEnter={() => dimDetail("opportunity")} onMouseLeave={() => setDetail(null)}>
                <title>{`Verified opportunities: ${qualified} of ${total} window records`}</title>
              </path>
            )}
            <circle cx={C} cy={C} r={62} fill="none" stroke="#4A76A5" strokeOpacity="0.18" strokeWidth="2.5" strokeLinecap="round" />
            {supplyShare != null && (
              <path d={ringSector(58, 66, 60, 60 + Math.max(6, supplyShare * 330))} fill="#7DD3FC" opacity="0.9" onMouseEnter={() => dimDetail("supply")} onMouseLeave={() => setDetail(null)}>
                <title>{`Contractor supply: ${coverage.verified} of ${coverage.monitored} monitored cities verified`}</title>
              </path>
            )}
            {/* change tick at the top */}
            <g onMouseEnter={() => dimDetail("change")} onMouseLeave={() => setDetail(null)}>
              {change && (
                <text x={C} y={40} textAnchor="middle" fontSize="9" fontWeight="700" className="font-plex" fill={change.delta >= 0 ? "#34D399" : "#F6A000"}>
                  {change.delta >= 0 ? "▲" : "▼"} {Math.abs(change.delta)} · {change.prev.month.slice(2)}→{change.last.month.slice(2)}
                </text>
              )}
            </g>
          </g>
        </svg>

        {/* core display */}
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <div className="relative inline-grid place-items-center">
              <span key={pulseKey} className="cine-pulse-ring absolute inset-0 rounded-full" aria-hidden="true" />
              <div>
                <div className="font-plex text-[9px] font-bold uppercase tracking-[0.3em] text-cine-muted">
                  {selected ? LIVE_CATEGORIES[selected] : "Canada Live"}
                </div>
                {total === 0 ? (
                  <div className="mt-1 text-3xl font-extrabold text-cine-muted">—</div>
                ) : (
                  <div className="mt-1 text-5xl font-extrabold tabular-nums text-cine-ink">
                    {selected ? (rows.find((r) => r.key === selected)?.count ?? 0) : total}
                  </div>
                )}
                <div className="mt-0.5 font-plex text-[10px] text-cine-muted">
                  {total === 0 ? "Insufficient observations" : `${selected ? "observations" : "records"} · ${periodLabel(days)}`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* layer legend — clickable, keeps every metric one tap from its definition */}
      <ul className="mt-5 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {Object.entries(LAYER_DEFS).map(([key, def]) => (
          <li key={key}>
            <button
              onClick={() => (lockedDetail === def ? (setLockedDetail(null), setDetail(null)) : lockDetail(key))}
              onMouseEnter={() => dimDetail(key)}
              onMouseLeave={() => setDetail(null)}
              className={`w-full rounded-xl border px-2.5 py-2 text-left text-[11px] font-bold transition-colors ${
                activeDetail === def ? "border-cine-cyan/60 bg-cine-cyan/10 text-cine-cyan" : "border-cine-line/60 bg-cine-surface/40 text-cine-muted hover:border-cine-cyan/40"
              }`}
            >
              {def.label}
            </button>
          </li>
        ))}
      </ul>

      {/* metric definition panel — hover or tap reveals precise definitions */}
      <div className="mt-3 rounded-2xl border border-cine-line/60 bg-cine-surface/60 p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-bold text-cine-ink">{activeDetail.label}</div>
          <div className="font-plex text-[10px] text-cine-muted">{activeDetail.source}</div>
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-cine-muted">{activeDetail.def}</p>
      </div>

      {/* category chips — swipeable on mobile */}
      <div className="mt-4 flex snap-x gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => onSelect("")}
          className={`shrink-0 snap-start rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${!selected ? "bg-cine-cyan text-[#0a1220]" : "border border-cine-line/70 text-cine-ink hover:border-cine-cyan/50"}`}
        >
          All categories
        </button>
        {rows.map((r) => (
          <button
            key={r.key}
            onClick={() => onSelect(r.key)}
            className={`shrink-0 snap-start rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${selected === r.key ? "bg-cine-cyan text-[#0a1220]" : "border border-cine-line/70 text-cine-ink hover:border-cine-cyan/50"}`}
          >
            <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: r.count ? r.fill : "#3A4A63" }} />
            {r.label} <span className="tabular-nums opacity-70">{r.count}</span>
          </button>
        ))}
      </div>

      {total === 0 && (
        <p className="mt-3 rounded-xl border border-cine-line/60 bg-cine-surface/40 px-3.5 py-2.5 text-xs text-cine-muted">
          No verified observations match this selection yet. {data.empty_note || ""} Try a wider window or fewer filters — the radar stays quiet rather than estimating.
        </p>
      )}

      {data.generated_at && (
        <p className="mt-3 text-center font-plex text-[10px] text-cine-muted">
          Feed refreshed {new Date(data.generated_at).toLocaleString("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} — updates only when new verified records are collected.
        </p>
      )}
    </div>
  );
}