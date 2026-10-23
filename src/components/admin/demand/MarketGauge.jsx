import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import PulseRing, { formatCount, useCountUp, prefersReducedMotion } from "@/components/sdr/pulse/PulseRing";

const fmt = (v) => v === null || v === undefined ? '—' : Number(v).toLocaleString('en-CA');

// Subtle demand-direction indicator: rising / falling / stable, from the
// background month-over-month comparison. Never animated for effect.
function directionChip(mom) {
  if (mom === null || mom === undefined || !Number.isFinite(Number(mom))) return null;
  const v = Number(mom);
  const d = v > 0.5
    ? { icon: TrendingUp, text: 'Rising', cls: 'border-[#54D9AE]/40 bg-[#54D9AE]/10 text-[#54D9AE]' }
    : v < -0.5
      ? { icon: TrendingDown, text: 'Falling', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' }
      : { icon: Minus, text: 'Stable', cls: 'border-market-line bg-white/5 text-market-muted' };
  return <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${d.cls}`}><d.icon className="h-3 w-3" />{d.text}</span>;
}

// Geography level badge — national estimates are visually distinct from
// provincial/city aggregates (emerald ring + badge vs mint).
const LEVEL_BADGE = {
  national: { text: 'National level', cls: 'border-[#54D9AE]/40 bg-[#54D9AE]/10 text-[#54D9AE]' },
  province: { text: 'Provincial level', cls: 'border-market-line bg-white/5 text-market-muted' },
  city: { text: 'City level', cls: 'border-market-line bg-white/5 text-market-muted' },
};

// Measure badge — rolling averages never share a ring with monthly volumes.
function measureBadge(measure) {
  const m = String(measure || '');
  if (/rolling/i.test(m)) return { text: 'Rolling average', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' };
  if (/monthly/i.test(m)) return { text: 'Monthly volume', cls: 'border-[#54D9AE]/40 bg-[#54D9AE]/10 text-[#54D9AE]' };
  return { text: 'Basis not specified', cls: 'border-market-line bg-white/5 text-market-muted' };
}

export default function MarketGauge({ label, metric, change = false, level = null }) {
  const available = change ? (metric.mom_pct !== null && metric.mom_pct !== undefined) : !!metric.available;
  const animate = !prefersReducedMotion();
  const display = useCountUp(available && !change ? metric.value : 0, { animate });
  const palette = level === 'national' ? 'emerald' : 'mint';
  const levelBadge = level ? LEVEL_BADGE[level] : null;
  const measure = change
    ? { text: 'Month-over-month', cls: 'border-amber-400/40 bg-amber-400/10 text-amber-300' }
    : measureBadge(metric.measure);

  return (
    <article className="rounded-2xl border border-market-line bg-market-surface p-5 text-market-ink">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="min-h-10 text-sm font-bold">{label}</h3>
        {levelBadge && (
          <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${levelBadge.cls}`}>
            {levelBadge.text}
          </span>
        )}
      </div>
      <div className="my-4 flex justify-center">
        <PulseRing value={available && !change ? metric.value : 1} size={128} thickness={9} kind="activity" palette={palette} spin={false}>
          {available ? (
            <>
              <span className="text-xl font-extrabold tabular-nums text-market-ink inline-flex items-center gap-1">
                {change && directionChip(metric.mom_pct)}
                {change ? `${metric.mom_pct > 0 ? '+' : ''}${fmt(metric.mom_pct)}%` : formatCount(display)}
              </span>
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-market-muted">
                {change ? 'vs prior month' : 'searches/mo'}
              </span>
            </>
          ) : (
            <>
              <span className="text-lg font-bold text-market-muted">—</span>
              <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-market-muted">pending</span>
            </>
          )}
        </PulseRing>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${measure.cls}`}>{measure.text}</span>
        {!change && directionChip(metric.mom_pct)}
        {!change && metric.omitted_measures > 0 && (
          <span className="text-[10px] text-market-muted">
            {metric.omitted_measures} record{metric.omitted_measures === 1 ? '' : 's'} kept separate (different measure)
          </span>
        )}
      </div>
      <dl className="mt-3 space-y-1 text-xs leading-relaxed text-market-muted">
        <div><dt className="inline">Type: </dt><dd className="inline">{change ? 'Calculated from comparable estimates' : metric.classification || 'Estimated'}</dd></div>
        <div><dt className="inline">Scope: </dt><dd className="inline">{metric.scope}</dd></div>
        <div><dt className="inline">Period: </dt><dd className="inline">{metric.period || 'Unavailable'}{change && metric.previous_period ? ` vs ${metric.previous_period}` : ''}</dd></div>
        {metric.engines?.length > 0 && <div>Engine: {metric.engines.join(' · ')}</div>}
        {metric.reporting_windows?.length > 0 && <div>Reporting window: {metric.reporting_windows.join(' · ')}</div>}
        <div><dt className="inline">Source: </dt><dd className="inline">{metric.sources?.join(' · ') || 'Historical observations not yet loaded for this scope'}</dd></div>
        {metric.source_urls?.filter((url) => /^https:\/\//.test(url)).map((url) => <div key={url}><a href={url} target="_blank" rel="noreferrer" className="text-market-accent underline">Original source report</a></div>)}
        {metric.updated && <div>Retrieved: {metric.refreshed_at || metric.updated}</div>}
      </dl>
      {change && <p className="mt-2 text-xs text-market-muted">{metric.change_note}</p>}
      {!change && metric.included_in_overview === false && metric.available && <p className="mt-2 text-xs text-market-muted">Latest available for this category; excluded from the overview total because its period or measure differs.</p>}
      <p className="mt-3 text-[11px] text-market-muted">Ring is a status indicator, not market share.</p>
    </article>
  );
}