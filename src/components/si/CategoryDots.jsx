import { cn } from "@/lib/utils";

// CategoryDots — the one indicator language for service categories.
//
// A small colour dot, the category name, then its verified count: the busiest
// categories read turquoise, the quieter ones soft cyan, and the "All"
// control is the filled forest pill. Presentation only — every count comes
// from the caller, nothing is estimated here.

const BUSY_COUNT = 5;

export default function CategoryDots({
  items = [],
  activeKey = null,
  onSelect,
  allLabel = "All categories",
  className = "",
}) {
  const busy = new Set(
    [...items]
      .sort((a, b) => (b.count || 0) - (a.count || 0))
      .slice(0, BUSY_COUNT)
      .map((i) => i.key)
  );

  return (
    <div
      className={cn(
        "flex snap-x items-center gap-x-4 gap-y-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className
      )}
    >
      <button
        onClick={() => onSelect?.("")}
        className={cn(
          "shrink-0 snap-start rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors",
          !activeKey ? "bg-ri-forest text-white" : "text-ri-slate hover:text-ri-charcoal"
        )}
      >
        {allLabel}
      </button>
      {items.map((it) => {
        const active = activeKey === it.key;
        return (
          <button
            key={it.key}
            onClick={() => onSelect?.(active ? "" : it.key)}
            aria-pressed={active}
            className={cn(
              "inline-flex shrink-0 snap-start items-center gap-1.5 whitespace-nowrap text-xs transition-colors",
              active ? "font-bold text-ri-forest" : "font-medium text-ri-slate hover:text-ri-charcoal"
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                "size-1.5 shrink-0 rounded-full",
                busy.has(it.key) ? "bg-lm-turquoise" : "bg-lm-cyan",
                active && "ring-2 ring-ri-forest/25 ring-offset-2 ring-offset-white"
              )}
            />
            {it.label}
            {it.count ? <span className="text-[11px] tabular-nums text-si-muted">{it.count}</span> : null}
          </button>
        );
      })}
    </div>
  );
}