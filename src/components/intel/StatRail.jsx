// Left rail of the dashboard: four verified readings, each with its basis and
// a share bar where a denominator exists. No value is ever invented — a
// missing record reads as a dash.
function Row({ title, value, note, share }) {
  return (
    <div className="border-b border-lm-line px-4 py-3.5 last:border-0">
      <div className="font-plex text-[9px] font-bold uppercase tracking-[0.16em] text-lm-muted">{title}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-heading text-[22px] font-extrabold leading-none text-lm-ink tabular-nums">{value ?? "—"}</span>
        {share != null && <span className="text-[11px] font-semibold text-lm-muted">{share}%</span>}
      </div>
      {share != null && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-lm-line">
          <div className="h-full rounded-full bg-lm-teal" style={{ width: `${Math.min(100, share)}%` }} />
        </div>
      )}
      <div className="mt-1.5 text-[11px] leading-snug text-lm-muted">{note}</div>
    </div>
  );
}

export default function StatRail({ cov, monitored, regionalName, regionalCount, loading }) {
  const verified = cov.verifiedCityNames?.length || 0;
  const matching = cov.matchingCityNames?.length || 0;
  const recruiting = cov.recruitingCityNames?.length || 0;
  const monitoredTotal = monitored || 0;
  const pct = (n) => (monitoredTotal ? Math.round((n / monitoredTotal) * 100) : null);

  return (
    <div className="overflow-hidden rounded-2xl border border-lm-line bg-lm-surface shadow-[0_1px_2px_rgba(18,61,55,0.04)]">
      <Row title="Verified coverage" value={`${verified}/${monitoredTotal || "—"}`} share={pct(verified)} note="Cities with a verified contractor" />
      <Row title="Regional focus" value={regionalName || "—"} note={regionalCount ? `${regionalCount} records observed` : "No records in this selection"} />
      <Row title="Matching activity" value={matching || "—"} note={matching ? "Cities matching open requests" : "No open matching activity"} />
      <Row title="Recruiting" value={loading ? "…" : recruiting || "—"} share={pct(recruiting)} note="Cities welcoming contractors" />
    </div>
  );
}