import { lazy, Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Loader2, Globe2, TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
const MarketArchive = lazy(() => import('@/components/admin/demand/MarketArchive'));

// Compact public observatory: four components, each answering one question
// about Canadian consumer demand with verified data only. No circular gauges,
// no user-facing date/range controls, no diagnostics on the public surface.
// The report endpoint picks the latest verified reporting period itself.
const PROVINCE_NAMES = { AB: 'Alberta', BC: 'British Columbia', MB: 'Manitoba', NB: 'New Brunswick', NL: 'Newfoundland and Labrador', NS: 'Nova Scotia', NT: 'Northwest Territories', NU: 'Nunavut', ON: 'Ontario', PE: 'Prince Edward Island', QC: 'Quebec', SK: 'Saskatchewan', YT: 'Yukon' };

const fmt = (n) => n === null || n === undefined ? '—' : Number(n).toLocaleString('en-CA');
const pctWidth = (v, max) => `${max > 0 ? Math.max(3, Math.round((v / max) * 100)) : 0}%`;
const Bar = ({ value, max, color = 'bg-market-accent' }) => (
  <div className="h-2 w-full rounded-full bg-white/10">
    <div className={`h-2 rounded-full ${color}`} style={{ width: pctWidth(value, max) }} />
  </div>
);
const MomBadge = ({ pct }) => {
  if (!Number.isFinite(pct)) return null;
  const up = pct > 0;
  return <span className={`inline-flex items-center gap-1 text-xs font-bold ${up ? 'text-[#54D9AE]' : 'text-amber-300'}`}>
    {up ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}{up ? '+' : ''}{pct}% MoM</span>;
};
const BlockShell = ({ title, question, children }) => (
  <div className="rounded-2xl border border-market-line bg-market-surface p-4 sm:p-5">
    <h3 className="text-sm font-extrabold text-market-ink">{title}</h3>
    <p className="mt-0.5 text-xs text-market-muted">{question}</p>
    <div className="mt-3">{children}</div>
  </div>
);
const Unavailable = ({ message }) => <p className="text-xs leading-relaxed text-market-muted">{message}</p>;

export default function MarketObservatory({ compact = false, onImport, showHistory = false }) {
  const admin = Boolean(showHistory);
  const query = useQuery({
    queryKey: ['marketObservatory', 'auto'],
    queryFn: async () => (await base44.functions.invoke('demandReport', { view: 'command', filters: { engine: 'google' } })).data,
    staleTime: 60000, refetchInterval: 900000, retry: false,
  });
  const data = query.data;
  const trends = data?.trends || [];
  const latestPeriod = data?.overview?.available ? data.overview.period : (trends[0]?.period || data?.latest_period || null);
  const periodLabel = latestPeriod ? new Date(`${latestPeriod}-01T00:00:00Z`).toLocaleDateString('en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : null;
  const nationalTrends = trends.filter((t) => t.geo_type === 'national' || !t.geo_type);
  const momentum = nationalTrends.filter((t) => Number.isFinite(t.change_points));
  const rising = momentum.filter((t) => t.change_points > 0).sort((a, b) => b.change_points - a.change_points).slice(0, 4);
  const falling = momentum.filter((t) => t.change_points < 0).sort((a, b) => a.change_points - b.change_points).slice(0, 3);
  const useTrendsRanking = !data?.keywords?.length;
  const rankedServices = useTrendsRanking
    ? [...nationalTrends].sort((a, b) => b.value - a.value).slice(0, 8)
    : (data?.keywords || []).slice(0, 8);
  const serviceMax = Math.max(...rankedServices.map((r) => r.value || 0), 0);
  const regions = [...(data?.provinces || []), ...(data?.cities || [])].filter((r) => r.available && Number.isFinite(r.value)).slice(0, 8);
  const regionMax = Math.max(...regions.map((r) => r.value || 0), 0);
  return <section aria-label="Canadian Market Observatory" className="rounded-3xl bg-market-bg p-4 text-market-ink sm:p-7">
    <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-market-accent"><Globe2 className="h-4 w-4" />Canadian Market Search Intelligence</div>
    <h2 className="text-2xl font-extrabold sm:text-3xl">National Market Observatory</h2>
    {query.isPending && <p role="status" className="flex items-center gap-2 py-10 text-sm text-market-muted"><Loader2 className="h-5 w-5 animate-spin" />Loading market intelligence…</p>}
    {query.isError && <p role="alert" className="py-8 text-sm text-market-muted">{query.error?.response?.data?.error || 'Market data could not be loaded right now.'}</p>}
    {data && <>
      <p className="mt-2 text-xs text-market-muted">
        {periodLabel ? <>Latest verified reporting period: <span className="font-bold text-market-ink">{periodLabel}</span> · Google</> : 'No verified reporting period available yet.'}
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <BlockShell title="Canadian National Search Demand" question="How much demand is there, nationally, for the latest verified period?">
          {data.overview?.available
            ? <div>
                <p className="text-4xl font-extrabold text-market-ink">{fmt(data.overview.value)}</p>
                <p className="mt-1 text-xs text-market-muted">{data.overview.measure} · {data.overview.keywords} tracked terms · {data.overview.scope}</p>
                <div className="mt-2"><MomBadge pct={data.overview.mom_pct} /></div>
                <p className="mt-2 text-[11px] text-market-muted">Sources: {(data.overview.sources || []).join(', ') || '—'}</p>
              </div>
            : <Unavailable message={data.data_status?.state === 'not_backfilled'
                ? 'Verified monthly volume estimates have not been backfilled yet. The verified signal currently available is Trends relative interest, shown below.'
                : 'No verified monthly volume estimates match this period. The verified signal currently available is Trends relative interest, shown below.'} />}
        </BlockShell>
        <BlockShell title="Market Demand Momentum" question="Which services are gaining or losing search interest?">
          {data.overview?.available && Number.isFinite(data.overview.mom_pct) && (
            <div className="mb-3 flex items-baseline gap-2"><p className="text-3xl font-extrabold">{data.overview.mom_pct > 0 ? '+' : ''}{data.overview.mom_pct}%</p><span className="text-xs text-market-muted">vs {data.overview.previous_period}</span></div>
          )}
          {rising.length || falling.length ? (
            <div className="space-y-1.5">
              {rising.map((t) => <p key={t.keyword} className="flex items-center gap-2 text-xs text-market-ink"><TrendingUp className="h-3.5 w-3.5 text-[#54D9AE]" /><span className="font-bold">{t.keyword}</span><span className="text-[#54D9AE]">+{t.change_points}</span></p>)}
              {falling.map((t) => <p key={t.keyword} className="flex items-center gap-2 text-xs text-market-ink"><TrendingDown className="h-3.5 w-3.5 text-amber-300" /><span className="font-bold">{t.keyword}</span><span className="text-amber-300">{t.change_points}</span></p>)}
              <p className="pt-1 text-[11px] text-market-muted">Change in Trends index (0-100) vs the previous month.</p>
            </div>
          ) : <Unavailable message="No month-over-month comparison is available yet for this period." />}
        </BlockShell>
        <BlockShell title="Most Searched Services" question="Which removal and recycling services are searched most?">
          {rankedServices.length ? (
            <div className="space-y-2.5">
              {rankedServices.map((s) => <div key={s.keyword}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs"><span className="font-bold text-market-ink">{s.keyword}</span><span className="text-market-muted">{useTrendsRanking ? `index ${s.value}` : `${fmt(s.value)} searches/mo`}</span></div>
                <Bar value={s.value || 0} max={serviceMax} />
              </div>)}
              {useTrendsRanking && <p className="pt-1 text-[11px] text-market-muted">Google Trends relative interest (0-100) within each keyword group's own 5-year window; cross-term ranking is indicative, not a volume comparison.</p>}
            </div>
          ) : <Unavailable message="No verified service-level search data is available for this period yet." />}
        </BlockShell>
        <BlockShell title="Regional Demand Distribution" question="Where in Canada is the demand concentrated?">
          {regions.length ? (
            <div className="space-y-2.5">
              {regions.map((r) => <div key={r.key}>
                <div className="mb-1 flex items-baseline justify-between gap-2 text-xs"><span className="inline-flex items-center gap-1 font-bold text-market-ink"><MapPin className="h-3 w-3 text-market-accent" />{r.name}</span><span className="text-market-muted">{fmt(r.value)} searches/mo</span></div>
                <Bar value={r.value || 0} max={regionMax} color="bg-[#54D9AE]" />
              </div>)}
              <p className="pt-1 text-[11px] text-market-muted">{data.coverage_note}</p>
            </div>
          ) : <Unavailable message="Regional (province and city) observations are not yet available — the current verified samples are Canada-wide. Provincial and city data will appear here once a regional dataset is retrieved." />}
        </BlockShell>
      </div>
      {admin && <Suspense fallback={<p role="status" className="mt-5 text-xs text-market-muted">Loading historical views…</p>}><MarketArchive data={data} onSelect={() => {}} /></Suspense>}
      {compact ? <Link to="/demand" className="mt-6 inline-block rounded-full border border-market-accent px-5 py-3 text-sm font-bold text-market-accent">Explore the full Canadian observatory</Link> : null}
      <p className="mt-5 text-[11px] leading-relaxed text-market-muted">{data.methodology} Indicators recalculate automatically when verified observations are retrieved; this page never triggers provider fetches.</p>
    </>}
  </section>;
}