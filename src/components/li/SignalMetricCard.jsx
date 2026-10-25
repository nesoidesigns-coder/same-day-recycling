// Living Infrastructure — signal metric card: big verified figure with honest
// sourcing beneath. Skeleton while loading; dash when data is unavailable.
export default function SignalMetricCard({ label, value, source, updatedAt, loading }) {
  return (
    <div className="rounded-[14px] border border-li-steel bg-white p-4">
      <div className="text-sm font-semibold text-li-carbon">{label}</div>
      {loading ? (
        <div className="mt-2 h-7 w-16 animate-pulse rounded bg-li-pale" />
      ) : (
        <div className="mt-2 font-plex text-[26px] md:text-[28px] font-semibold leading-none text-li-forest tabular-nums">{value}</div>
      )}
      {source && (
        <div className="mt-2 font-plex text-[11px] leading-snug text-li-slate">
          {source}{updatedAt ? ` · ${updatedAt}` : ""}
        </div>
      )}
    </div>
  );
}