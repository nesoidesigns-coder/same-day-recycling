import { CATEGORY_LABELS } from '@/lib/demandShared';

const fmt = (v) => v === null || v === undefined ? '—' : Number(v).toLocaleString('en-CA');

// Service demand leaderboard: one row per tracked service category, ranked by
// the latest verified estimate. Values stay per-keyword-group estimates —
// overlapping close variants are already deduplicated upstream.
export default function ServiceLeaderboard({ data }) {
  const rows = (data?.categories || []).map((c) => {
    const lead = c.leading_city || null;
    return {
      label: c.label || CATEGORY_LABELS[c.category] || c.category,
      value: c.available ? c.value : null,
      mom: c.mom_pct ?? null,
      measure: c.measure,
      sources: c.sources || [],
      period: c.period || null,
      leading: lead,
    };
  }).sort((a, b) => (b.value ?? -1) - (a.value ?? -1));

  return (
    <section className="rounded-2xl border border-market-line bg-market-surface p-5 text-market-ink">
      <h3 className="font-bold">Service demand leaderboard</h3>
      <p className="mt-1 text-xs text-market-muted">
        {data?.regional_period || data?.latest_period || 'No reporting period'} · source-reported estimates for tracked keywords only · overlapping keyword variants are deduplicated, never summed twice
      </p>
      {!rows.length ? (
        <p className="py-6 text-sm text-market-muted">No service categories on file yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-wider text-market-muted">
                <th className="px-3 py-2">Service</th>
                <th className="px-3 py-2">Monthly searches</th>
                <th className="px-3 py-2">Trend</th>
                <th className="px-3 py-2">Leading city</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.label} className="border-t border-market-line">
                  <td className="px-3 py-2.5 font-semibold text-market-ink">{r.label}</td>
                  <td className="px-3 py-2.5 font-bold tabular-nums text-market-accent">
                    {r.value !== null ? fmt(r.value) : <span className="font-semibold text-market-muted">Data pending</span>}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-market-muted">
                    {r.mom !== null && Number.isFinite(Number(r.mom)) ? `${Number(r.mom) > 0 ? '+' : ''}${fmt(r.mom)}% MoM` : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-market-muted">
                    {r.leading ? `${r.leading.city}${r.leading.province_code ? `, ${r.leading.province_code}` : ''} · ${fmt(r.leading.value)}/mo` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-4 text-[11px] leading-relaxed text-market-muted">
        Monthly searches are source-labeled estimates, not exact counts. The leading city appears only where city-level observations exist for that service; city data is never projected from national totals.
      </p>
    </section>
  );
}