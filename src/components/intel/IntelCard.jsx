// The one card surface of the intelligence dashboard: white, hairline border,
// generous radius, quiet shadow. Every panel on the page composes this so the
// dashboard can never drift out of the design language.
export default function IntelCard({ title, note, action, children, className = "", bodyClass = "p-4" }) {
  return (
    <section className={`rounded-2xl border border-lm-line bg-lm-surface shadow-[0_1px_2px_rgba(18,61,55,0.04)] ${className}`}>
      {(title || action) && (
        <header className="flex items-start justify-between gap-3 border-b border-lm-line px-4 pb-3 pt-3.5">
          <div className="min-w-0">
            {title && <h2 className="truncate font-heading text-sm font-bold text-lm-ink">{title}</h2>}
            {note && <p className="mt-0.5 text-[11px] leading-snug text-lm-muted">{note}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClass}>{children}</div>
    </section>
  );
}

export const label = "font-plex text-[10px] font-bold uppercase tracking-[0.16em] text-lm-muted";