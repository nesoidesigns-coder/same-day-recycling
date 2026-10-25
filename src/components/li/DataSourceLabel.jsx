// Living Infrastructure — data-source label. Every metric names what is being
// measured, its scope, source, reporting period, update time and basis.
export default function DataSourceLabel({ what, scope, source, period, updatedAt, basis }) {
  return (
    <div className="font-plex text-[11px] leading-relaxed text-li-slate">
      <span className="font-semibold text-li-carbon">{what}</span>
      {scope && <> · {scope}</>}
      {period && <> · {period}</>}
      {basis && <> · {basis}</>}
      {source && <> · Source: {source}</>}
      {updatedAt && <> · Updated {updatedAt}</>}
    </div>
  );
}