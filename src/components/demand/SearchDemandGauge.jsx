import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, CalendarDays, Database, Clock3, Wifi, Scale, Loader2 } from 'lucide-react';
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

// Gauge 1 — Canadian National Search Demand. Verified monthly search-volume
// estimates only (Keyword Planner / published estimates, deduplicated by the
// reporting engine). Trends indexes are never converted into volumes. Ring
// scale: 0 to the strongest verified month on record. Visitors can select a
// service category and explore its historical demand. Click to inspect the
// underlying measurements.
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
  const available = Boolean(overview.available);
  const history = (source?.history || []).filter((h) => Number.isFinite(h.volume));
  const peakMonth = history.slice().sort((a, b) => b.volume - a.volume)[0] || null;
  const peak = Math.max(overview.value || 0, peakMonth?.volume || 0, 0);
  const keywords = (source?.keywords || []).slice(0, 8);
  const categoriesDetail = (source?.categories || []).filter((c) => c.available && Number.isFinite(c.value));
  const providers = source?.provider_coverage || [];
  const changes = history.slice(-6).reverse();
  const selectedLabel = category === 'all' ? 'All services' : ((categories.find((c) => c.category === category)?.label) || category);

  const pickCategory = (value) => {
    setCategory(value);
    try {
      base44.analytics.track({ eventName: 'gauge_interaction', properties: { gauge: 'national_search_demand', category: value } });
    } catch { /* analytics must never block the gauge */ }
  };

  const showNeutral = category !== 'all' ? (catQuery.isPending || catQuery.isError || !available) : !available;

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
            <option value="all">All services (national total)</option>
            {categories.map((c) => <option key={c.category} value={c.category}>{c.label || c.category}</option>)}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-market-accent" />
        </div>
      </div>

      {category !== 'all' && catQuery.isPending ? (
        <CircularGauge neutral neutralLabel="Loading verified category data…" size={232} />
      ) : showNeutral ? (
        <CircularGauge neutral neutralLabel={category !== 'all' ? `No verified volume data for ${selectedLabel} yet` : 'Data unavailable'} size={232} />
      ) : (
        <CircularGauge
          value={overview.value}
          max={peak}
          neutral={false}
          label={fmt(overview.value)}
          sublabel={`${selectedLabel} · verified searches / month`}
          onClick={() => setOpen(!open)}
          ariaLabel={`${selectedLabel} search demand gauge: ${fmt(overview.value)} verified searches per month`}
        />
      )}

      {/* Month-over-month movement for the selected scope */}
      {available && Number.isFinite(overview.mom_pct) && (
        <p className="mt-1 text-center text-xs font-bold text-market-ink">
          <span className={overview.mom_pct > 0 ? 'text-[#54D9AE]' : overview.mom_pct < 0 ? 'text-amber-300' : 'text-market-muted'}>
            {overview.mom_pct > 0 ? '▲ +' : overview.mom_pct < 0 ? '▼ ' : ''}{overview.mom_pct}%
          </span>
          <span className="text-market-muted"> vs {overview.previous_period} ({periodLabel(overview.previous_period)})</span>
        </p>
      )}

      <button onClick={() => setOpen(!open)} className="mx-auto mt-1 flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-market-accent hover:underline" aria-expanded={open}>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} {open ? 'Hide measurements' : 'Inspect underlying measurements'}
      </button>

      {category !== 'all' && catQuery.isError && (
        <p role="alert" className="mt-1 text-center text-[11px] text-amber-300">Category data could not be loaded — please try another category.</p>
      )}

      <div className="mt-2 space-y-1">
        <MetaRow icon={CalendarDays} label="Reporting period" value={periodLabel(overview.period)} />
        <MetaRow icon={Database} label="Data source" value={(overview.sources || []).join(', ') || 'No verified source yet'} />
        <MetaRow icon={Clock3} label="Last successful update" value={overview.updated ? new Date(overview.updated).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '—'} />
        <MetaRow icon={Wifi} label="Connection" value={category !== 'all' ? (catQuery.isFetching ? 'Refreshing…' : 'Connected (verified dataset)') : (data?.connection_status || '—')} />
        <MetaRow icon={Scale} label="Ring scale" value={available ? (peakMonth && history.length > 1 ? `0 to strongest verified month on record (${fmt(peak)}, ${periodLabel(peakMonth.period)})` : '0 to this baseline month (only one verified month on record so far)') : 'Empty until verified volume data exists'} />
      </div>

      {open && (
        <div className="mt-3 space-y-3 rounded-2xl border border-market-line bg-market-bg px-3.5 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Historical demand · {selectedLabel}</p>
            {changes.length ? (
              <ul className="mt-1 space-y-0.5 text-xs text-market-ink">
                {changes.map((h) => (
                  <li key={h.period} className="flex justify-between gap-2"><span>{periodLabel(h.period)}</span><span className="text-market-muted">{fmt(h.volume)} searches/mo · {h.keywords} terms</span></li>
                ))}
              </ul>
            ) : <p className="mt-1 text-xs text-market-muted">Only the current period is on record for this scope; history appears as new verified months are imported.</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Keyword breakdown (deduplicated, one provider per term)</p>
            {keywords.length ? (
              <ul className="mt-1 space-y-0.5 text-xs text-market-ink">
                {keywords.map((k) => (
                  <li key={k.keyword} className="flex justify-between gap-2"><span className="min-w-0 truncate">{k.keyword}</span><span className="text-market-muted">{fmt(k.value)} /mo · competition: {k.competition}</span></li>
                ))}
              </ul>
            ) : <p className="mt-1 text-xs text-market-muted">No keyword-level verified volumes for this scope.</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Source reliability</p>
            {providers.length ? (
              <ul className="mt-1 space-y-0.5 text-xs text-market-ink">
                {providers.map((p) => (
                  <li key={p.source} className="flex justify-between gap-2"><span className="min-w-0 truncate">{p.source}</span><span className="text-market-muted">updated {p.updated || '—'}</span></li>
                ))}
              </ul>
            ) : <p className="mt-1 text-xs text-market-muted">No external provider dataset is connected yet (Keyword Planner credentials pending).</p>}
          </div>
          <p className="text-[11px] leading-relaxed text-market-muted">{source?.methodology || data?.methodology} External keyword datasets refresh only when a new verified import arrives — never per page load, and never from Trends indexes.</p>
        </div>
      )}
    </div>
  );
}