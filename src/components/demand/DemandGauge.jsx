import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import RingSvg from "@/components/os/DemandRing";
import { CATEGORY_PALETTE } from "@/components/os/gaugeCore";

// Unified Recycling OS demand gauge system.
// One visual language for every demand, capacity and performance metric across
// customer, contractor and admin interfaces. Every gauge states what it
// measures, the actual value and unit, the time period, the data source, when
// it was last updated, how it is calculated, and whether the number is
// verified, estimated, or not yet available. Nothing decorative, nothing
// invented: a gauge with no verified data says so instead of showing zero.

export const DEMAND_PALETTE = CATEGORY_PALETTE;

const STATUS_STYLES = {
  verified: { label: "Verified", cls: "border-li-mint bg-li-mint/10 text-li-forest" },
  estimated: { label: "Estimated", cls: "border-li-amber bg-li-amber/10 text-li-amber" },
  unavailable: { label: "No verified data yet", cls: "border-li-steel bg-li-pale text-li-slate" },
};

export function DemandStatusChip({ status = "verified" }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.verified;
  return <span className={`inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-bold ${s.cls}`}>{s.label}</span>;
}

export function DemandTrendBadge({ direction = "flat", text }) {
  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const cls = direction === "up" ? "text-li-infra" : direction === "down" ? "text-li-red" : "text-li-slate";
  return (
    <span className={`inline-flex shrink-0 items-center gap-0.5 text-xs font-bold ${cls}`}>
      <Icon className="w-3.5 h-3.5" />{text}
    </span>
  );
}

const MetaItem = ({ k, v }) => (
  <span className="inline-flex items-baseline gap-1">
    <span className="font-plex text-[9px] font-semibold uppercase tracking-wider text-li-slate/80">{k}</span>
    <span className="font-plex text-[11px] font-semibold text-li-carbon tabular-nums">{v}</span>
  </span>
);

export function GaugeMeta({ period, source, updatedAt, methodology, status = "verified", compact = false }) {
  const hasFacts = period || source || updatedAt;
  if (!hasFacts && !methodology && compact) return null;
  return (
    <div className={compact ? "mt-3" : "mt-4 border-t border-li-steel/70 pt-2.5"}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <DemandStatusChip status={status} />
        {period && <MetaItem k="Period" v={period} />}
        {source && <MetaItem k="Source" v={source} />}
        {updatedAt && <MetaItem k="Updated" v={updatedAt} />}
      </div>
      {methodology && <p className="mt-1.5 text-[11px] leading-snug text-li-slate">{methodology}</p>}
    </div>
  );
}


function GaugeBars({ segments = [], selected, onSelect, unit }) {
  const total = segments.reduce((s, x) => s + (Number(x.value) || 0), 0);
  return (
    <ul className="space-y-2.5">
      {segments.map((s, i) => {
        const key = s.key ?? s.label;
        const pct = total ? Math.max(2, Math.round(((Number(s.value) || 0) / total) * 100)) : 0;
        const color = s.color || DEMAND_PALETTE[i % DEMAND_PALETTE.length];
        const clickable = typeof onSelect === "function";
        const Row = clickable ? "button" : "div";
        return (
          <li key={key}>
            <Row
              type={clickable ? "button" : undefined}
              onClick={clickable ? () => onSelect(key) : undefined}
              className={`w-full ${clickable ? "cursor-pointer rounded-lg text-left focus:outline-none focus:ring-2 focus:ring-li-mint/40" : ""}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-xs font-semibold truncate ${selected === key ? "text-li-forest" : "text-li-carbon"}`}>{s.label}</span>
                <span className="font-plex shrink-0 text-xs font-semibold text-li-carbon tabular-nums">{s.value}{unit ? ` ${unit}` : ""}</span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-li-pale">
                <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
              </div>
            </Row>
          </li>
        );
      })}
    </ul>
  );
}

// variant: "ring" (large circular) · "mini" (compact tile) · "bar" (horizontal bars)
export default function DemandGauge({
  variant = "ring",
  label,
  value,
  unit = "",
  max,
  period,
  source,
  updatedAt,
  methodology,
  status = "verified",
  segments = [],
  selected,
  onSelect,
  delta,
  centerSub,
  loading = false,
  className = "",
}) {
  const hasSegments = segments.length > 0;
  const unavailable = status === "unavailable" || (!loading && value == null && !hasSegments);
  const effStatus = unavailable ? "unavailable" : status;

  if (variant === "mini") {
    return (
      <div className={`flex items-center gap-3 rounded-[14px] border border-li-steel bg-white p-3.5 ${className}`}>
        <div className="h-14 w-14 shrink-0">
          <RingSvg value={value} max={max} empty={unavailable} loading={loading} unit="" label={label} />
        </div>
        <div className="min-w-0">
          <div className="truncate text-xs font-bold text-li-carbon">{label}</div>
          <div className="font-plex mt-0.5 text-lg font-semibold text-li-forest tabular-nums">
            {loading ? "…" : unavailable ? "—" : `${value}${unit ? ` ${unit}` : ""}`}
          </div>
          {delta && <DemandTrendBadge direction={delta.direction} text={delta.text} />}
        </div>
        <div className="ml-auto shrink-0"><DemandStatusChip status={effStatus} /></div>
      </div>
    );
  }

  if (variant === "bar") {
    return (
      <div className={`rounded-[14px] border border-li-steel bg-white p-4 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-bold text-li-carbon">{label}</h3>
          {delta && <DemandTrendBadge direction={delta.direction} text={delta.text} />}
        </div>
        <div className="mt-3">
          {hasSegments ? (
            <GaugeBars segments={segments} selected={selected} onSelect={onSelect} unit={unit} />
          ) : (
            <GaugeBars segments={[{ label: label || "Value", value: loading ? "…" : unavailable ? 0 : value }]} unit={unit} />
          )}
        </div>
        <GaugeMeta period={period} source={source} updatedAt={updatedAt} methodology={methodology} status={effStatus} compact />
      </div>
    );
  }

  // ring (default): large circular gauge with optional category segments
  return (
    <div className={`rounded-[20px] border border-li-steel bg-white p-5 md:p-6 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-li-carbon">{label}</h3>
        {delta && <DemandTrendBadge direction={delta.direction} text={delta.text} />}
      </div>
      <div className="relative mx-auto mt-4 w-full max-w-[260px]">
        <RingSvg
          value={value} max={max} segments={segments} selected={selected} onSelect={onSelect}
          empty={unavailable} loading={loading} unit={unit} centerSub={centerSub} label={label}
        />
      </div>
      {hasSegments && (
        <div className="mt-4">
          <GaugeBars segments={segments} selected={selected} onSelect={onSelect} unit={unit} />
        </div>
      )}
      <GaugeMeta period={period} source={source} updatedAt={updatedAt} methodology={methodology} status={effStatus} />
    </div>
  );
}