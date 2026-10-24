import { useState } from 'react';
import { ChevronDown, ChevronRight, CalendarDays, Database, Clock3, Wifi, Scale, MapPin } from 'lucide-react';
import CircularGauge from './CircularGauge';
import useObservatory, { fmtTime } from '@/components/observatory/useObservatory';

const PROVINCE_NAMES = { AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick', NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories', NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec', SK: 'Saskatchewan', YT: 'Yukon', unspecified: 'Province not recorded' };
const provName = (p) => PROVINCE_NAMES[p] || p;

const MetaRow = ({ icon: Icon, label, value }) => (
  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[11px]">
    <span className="inline-flex items-center gap-1 font-bold text-market-muted"><Icon className="h-3 w-3 text-market-accent" />{label}:</span>
    <span className="text-market-ink">{value}</span>
  </div>
);

// Gauge 2 — Regional Demand Activity: observed Canadian service-request
// activity from verified internal records (bookings, inquiries) plus
// qualified, deduplicated public opportunities in a 30-day window. Google
// search interest is never counted as a service request. Ring scale: 0 to
// the strongest recorded 30-day window. Click for provincial/city drill-down.
export default function RegionalActivityGauge() {
  const { data: feed, isPending, isError } = useObservatory();
  const [open, setOpen] = useState(false);
  const [provOpen, setProvOpen] = useState(null);
  const g = feed?.regional_gauge;
  const ready = Boolean(feed && g);
  const value = g?.verified_requests ?? 0;
  const prev = g?.previous_window_requests ?? null;
  const peak = Math.max(value, prev || 0, 0);
  const delta = Number.isFinite(prev) && prev !== null ? value - prev : null;
  const strongest = g?.strongest_regions || [];
  const provinces = g?.provinces || [];
  const services = g?.service_breakdown || [];

  return (
    <div>
      {isPending ? (
        <CircularGauge neutral neutralLabel="Connecting to verified activity records…" size={232} />
      ) : isError || !ready ? (
        <CircularGauge neutral neutralLabel="Data unavailable" size={232} />
      ) : (
        <CircularGauge
          value={value}
          max={peak}
          neutral={false}
          label={String(value)}
          sublabel={`verified requests · last ${g.window_days} days`}
          onClick={() => setOpen(!open)}
          ariaLabel={`Regional demand activity gauge: ${value} verified service requests in the last 30 days`}
        />
      )}

      <button onClick={() => setOpen(!open)} className="mx-auto mt-1 flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold text-market-accent hover:underline" aria-expanded={open}>
        {open ? <ChevronDown className="h-3 w-3 rotate-180" /> : <ChevronRight className="h-3 w-3" />} {open ? 'Hide observations' : 'Drill into provincial and city observations'}
      </button>

      <div className="mt-2 space-y-1">
        <MetaRow icon={CalendarDays} label="Reporting window" value={ready ? `Rolling ${g.window_days}-day window` : '—'} />
        <MetaRow icon={Database} label="Data source" value="Recycling OS platform records + qualified public discovery (deduplicated)" />
        <MetaRow icon={Clock3} label="Last updated" value={fmtTime(feed?.generated_at)} />
        <MetaRow icon={Wifi} label="Connection" value={ready ? 'Live internal events + 60s external refresh' : isError ? 'Feed unavailable — will retry automatically' : 'Connecting…'} />
        <MetaRow icon={Scale} label="Ring scale" value={ready ? (prev !== null ? `0 to strongest recorded 30-day window (${Math.max(value, prev)} requests)` : '0 to this baseline window') : '—'} />
      </div>

      {/* Strongest regions beneath the gauge */}
      {ready && (
        <div className="mt-3 rounded-2xl border border-market-line bg-market-bg px-3.5 py-3">
          <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Strongest regions · {g.regions_with_demand} region{g.regions_with_demand === 1 ? '' : 's'} with observed demand</p>
          {strongest.length ? (
            <ul className="mt-1.5 space-y-1 text-xs">
              {strongest.map((r) => (
                <li key={r.city} className="flex flex-wrap items-baseline justify-between gap-x-2">
                  <span className="inline-flex items-center gap-1 font-bold text-market-ink"><MapPin className="h-3 w-3 text-market-accent" />{r.city}</span>
                  <span className="text-market-muted">{r.requests} request{r.requests === 1 ? '' : 's'} · {r.covered ? 'verified coverage' : 'recruitment area'}</span>
                </li>
              ))}
            </ul>
          ) : <p className="mt-1.5 text-xs text-market-muted">No verified service requests recorded in this window yet — the gauge shows a verified zero rather than an estimate.</p>}
          {delta !== null && (
            <p className="mt-1.5 text-[11px] font-semibold text-market-muted">
              {delta > 0 ? `▲ +${delta} vs the previous 30-day window` : delta < 0 ? `▼ ${delta} vs the previous 30-day window` : 'Level with the previous 30-day window'}
            </p>
          )}
        </div>
      )}

      {open && (
        <div className="mt-3 space-y-3 rounded-2xl border border-market-line bg-market-bg px-3.5 py-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Provincial and city drill-down (current window)</p>
            {provinces.length ? (
              <div className="mt-1 space-y-1">
                {provinces.map((p) => (
                  <div key={p.province}>
                    <button onClick={() => setProvOpen(provOpen === p.province ? null : p.province)} className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-xs font-bold text-market-ink hover:bg-white/5" aria-expanded={provOpen === p.province}>
                      <span className="inline-flex items-center gap-1">{provOpen === p.province ? <ChevronDown className="h-3 w-3 text-market-accent" /> : <ChevronRight className="h-3 w-3 text-market-muted" />}{provName(p.province)}</span>
                      <span className="text-market-muted">{p.requests} request{p.requests === 1 ? '' : 's'}</span>
                    </button>
                    {provOpen === p.province && (
                      <ul className="ml-5 space-y-0.5 text-[11px] text-market-ink">
                        {p.cities.map((c) => <li key={c.city} className="flex justify-between gap-2"><span>{c.city}</span><span className="text-market-muted">{c.requests}</span></li>)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : <p className="mt-1 text-xs text-market-muted">No provincial observations in this window yet.</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Service category breakdown (qualified public opportunities)</p>
            {services.length ? (
              <ul className="mt-1 space-y-0.5 text-xs text-market-ink">
                {services.map((s) => <li key={s.category} className="flex justify-between gap-2"><span>{s.category.replace(/_/g, ' ')}</span><span className="text-market-muted">{s.open_opportunities} open</span></li>)}
              </ul>
            ) : <p className="mt-1 text-xs text-market-muted">No qualified public opportunities recorded yet.</p>}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Historical changes</p>
            <p className="mt-1 text-xs text-market-ink">Current 30-day window: {value} verified requests · previous window: {prev === null ? 'not yet on record' : `${prev} verified requests`}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Source reliability</p>
            <ul className="mt-1 space-y-0.5 text-[11px] text-market-ink">
              <li>• Platform records: captured at the moment of the request (real time).</li>
              <li>• Public opportunities: authorized discovery syncs, deduplicated by source external id — {g.qualified_opportunities_open} qualified open.</li>
              <li>• {g.dedupe_note}</li>
            </ul>
          </div>
          <p className="text-[11px] leading-relaxed text-market-muted">Related customer and contractor opportunities for these observations appear in the live activity feed below. Timestamps shown in the feed are the actual record times; Google search interest is never counted here as a service request.</p>
        </div>
      )}
    </div>
  );
}