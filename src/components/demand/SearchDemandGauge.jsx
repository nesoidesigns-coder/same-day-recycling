import { useState } from 'react';
import { ChevronDown, ChevronUp, CalendarDays, Database, Clock3, Wifi, Scale } from 'lucide-react';
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
// scale: 0 to the strongest verified month on record. Click to inspect the
// underlying measurements.
export default function SearchDemandGauge({ data }) {
  const [open, setOpen] = useState(false);
  const overview = data?.overview || {};
  const available = Boolean(overview.available);
  const history = (data?.history || []).filter((h) => Number.isFinite(h.volume));
  const peakMonth = history.slice().sort((a, b) => b.volume - a.volume)[0] || null;
  const peak = Math.max(overview.value || 0, peakMonth?.volume || 0, 0);
  const keywords = (data?.keywords || []).slice(0, 8);
  const categories = (data?.categories || []).filter((c) => c.available && Number.isFinite(c.value));
  const providers = data?.provider_coverage || [];
  const changes = history.slice(-6).reverse();

  return (
    <div>
      <CircularGauge
        value={overview.value}
        max={peak}
        neutral={!available}
        label={fmt(overview.value)}
        sublabel="verified searches / month"
        onClick={() => setOpen(!open)}
        ariaLabel={available ? `National search demand gauge: ${fmt(overview.value)} verified searches per month` : 'National search demand gauge: data unavailable'}
      />

      <button onClick={() => setOpen(!open)} className="mx-auto mt-1 flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-market-accent hover:underline" aria-expanded={open}>
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />} {open ? 'Hide measurements' : 'Inspect underlying measurements'}
      </button>

      <div className="mt-2 space-y-1">
        <MetaRow icon={CalendarDays} label="Reporting period" value={periodLabel(overview.period)} />
        <MetaRow icon={Database} label="Data source" value={(overview.sources || []).join(', ') || 'No verified source yet'} />
        <MetaRow icon={Clock3} label="Last successful update" value={overview.updated ? new Date(overview.updated).toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' }) : '—'} />
        <MetaRow icon={Wifi} label="Connection" value={data?.connection_status || '—'} />
        <MetaRow icon={Scale} label="Ring scale" value={available ? (peakMonth && history.length > 1 ? `0 to strongest verified month on record (${fmt(peak)}, ${periodLabel(peakMonth.period)})` : '0 to this baseline month (only one verified month on record so far)') : 'Empty until verified volume data exists'} />
      </div>

      {open && (
        <div className="mt-3 space-y-3 rounded-2xl border border-market-line bg-market-bg px-3.5 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Underlying service categories</p>
            {categories.length ? (
              <ul className="mt-1 space-y-0.5 text-xs text-market-ink">
                {categories.slice(0, 6).map((c) => (
                  <li key={c.category} className="flex justify-between gap-2"><span>{c.label}</span><span className="text-market-muted">{fmt(c.value)} searches/mo</span></li>
                ))}
              </ul>
            ) : <p className="mt-1 text-xs text-market-muted">No category-level verified volumes for this period.</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Keyword breakdown (deduplicated, one provider per term)</p>
            {keywords.length ? (
              <ul className="mt-1 space-y-0.5 text-xs text-market-ink">
                {keywords.map((k) => (
                  <li key={k.keyword} className="flex justify-between gap-2"><span className="min-w-0 truncate">{k.keyword}</span><span className="text-market-muted">{fmt(k.value)} /mo · competition: {k.competition}</span></li>
                ))}
              </ul>
            ) : <p className="mt-1 text-xs text-market-muted">No keyword-level verified volumes for this period.</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Historical changes (verified months)</p>
            {changes.length ? (
              <ul className="mt-1 space-y-0.5 text-xs text-market-ink">
                {changes.map((h) => (
                  <li key={h.period} className="flex justify-between gap-2"><span>{periodLabel(h.period)}</span><span className="text-market-muted">{fmt(h.volume)} · {h.keywords} terms</span></li>
                ))}
              </ul>
            ) : <p className="mt-1 text-xs text-market-muted">Only the current period is on record; history appears as new verified months are imported.</p>}
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
          <p className="text-[11px] leading-relaxed text-market-muted">{data?.methodology} External keyword datasets refresh only when a new verified import arrives — never per page load, and never from Trends indexes.</p>
        </div>
      )}
    </div>
  );
}