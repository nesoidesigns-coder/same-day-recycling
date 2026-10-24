import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, CalendarDays, Database, Clock3, Wifi, Scale, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CircularGauge from './CircularGauge';

const fmt = (n) => (n === null || n === undefined ? '—' : Number(n).toLocaleString('en-CA'));
const periodLabel = (p) => (p ? new Date(`${p}-01T00:00:00Z`).toLocaleDateString('en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : '—');

const MetaRow = ({ icon: Icon, label, value }) => (
  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px]">
    <span className="inline-flex items-center gap-1 font-bold text-market-muted"><Icon className="h-3 w-3 text-market-accent" />{label}:</span>
    <span className="text-market-ink">{value}</span>
  </div>
);

// Gauge 1 — Canadian National Search Demand across the services industry at
// large. Two verified modes:
//   volume   = Keyword Planner / published monthly search-volume estimates
//              (gauge: total verified searches/month).
//   momentum = the live query feed (verified Google Trends exports, index
//              0-100): the gauge shows average month-over-month momentum
//              across ALL live services-industry queries, and the live
//              queries themselves are showcased beneath the gauge.
// Trends indexes are never converted into volumes; missing data stays neutral.
export default function SearchDemandGauge({ data }) {
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState('all');

  const categories = (data?.categories || []).filter((c) => c.available && Number.isFinite(c.value));

  // Per-category exploration: the reporting engine filters verified
  // observations by service category — never estimated client-side.
  const catQuery = useQuery({
    queryKey: ['marketObservatory', 'category', category],
    queryFn: async () => (await base44.functions.invoke('demandReport', { view: 'command', filters: { engine: 'google', category } })).data,
    enabled: category !== 'all',
    staleTime: 60000, refetchInterval: 900000, retry: false,
  });
  const source = category === 'all' ? data : catQuery.data;

  const overview = source?.overview || {};
  const liveQueries = (source?.trends || []).filter((t) => Number.isFinite(t.value));
  const momentumQueries = liveQueries.filter((t) => Number.isFinite(t.change_points));
  const mode = overview.available ? 'volume' : momentumQueries.length ? 'momentum' : 'neutral';
  const selectedLabel = category === 'all' ? 'All services-industry queries' : ((categories.find((c) => c.category === category)?.label) || category);

  // Momentum math: average MoM index change across every live query in scope,
  // with the strongest single-query movement as the documented ring scale.
  const avgMomentum = momentumQueries.length
    ? Math.round((momentumQueries.reduce((n, t) => n + t.change_points, 0) / momentumQueries.length) * 10) / 10
    : null;
  const strongestQuery = momentumQueries.slice().sort((a, b) => b.change_points - a.change_points)[0] || null;
  const risingCount = momentumQueries.filter((t) => t.change_points > 0).length;
  const fallingCount = momentumQueries.filter((t) => t.change_points < 0).length;
  const latestPeriod = liveQueries.map((t) => t.period).filter(Boolean).sort().at(-1) || null;

  const pickCategory = (value) => {
    setCategory(value);
    try {
      base44.analytics.track({ eventName: 'gauge_interaction', properties: { gauge: 'national_search_demand', category: value } });
    } catch { /* analytics must never block the gauge */ }
  };

  const loading = category !== 'all' && catQuery.isPending;
  const showNeutral = !loading && (mode === 'neutral' || (category !== 'all' && catQuery.isError));

  // Showcase the live queries themselves: newest index first, each with its
  // MoM momentum arrow.
  const showcase = liveQueries.slice().sort((a, b) => (Number(b.change_points) || 0) - (Number(a.change_points) || 0) || b.value - a.value).slice(0, 6);
  const querySeries = (t) => (t.series || []).slice(-6);

  return (
    <div>
      {/* Interactive category explorer */}
      <div className="mb-2">
        <label htmlFor="demand-category" className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-market-muted">Explore a service category</label>
        <div className="relative">
          <select
            id="demand-category"
            value={category}
            onChange={(e) => pickCategory(e.target.value)}
            className="w-full appearance-none rounded-xl border border-market-line bg-market-bg px-3 py-2.5 pr-9 text-sm font-bold text-market-ink focus:border-market-accent focus:outline-none focus:ring-2 focus:ring-[#54D9AE]/30"
          >
            <option value="all">All services-industry queries</option>
            {categories.map((c) => <option key={c.category} value={c.category}>{c.label || c.category}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-market-accent" />
        </div>
      </div>

      {loading ? (
        <CircularGauge neutral neutralLabel="Loading verified category data…" size={232} />
      ) : showNeutral ? (
        <CircularGauge neutral neutralLabel={category !== 'all' ? `No verified query data for ${selectedLabel} yet` : 'Data unavailable'} size={232} />
      ) : mode === 'volume' ? (
        <CircularGauge
          value={overview.value}
          max={Math.max(overview.value || 0, ((source?.history || []).filter((h) => Number.isFinite(h.volume)).sort((a, b) => b.volume - a.volume)[0]?.volume) || 0, 0)}
          neutral={false}
          label={fmt(overview.value)}
          sublabel={`${selectedLabel} · verified searches / month`}
          onClick={() => setOpen(!open)}
          ariaLabel={`${selectedLabel} search demand gauge: ${fmt(overview.value)} verified searches per month`}
        />
      ) : (
        <CircularGauge
          value={Math.max(avgMomentum, 0)}
          max={Math.max(strongestQuery?.change_points || 0, 1)}
          neutral={false}
          label={`${avgMomentum > 0 ? '+' : ''}${avgMomentum} pts`}
          sublabel={`avg MoM momentum · ${momentumQueries.length} live queries`}
          onClick={() => setOpen(!open)}
          ariaLabel={`Services-industry search momentum gauge: average month-over-month change of ${avgMomentum} index points across ${momentumQueries.length} live queries`}
        />
      )}

      {/* Movement line for the selected scope */}
      {mode === 'volume' && overview.available && Number.isFinite(overview.mom_pct) && (
        <p className="mt-1 text-center text-xs font-bold text-market-ink">
          <span className={overview.mom_pct > 0 ? 'text-[#54D9AE]' : overview.mom_pct < 0 ? 'text-amber-300' : 'text-market-muted'}>
            {overview.mom_pct > 0 ? '▲ +' : overview.mom_pct < 0 ? '▼ ' : ''}{overview.mom_pct}%
          </span>
          <span className="text-market-muted"> vs {overview.previous_period} ({periodLabel(overview.previous_period)})</span>
        </p>
      )}
      {mode === 'momentum' && (
        <p className="mt-1 text-center text-xs font-bold text-market-ink">
          <span className="text-[#54D9AE]">{risingCount} rising</span>
          <span className="text-market-muted"> · </span>
          <span className="text-amber-300">{fallingCount} falling</span>
          <span className="text-market-muted"> · across {selectedLabel} (index 0-100)</span>
        </p>
      )}

      {/* Live query showcase — the actual queries feeding this gauge */}
      {mode === 'momentum' && !showNeutral && (
        <div className="mt-3 rounded-2xl border border-market-line bg-market-bg px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Live queries · verified index &amp; momentum</p>
          <ul className="mt-1.5 space-y-1.5">
            {showcase.map((t) => (
              <li key={`${t.keyword}|${t.comparison_group || ''}`} className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
                <span className="font-bold text-market-ink">{t.keyword}</span>
                <span className="inline-flex items-center gap-1.5 text-market-muted">
                  index {fmt(t.value)}
                  {Number.isFinite(t.change_points) && (
                    <span className={`inline-flex items-center gap-0.5 font-bold ${t.change_points > 0 ? 'text-[#54D9AE]' : t.change_points < 0 ? 'text-amber-300' : 'text-market-muted'}`}>
                      {t.change_points > 0 ? <TrendingUp className="h-3 w-3" /> : t.change_points < 0 ? <TrendingDown className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      {t.change_points > 0 ? '+' : ''}{t.change_points} pts
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={() => setOpen(!open)} className="mx-auto mt-1 flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-market-accent hover:underline" aria-expanded={open}>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} {open ? 'Hide measurements' : 'Inspect underlying measurements'}
      </button>

      {category !== 'all' && catQuery.isError && (
        <p role="alert" className="mt-1 text-center text-[11px] text-amber-300">Category data could not be loaded — please try another category.</p>
      )}

      <div className="mt-2 space-y-1">
        <MetaRow icon={CalendarDays} label="Reporting period" value={mode === 'volume' ? periodLabel(overview.period) : periodLabel(latestPeriod)} />
        <MetaRow icon={Database} label="Data source" value={mode === 'volume' ? ((overview.sources || []).join(', ') || 'No verified source yet') : 'Verified Google Trends exports (live query feed)'} />
        <MetaRow icon={Clock3} label="Last successful update" value={mode === 'volume'
          ? (overview.updated ? new Date(overview.updated).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '—')
          : (liveQueries.map((t) => t.updated).filter(Boolean).sort().at(-1) ? new Date(liveQueries.map((t) => t.updated).filter(Boolean).sort().at(-1)).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '—')} />
        <MetaRow icon={Wifi} label="Connection" value={category !== 'all' ? (catQuery.isFetching ? 'Refreshing…' : 'Connected (verified dataset)') : mode === 'momentum' ? 'Live query feed connected · verified Trends exports' : (data?.connection_status || '—')} />
        <MetaRow icon={Scale} label="Ring scale" value={mode === 'volume'
          ? '0 to strongest verified month on record'
          : `0 to strongest live-query momentum this period (+${strongestQuery?.change_points ?? 0} pts, ${strongestQuery?.keyword || '—'})`} />
      </div>

      {open && (
        <div className="mt-3 space-y-3 rounded-2xl border border-market-line bg-market-bg px-3.5 py-3">
          {mode === 'momentum' ? (
            <>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Query momentum detail · {selectedLabel}</p>
                {momentumQueries.length ? (
                  <div className="mt-1 space-y-1.5">
                    {momentumQueries.map((t) => (
                      <div key={`${t.keyword}|${t.comparison_group || ''}`}>
                        <div className="flex justify-between gap-2 text-xs text-market-ink">
                          <span className="font-bold">{t.keyword}</span>
                          <span className="text-market-muted">index {fmt(t.value)} · {t.change_points > 0 ? '+' : ''}{t.change_points} pts MoM</span>
                        </div>
                        <div className="mt-0.5 flex gap-0.5" aria-hidden="true">
                          {querySeries(t).map((p) => (
                            <span key={p.period} title={`${periodLabel(p.period)}: index ${p.index}`} className="h-1.5 flex-1 rounded-full" style={{ background: `rgba(84, 217, 174, ${Math.max(0.15, (p.index || 0) / 100)})` }} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <p className="mt-1 text-xs text-market-muted">No comparable month-over-month window for these queries yet.</p>}
              </div>
              <p className="text-[11px] leading-relaxed text-market-muted">The index (0-100) is sampled, window-normalized search interest — a momentum signal, never a search-volume count. Monthly volume estimates appear on this gauge automatically once a verified Keyword Planner dataset is imported; until then the live query feed is the verified national signal.</p>
            </>
          ) : (
            <>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Historical demand · {selectedLabel}</p>
                {(source?.history || []).filter((h) => Number.isFinite(h.volume)).slice(-6).reverse().map((h) => (
                  <p key={h.period} className="flex justify-between gap-2 text-xs text-market-ink"><span>{periodLabel(h.period)}</span><span className="text-market-muted">{fmt(h.volume)} searches/mo · {h.keywords} terms</span></p>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Keyword breakdown (deduplicated, one provider per term)</p>
                {(source?.keywords || []).slice(0, 8).map((k) => (
                  <p key={k.keyword} className="flex justify-between gap-2 text-xs text-market-ink"><span className="min-w-0 truncate">{k.keyword}</span><span className="text-market-muted">{fmt(k.value)} /mo · competition: {k.competition}</span></p>
                ))}
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Source reliability</p>
                {(source?.provider_coverage || []).map((p) => (
                  <p key={p.source} className="flex justify-between gap-2 text-xs text-market-ink"><span className="min-w-0 truncate">{p.source}</span><span className="text-market-muted">updated {p.updated || '—'}</span></p>
                ))}
              </div>
              <p className="text-[11px] leading-relaxed text-market-muted">{source?.methodology || data?.methodology}</p>
            </>
          )}
          <p className="text-[11px] leading-relaxed text-market-muted">External query datasets refresh only when a new verified export is imported — never per page load.</p>
        </div>
      )}
    </div>
  );
}