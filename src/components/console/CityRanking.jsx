// Top five cities by verified observations in the window, with a bar showing
// each city's share of the leader.
export default function CityRanking({ cities = [], selected, onSelect }) {
  const top = cities.slice(0, 5);
  const max = Math.max(1, ...top.map((c) => c.count));

  return (
    <section className="console-panel flex h-full flex-col p-3.5">
      <h2 className="font-heading text-[13.5px] font-bold text-cn-ink">Top cities by observed demand</h2>
      <p className="mt-0.5 text-[10.5px] text-cn-muted">Verified records only.</p>

      <div className="mt-2 flex-1">
        {!top.length && <p className="py-6 text-center text-[11.5px] text-cn-muted">No city records in this window.</p>}
        {top.map((c, i) => (
          <button
            key={c.city}
            onClick={() => onSelect?.(c.city)}
            className={`flex w-full items-center gap-2 rounded-lg px-1 py-1.5 text-left transition-colors ${
              selected === c.city ? "bg-white/5" : "hover:bg-white/5"
            }`}
          >
            <span className="w-3 shrink-0 font-plex text-[10px] font-bold text-cn-muted">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className={`truncate text-[11.5px] font-semibold ${selected === c.city ? "text-cn-teal" : "text-cn-ink"}`}>
                  {c.city}
                </span>
                <span className="font-plex text-[10.5px] font-bold text-cn-ink tabular-nums">{c.count}</span>
              </div>
              <div className="console-track mt-1 h-1 w-full overflow-hidden rounded-full">
                <div className="h-full rounded-full bg-cn-teal" style={{ width: `${(c.count / max) * 100}%` }} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}