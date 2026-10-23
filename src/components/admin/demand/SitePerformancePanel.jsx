import { money, fmt } from '@/components/admin/demand/format';

// Current capture data only — no old or stale figures. Values come straight
// from the report and show an explicit unavailable state when missing.
export function CurrentCapturePanel({ data }) {
  const capture = data?.capture || {};
  const gsc = capture.gsc || {}, ga = capture.ga || {}, os = capture.recycling_os || {};
  const rows = [
    ['Search Console clicks (28 days)', gsc.clicks, 'Measured clicks · reporting lag ~2 days'],
    ['Search Console impressions (28 days)', gsc.impressions, 'Measured impressions · never demand'],
    ['GA4 sessions (28 days)', ga.sessions, 'Measured sessions'],
    ['Verified platform inquiries', os.verified_inquiries, 'Operational records only'],
    ['Completed pickups', os.completed_pickups, 'Operational records only'],
  ];
  return <section className="mt-4 rounded-2xl border border-market-line bg-market-surface p-5">
    <h3 className="font-bold">Current measured performance (28-day and operational windows)</h3>
    <p className="mt-1 text-xs text-market-muted">Same Day Recycling's own measured capture — always separate from industry search estimates.</p>
    <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{rows.map(([label, value, note]) => (
      <li key={label} className="rounded-xl border border-market-line p-3">
        <div className="text-xs text-market-muted">{label}</div>
        <div className="mt-1 text-xl font-extrabold tabular-nums text-market-ink">{value == null ? '—' : fmt(value)}</div>
        <div className="mt-1 text-[11px] text-market-muted">{note}</div>
      </li>
    ))}</ul>
  </section>;
}

// Rex AI summary over the CURRENT report snapshot only, stored per period;
// past analyses stay in their own records and are never overwritten.
export function RexSummaryPanel({ period, available, topCategories, totalSearches, coverage }) {
  return <section className="mt-4 rounded-2xl border border-market-line bg-market-surface p-5">
    <div className="flex items-center gap-2">
      <h3 className="font-bold">Rex analysis of the current report</h3>
      <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-300">AI estimate</span>
    </div>
    <p className="mt-1 text-xs text-market-muted">AI interpretation of the reporting period on screen — not measured data.</p>
    {!available ? <p className="mt-3 text-sm text-market-muted">Demand estimates are not available yet, so Rex has nothing defensible to analyze for {period || 'this period'}.</p> : <ul className="mt-3 space-y-2 text-sm">
      <li>Search volume is concentrated in <strong>{topCategories.slice(0,3).map((c) => c.label).join(', ')}</strong>.</li>
      <li>{topCategories.at(-1)} shows the smallest recorded volume and may deserve a landing page.</li>
      <li>{coverage} verified provider cities are live today.</li>
    </ul>}
  </section>;
}

export default function DemandPanel({ data }) {
  const d = data || {};
  const capture = d.capture || {};
  const gsc = capture.gsc || {};
  return <section className="rounded-2xl border border-market-line bg-market-surface p-5 text-market-ink">
    <h3 className="font-bold">Separate measured performance</h3>
    <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Stat label="Impressions (28d)" value={gsc.impressions} />
      <Stat label="Clicks (28d)" value={gsc.clicks} />
      <Stat label="CTR" value={gsc.ctr != null ? `${gsc.ctr}%` : '—'} />
      <Stat label="Completed pickups" value={(capture.recycling_os || {}).completed_pickups} />
    </div>
    <p className="mt-3 text-xs text-market-muted">Measured site performance, never part of market demand.</p>
  </section>;
}

function Stat({ label, value }) {
  return <div className="rounded-xl border border-market-line p-3"><div className="text-xs text-market-muted">{label}</div><div className="mt-1 text-lg font-extrabold tabular-nums">{value == null ? '—' : fmt(value)}</div></div>;
}

export { money };