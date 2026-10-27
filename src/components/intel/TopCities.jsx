// Top cities by observed demand — ranked, with a proportional bar. Ranking only
// reflects verified records for the selected window.
export default function TopCities({ cities = [], selected, onSelect }) {
  const rows = cities.slice(0, 5);
  const max = Math.max(1, ...rows.map((c) => c.count));

  if (!rows.length) {
    return <p className="py-6 text-center text-[12px] text-lm-muted">No city-level records in this window yet.</p>;
  }

  return (
    <ol className="space-y-2.5">
      {rows.map((c, i) => {
        const active = selected && String(selected).toLowerCase() === String(c.city).toLowerCase();
        return (
          <li key={c.city}>
            <button
              type="button"
              onClick={() => onSelect && onSelect(c.city)}
              className="flex w-full items-center gap-2.5 text-left"
            >
              <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full font-plex text-[10px] font-bold ${active ? "bg-lm-teal text-white" : "bg-lm-bg text-lm-muted"}`}>
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`truncate text-[12.5px] font-semibold ${active ? "text-lm-teal" : "text-lm-ink"}`}>{c.city}</span>
                  <span className="shrink-0 font-heading text-[12px] font-bold tabular-nums text-lm-muted">{c.count}</span>
                </span>
                <span className="mt-1 block h-1.5 w-full overflow-hidden rounded-full bg-lm-line">
                  <span className="block h-full rounded-full bg-lm-teal" style={{ width: `${(c.count / max) * 100}%` }} />
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}