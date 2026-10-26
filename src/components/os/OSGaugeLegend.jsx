const chipClass = (active) =>
  `shrink-0 snap-start rounded-full px-3.5 py-2 text-xs font-bold transition-colors ${
    active ? "bg-cine-cyan text-[#0a1220]" : "border border-cine-line/70 text-cine-ink hover:border-cine-cyan/50"
  }`;

// Interactive gauge legend: the same category chips used beneath the
// instrument, so a legend selection and a sector selection always agree.
export default function OSGaugeLegend({ items = [], activeKey = null, onSelect, allLabel = "All categories", className = "" }) {
  return (
    <div className={`flex snap-x gap-2 overflow-x-auto pb-1 ${className}`}>
      <button onClick={() => onSelect?.("")} className={chipClass(!activeKey)}>
        {allLabel}
      </button>
      {items.map((it) => (
        <button key={it.key} onClick={() => onSelect?.(it.key)} className={chipClass(activeKey === it.key)}>
          {it.color && <span className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle" style={{ background: it.count ? it.color : "#3A4A63" }} />}
          {it.label} {it.count != null && <span className="tabular-nums opacity-70">{it.count}</span>}
        </button>
      ))}
    </div>
  );
}