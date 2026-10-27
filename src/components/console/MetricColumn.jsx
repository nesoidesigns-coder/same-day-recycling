// Left reading column: verified coverage, the regional focus, matching activity
// and recruiting — each with its denominator and a share bar. Missing records
// read as a dash; nothing is estimated.
function Row({ title, value, suffix, share, note, bars }) {
  return (
    <div className="border-b border-cn-line/50 px-3.5 py-3 last:border-0">
      <div className="console-label">{title}</div>
      <div className="mt-1 flex items-baseline gap-1.5">
        <span className="font-heading text-[19px] font-extrabold leading-none text-cn-ink tabular-nums">{value ?? "—"}</span>
        {suffix && <span className="text-[10.5px] font-semibold text-cn-muted">{suffix}</span>}
      </div>
      {share != null && (
        <div className="console-track mt-2 h-1 w-full overflow-hidden rounded-full">
          <div className="h-full rounded-full bg-cn-teal" style={{ width: `${Math.min(100, share)}%` }} />
        </div>
      )}
      {bars && (
        <div className="mt-2 flex h-6 items-end gap-1">
          {bars.map((b, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm bg-cn-teal/70"
              style={{ height: `${Math.max(8, b)}%` }}
            />
          ))}
        </div>
      )}
      <div className="mt-1.5 text-[10.5px] leading-snug text-cn-muted">{note}</div>
    </div>
  );
}

export default function MetricColumn({ cov, monitored, regionalName, regionalCount, microBars, loading }) {
  const verified = cov.verifiedCityNames?.length || 0;
  const recruiting = cov.recruitingCityNames?.length || 0;
  const matching = cov.matchingCityNames?.length || 0;
  const pct = (n) => (monitored ? Math.round((n / monitored) * 100) : 0);

  return (
    <section className="console-panel h-full">
      <Row
        title="Verified coverage"
        value={cov.loaded ? `${verified}/${monitored}` : "—"}
        suffix={cov.loaded ? `${pct(verified)}%` : ""}
        share={cov.loaded ? pct(verified) : null}
        note="Cities with an active, verified contractor on file."
      />
      <Row
        title="Regional focus"
        value={regionalName || "—"}
        suffix={regionalCount != null ? `${regionalCount} rec` : ""}
        bars={microBars}
        note={regionalName ? "Largest observed demand in the current window." : "Waiting for verified records."}
      />
      <Row
        title="Matching activity"
        value={cov.loaded ? matching : "—"}
        suffix={cov.loaded ? (matching === 1 ? "city" : "cities") : ""}
        note="Open requests being matched with contractors right now."
      />
      <Row
        title="Recruiting"
        value={cov.loaded ? recruiting : "—"}
        suffix={cov.loaded ? `${pct(recruiting)}%` : ""}
        share={cov.loaded ? pct(recruiting) : null}
        note="Cities where we are actively recruiting a local partner."
      />
    </section>
  );
}