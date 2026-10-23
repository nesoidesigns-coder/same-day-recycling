import { useQuery } from '@tanstack/react-query';
import { X, MapPin } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import useCoverageStatus from '@/hooks/useCoverageStatus';

const fmt = (n) => n === null || n === undefined ? '—' : Number(n).toLocaleString('en-CA');
const COVERAGE_LABEL = { same_day: 'Provider Confirmed', matching: 'Provider Matching', recruiting: 'Recruitment Open', currently_unavailable: 'Currently Unavailable' };

// Detailed demand profile for one selected region (city or province):
// keyword estimates, trends, opportunities, and contractor availability.
// Search demand and operational coverage are shown side by side but never merged.
export default function CityDemandProfile({ region, onClose }) {
  const isCity = region?.geo_type === 'city';
  const coverage = useCoverageStatus();
  const query = useQuery({
    queryKey: ['regionDemandProfile', region?.key, region?.province_code],
    enabled: !!region,
    queryFn: async () => (await base44.functions.invoke('demandReport', {
      view: 'command',
      filters: { engine: 'google', province: region.province_code || undefined, city: isCity ? region.name : undefined },
    })).data,
    staleTime: 60000, retry: false,
  });
  if (!region) return null;
  const data = query.data;
  const status = isCity ? coverage.statusFor(region.name) : null;
  const contractors = isCity ? (coverage.contractorCounts?.[String(region.name).trim().toLowerCase()] ?? null) : null;
  const keywords = (data?.keywords || []).slice(0, 8);
  const risingTrends = (data?.trends || []).filter((t) => t.change_points > 0).slice(0, 5);
  const opportunities = (data?.opportunities || []).slice(0, 5);

  return (
    <section className="rounded-2xl border border-market-accent/40 bg-market-bg p-5 text-market-ink">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="inline-flex items-center gap-2 font-bold"><MapPin className="h-4 w-4 text-market-accent" />{region.name}{region.province_code && !isCity ? ` — all tracked ${region.name} cities` : region.province_code ? `, ${region.province_code}` : ''}</h3>
          <p className="mt-0.5 text-xs text-market-muted">Demand profile · {data?.latest_period ? new Date(`${data.latest_period}-01T00:00:00Z`).toLocaleDateString('en-CA', { month: 'long', year: 'numeric', timeZone: 'UTC' }) : 'no verified period'} · Google · {isCity ? 'city-level' : 'province-level'} estimates</p>
        </div>
        <button onClick={onClose} aria-label="Close demand profile" className="rounded-full border border-market-line p-2 text-market-muted hover:text-market-ink"><X className="h-4 w-4" /></button>
      </div>

      {query.isPending && <p role="status" className="py-6 text-sm text-market-muted">Assembling the demand profile…</p>}
      {query.isError && <p role="alert" className="py-6 text-sm text-market-muted">The demand profile could not be loaded.</p>}

      {data && (
        <div className="mt-4 space-y-5">
          <div className="rounded-xl border border-market-line bg-market-surface p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-market-muted">Estimated monthly searches</p>
            <p className="text-2xl font-extrabold">{data.overview?.available ? fmt(data.overview.value) : '—'}</p>
            <p className="mt-1 text-xs text-market-muted">{data.overview?.available ? `${data.overview.measure} · ${data.overview.keywords} tracked terms` : 'No verified estimates match this region yet.'}</p>
            {data.overview?.available && Number.isFinite(data.overview.mom_pct) && (
              <p className="mt-1 text-xs text-market-muted">vs {data.overview.previous_period}: {data.overview.mom_pct > 0 ? '+' : ''}{data.overview.mom_pct}%</p>
            )}
            <p className="mt-1 text-[11px] text-market-muted">Sources: {(data.overview?.sources || []).join(', ') || '—'}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-market-accent">Keyword estimates</h4>
            {keywords.length ? (
              <ul className="mt-2 space-y-1.5 text-xs">
                {keywords.map((k) => (
                  <li key={k.keyword} className="flex items-baseline justify-between gap-3 rounded-lg border border-market-line bg-market-surface px-3 py-2">
                    <span className="font-semibold">{k.keyword}</span>
                    <span className="shrink-0 text-market-muted">{fmt(k.value)}/mo · {k.competition} competition · {k.sources?.join(', ') || ''}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="mt-2 text-xs text-market-muted">No keyword-level estimates on file for this region yet.</p>}
          </div>

          {risingTrends.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-market-accent">Rising search interest (Trends, sampled)</h4>
              <ul className="mt-2 space-y-1 text-xs text-market-muted">
                {risingTrends.map((t) => <li key={t.keyword}>{t.keyword} · +{t.change_points} index points ({t.comparison_group})</li>)}
              </ul>
              <p className="mt-1 text-[11px] text-market-muted">Indices are window-normalized interest, never search volumes.</p>
            </div>
          )}

          {opportunities.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-market-accent">Screened opportunities</h4>
              <ul className="mt-2 space-y-1 text-xs text-market-muted">
                {opportunities.map((o) => <li key={o.keyword}>{o.keyword} · {fmt(o.value)}/mo{o.competition === 'low' ? ' · low ad competition' : ''}</li>)}
              </ul>
              <p className="mt-1 text-[11px] text-market-muted">Screening rule: rising demand first, then low ad competition, then recorded volume. Not a revenue forecast.</p>
            </div>
          )}

          <div className="rounded-xl border border-market-line bg-market-surface p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-market-muted">Contractor coverage — operational records, separate from search demand</p>
            {isCity ? (
              <>
                <p className="mt-1 text-sm font-bold">{status ? COVERAGE_LABEL[status] : 'Coverage status unavailable'}</p>
                <p className="mt-0.5 text-xs text-market-muted">
                  {contractors !== null ? `${contractors} verified contractor${contractors === 1 ? '' : 's'} on file in this city.` : 'Verified contractor count unavailable.'}
                  {status !== 'same_day' && ' Demand here is not yet matched by confirmed same-day coverage — a possible recruitment market.'}
                </p>
              </>
            ) : (
              <p className="mt-1 text-xs text-market-muted">Contractor availability is tracked per city. Select a city marker to see its verified coverage status.</p>
            )}
          </div>
        </div>
      )}
    </section>
  );
}