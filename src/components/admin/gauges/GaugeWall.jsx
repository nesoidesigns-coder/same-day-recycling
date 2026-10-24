import GaugeCard from "@/components/admin/gauges/GaugeCard";
import SpeedometerGauge from "@/components/admin/gauges/SpeedometerGauge";

// Scale helpers — every gauge gets a meaningful scale, never an arbitrary ring.
// Counts scale to the next sensible round number above current volume;
// money gauges to the next sensible round number, or the owner's target.

export function countScale(value) {
  const v = Math.max(Number(value) || 0, 0);
  const steps = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 50000];
  return steps.find((s) => s >= v * 1.25) || Math.ceil((v * 1.25) / 50000) * 50000;
}

export function moneyScale(value) {
  const v = Math.max(Number(value) || 0, 0);
  const steps = [100, 250, 500, 1000, 2500, 5000, 10000, 25000, 50000, 100000];
  return steps.find((s) => s >= v * 1.25) || Math.ceil((v * 1.25) / 100000) * 100000;
}

export default function GaugeWall({ gauges, cols = "sm:grid-cols-2 lg:grid-cols-4" }) {
  return (
    <div className={`grid grid-cols-1 ${cols} gap-3`}>
      {gauges.map((g) => (
        <GaugeCard key={g.label} title={g.label} tooltip={g.tooltip} status={g.status}>
          <SpeedometerGauge
            value={g.value}
            min={g.min ?? 0}
            max={g.max}
            unit={g.unit}
            target={g.target}
            warning={g.warning}
            display={g.display}
          />
          {g.sub && <p className="mt-1 text-[11px] text-slate-500 text-center leading-snug">{g.sub}</p>}
        </GaugeCard>
      ))}
    </div>
  );
}