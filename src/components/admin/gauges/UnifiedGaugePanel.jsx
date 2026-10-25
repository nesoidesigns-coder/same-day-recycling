import SpeedometerGauge, { speedoStatus } from "@/components/admin/gauges/SpeedometerGauge";

const barColor = (status) => (status === "bad" ? "bg-li-red" : status === "warn" ? "bg-li-amber" : "bg-li-btn");

const fmt = (g) => (g.display != null ? g.display : `${Math.round(Number(g.value) || 0)}${g.unit || ""}`);

// One reading inside the unified gauge: label, value, scale bar and context.
function ReadingRow({ g }) {
  const status = speedoStatus(Number(g.value) || 0, g.target, g.warning);
  const frac = Math.max(0, Math.min(1, (Number(g.value) || 0) / (Number(g.max) || 1)));
  return (
    <div className="py-2.5 border-b border-li-steel/50" title={g.tooltip || undefined}>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-li-carbon">{g.label}</span>
        <span className="font-plex text-sm font-bold text-li-carbon whitespace-nowrap">{fmt(g)}</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-li-steel/60 overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor(status)} transition-all duration-700 motion-reduce:transition-none`}
          style={{ width: `${Math.round(frac * 100)}%` }}
        />
      </div>
      <div className="font-plex mt-1 text-[11px] text-li-slate leading-snug">
        {g.target != null ? `target ${g.target}${g.unit || ""} · ` : ""}
        {g.sub}
      </div>
    </div>
  );
}

// Large stat block flanking the hero gauge.
function StatBlock({ g }) {
  return (
    <div className="rounded-xl border border-li-steel/60 bg-li-cloud/70 px-4 py-3" title={g.tooltip || undefined}>
      <div className="text-[11px] font-semibold text-li-slate">{g.label}</div>
      <div className="font-plex text-2xl font-bold text-li-carbon mt-0.5 break-words">{fmt(g)}</div>
      {g.sub && <div className="font-plex text-[11px] text-li-slate mt-0.5 leading-snug">{g.sub}</div>}
    </div>
  );
}

// The single big admin instrument: one panel, one hero gauge, every reading
// from the BI layer visible inside it — nothing collapsed or scattered.
export default function UnifiedGaugePanel({ sections }) {
  const [signal, ...rest] = sections;
  const hero = signal.gauges.find((g) => g.unit === "%") || signal.gauges[0];
  const stats = signal.gauges.filter((g) => g !== hero);

  return (
    <div className="rounded-[20px] border border-li-steel bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 border-b border-li-steel/70 bg-li-pale/60">
        <span className="font-plex text-xs font-semibold uppercase tracking-[0.15em] text-li-slate">{signal.title}</span>
        <span className="font-plex text-[11px] text-li-slate">One instrument · every reading inside</span>
      </div>

      <div className="px-5 pt-5 pb-3 border-b border-li-steel/70">
        <div className="grid md:grid-cols-[1fr_minmax(300px,400px)_1fr] items-center gap-4">
          <div className="space-y-3">{stats.slice(0, 2).map((g) => <StatBlock key={g.label} g={g} />)}</div>
          <div className="w-full max-w-md mx-auto">
            <SpeedometerGauge
              value={hero.value}
              min={hero.min ?? 0}
              max={hero.max}
              unit={hero.unit}
              target={hero.target}
              warning={hero.warning}
              display={hero.display}
            />
            {hero.sub && <p className="font-plex mt-1 text-[11px] text-li-slate text-center leading-snug">{hero.sub}</p>}
          </div>
          <div className="space-y-3">{stats.slice(2).map((g) => <StatBlock key={g.label} g={g} />)}</div>
        </div>
      </div>

      <div className="px-5 pb-5 pt-1">
        {rest.map((section) => (
          <div key={section.title} className="mt-5 first:mt-3">
            <h4 className="font-plex text-[11px] font-semibold uppercase tracking-[0.16em] text-li-slate mb-1">{section.title}</h4>
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-x-8">
              {section.gauges.map((g) => <ReadingRow key={g.label} g={g} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}