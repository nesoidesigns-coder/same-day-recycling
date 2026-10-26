import { useMemo } from "react";
import { LIVE_CATEGORIES, DEMAND_TYPE_LABELS } from "@/lib/liveCategories";
import OSIntelligenceGauge from "@/components/os/OSIntelligenceGauge";
import { OS_COLORS, CATEGORY_PALETTE, TYPE_COLORS } from "@/components/os/gaugeCore";

// The Canadian Service Radar — the Live Intelligence flagship, now rendered
// through the shared OSIntelligenceGauge family. The visual architecture is
// unchanged (dial, category sectors, evidence ring, geography ring, core
// arcs, central display); the drawing primitives, palette and motion come
// from the master gauge system so every other gauge on the platform shares
// this exact visual DNA.

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

export const periodLabel = (days) =>
  ({ 7: "7-day window", 30: "30-day window", 90: "90-day window", 365: "12-month window" }[days] || `${days}-day window`);

// One shared derivation for the instrument, the floating indicators and the
// category chips — a single source of truth per render.
export function deriveModel(data) {
  const rows = KEYS.map((key, i) => {
    const row = (data?.rows || []).find((r) => r.key === key);
    return { key, label: SHORT[key], fullLabel: LIVE_CATEGORIES[key], count: row?.count || 0, types: row?.demand_types || {}, fill: CATEGORY_PALETTE[i] };
  });
  const max = Math.max(1, ...rows.map((r) => r.count));
  const typeAgg = {};
  rows.forEach((r) => Object.entries(r.types).forEach(([t, n]) => (typeAgg[t] = (typeAgg[t] || 0) + n)));
  const typeTotal = Math.max(1, Object.values(typeAgg).reduce((a, b) => a + b, 0));
  const evidenceArcs = Object.entries(typeAgg)
    .sort((a, b) => b[1] - a[1])
    .reduce(({ arcs, start }, [type, n]) => {
      const span = (n / typeTotal) * 360;
      arcs.push({ type, n, a0: start - 90 + 1, a1: start - 90 + Math.max(3, span - 1) });
      return { arcs, start: start + span };
    }, { arcs: [], start: 0 }).arcs;
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
  return { rows, max, typeAgg, typeTotal, evidenceArcs, cityList, cityMax, qualified, total, change, sources };
}

const R = 246;

export default function RadarInstrument({ data, loading, error, selected, onSelect, days = 30, coverage = null, onCityClick, pulseKey = 0 }) {
  const m = useMemo(() => deriveModel(data), [data]);
  const supplyShare = coverage && coverage.monitored > 0 ? coverage.verified / coverage.monitored : null;

  const coreTitle = selected ? LIVE_CATEGORIES[selected] : "Canada Live";
  const coreValue = selected ? (m.rows.find((r) => r.key === selected)?.count ?? 0) : m.total;
  const coreStatus = loading ? "Calibrating instrument" : error ? "Signal unavailable" : m.total === 0 ? "Collecting observations" : periodLabel(days);
  const coreNote = loading
    ? "connecting to verified records"
    : error
      ? "the feed reconnects on refresh"
      : m.total === 0
        ? "no verified signals in this period"
        : selected
          ? "observations in this category"
          : "demand records observed";

  const layers = useMemo(() => {
    const items = [];
    items.push({ type: "dial", ticks: 72, tickMajorEvery: 3, spokes: [112 / R, 168 / R], draw: true, ringOpacity: 0.3 });
    items.push({ type: "orbital" });
    items.push({
      type: "segments",
      delay: 150,
      onSelect,
      items: m.rows.map((r, i) => {
        const a0 = i * 45 - 90 + 3;
        const a1 = i * 45 - 90 + 42;
        const span = r.count ? (r.count / m.max) * 58 : 8;
        const dim = selected && selected !== r.key;
        return {
          key: r.key,
          r0: 170 / R,
          r1: (170 + span) / R,
          a0,
          a1,
          fill: r.fill,
          opacity: selected === r.key ? 1 : dim ? 0.14 : 0.85,
          selected: selected === r.key,
          dim,
          ghost: !r.count,
          interactive: !!r.count,
          title: r.count ? `${r.fullLabel} — ${r.count} observation${r.count === 1 ? "" : "s"} · select to focus` : `${r.fullLabel}: no verified observations`,
          value: r.count && span >= 26 ? r.count : null,
        };
      }),
    });
    if (m.evidenceArcs.length) {
      items.push({
        type: "segments",
        delay: 300,
        items: m.evidenceArcs.map((s) => ({
          key: s.type,
          r0: 146 / R,
          r1: 162 / R,
          a0: s.a0,
          a1: s.a1,
          fill: TYPE_COLORS[s.type] || TYPE_COLORS.unknown,
          opacity: 0.8,
          title: `${DEMAND_TYPE_LABELS[s.type] || s.type}: ${s.n} record${s.n === 1 ? "" : "s"} (${Math.round((s.n / m.typeTotal) * 100)}% of window)`,
        })),
      });
    } else {
      items.push({ type: "ring", radius: 154 / R, dash: "2 5", opacity: 0.12 });
    }
    items.push({ type: "ring", radius: 124 / R, dash: "2 6", opacity: 0.16 });
    if (m.cityList.length) {
      items.push({
        type: "nodes",
        delay: 450,
        radius: 124 / R,
        items: m.cityList.map((c, i) => ({
          key: c.city,
          angle: i * (360 / m.cityList.length) - 90,
          label: c.city.length > 10 ? c.city.slice(0, 9) + "…" : c.city,
          share: c.count / m.cityMax,
          count: c.count,
          color: OS_COLORS.cyan,
          title: `${c.city}: ${c.count} record${c.count === 1 ? "" : "s"} — select to focus this city`,
        })),
        onSelect: onCityClick,
      });
    }
    items.push({
      type: "arc",
      delay: 600,
      r0: 98 / R,
      r1: 106 / R,
      spanDeg: m.qualified > 0 ? Math.min(330, (m.qualified / Math.max(1, m.total)) * 330) : null,
      color: OS_COLORS.amber,
      title: `Verified opportunities: ${m.qualified} of ${m.total} window records`,
    });
    items.push({
      type: "arc",
      delay: 600,
      r0: 84 / R,
      r1: 92 / R,
      spanDeg: supplyShare != null ? Math.max(6, supplyShare * 330) : null,
      color: OS_COLORS.green,
      title: supplyShare != null ? `Contractor supply: ${coverage.verified} of ${coverage.monitored} monitored cities verified` : "Contractor supply: coverage records loading",
    });
    return items;
  }, [m, selected, onSelect, onCityClick, supplyShare, coverage]);

  return (
    <OSIntelligenceGauge
      size="hero"
      loading={loading}
      error={error}
      center={{ title: coreTitle, value: coreValue, status: coreStatus, note: coreNote }}
      pulseKey={pulseKey}
      layers={layers}
      ariaLabel="Canadian Service Radar — multi-layer intelligence instrument"
    />
  );
}