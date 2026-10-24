import { ShieldCheck, MapPin, TrendingUp } from 'lucide-react';

// Regional demand rankings and trending service categories — observed counts
// with coverage state, never availability promises from search activity.
export default function RegionalRankings({ data }) {
  const regions = (data?.regions || []).filter((r) => (r.demand_events + r.public_opportunities) > 0 || r.contractors > 0).slice(0, 10);
  const trending = data?.trending || [];
  const max = Math.max(...regions.map((r) => (r.demand_events + r.public_opportunities)), 1);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-3xl border border-market-line bg-market-surface p-4 sm:p-6">
        <h3 className="text-sm font-extrabold text-market-ink">Regional Demand Rankings</h3>
        <p className="mt-0.5 text-xs text-market-muted">Verified platform events plus open public opportunities, by Canadian community.</p>
        {regions.length ? (
          <div className="mt-3 space-y-3">
            {regions.map((r) => {
              const total = r.demand_events + r.public_opportunities;
              return (
                <div key={r.city}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-2 text-xs">
                    <span className="inline-flex items-center gap-1 font-bold text-market-ink"><MapPin className="h-3 w-3 text-market-accent" />{r.city}</span>
                    <span className="text-market-muted">{total} event{total === 1 ? '' : 's'}{r.public_opportunities ? ` · ${r.public_opportunities} public` : ''}</span>
                  </div>
                  <div className="mt-1 h-2 w-full rounded-full bg-white/10">
                    <div className="h-2 rounded-full bg-[#54D9AE]" style={{ width: `${Math.max(3, Math.round((total / max) * 100))}%` }} />
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
                    {r.covered ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#187B65]/20 px-2 py-0.5 text-[#54D9AE]"><ShieldCheck className="h-3 w-3" /> Verified coverage · {r.contractors} contractor{r.contractors === 1 ? '' : 's'} · {r.truck_capacity} truck{r.truck_capacity === 1 ? '' : 's'}/day</span>
                    ) : total > 0 ? (
                      <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-300">Unmatched demand — contractor recruitment area</span>
                    ) : (
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-market-muted">Verified coverage, no demand recorded yet</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : <p className="mt-3 text-xs text-market-muted">No verified regional demand recorded yet. Rankings appear as real events arrive.</p>}
      </div>

      <div className="rounded-3xl border border-market-line bg-market-surface p-4 sm:p-6">
        <h3 className="text-sm font-extrabold text-market-ink">Trending Service Categories</h3>
        <p className="mt-0.5 text-xs text-market-muted">Open public opportunities grouped by requested service (observed counts).</p>
        {trending.length ? (
          <div className="mt-3 space-y-2">
            {trending.map((t) => (
              <div key={t.category} className="flex items-center justify-between rounded-xl border border-market-line bg-market-bg px-3 py-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-bold text-market-ink"><TrendingUp className="h-3.5 w-3.5 text-[#54D9AE]" />{t.category.replace(/_/g, ' ')}</span>
                <span className="text-market-muted">{t.open_opportunities} open</span>
              </div>
            ))}
          </div>
        ) : <p className="mt-3 text-xs text-market-muted">No open public opportunities recorded yet. The trending list fills only from real discoveries.</p>}
      </div>
    </div>
  );
}