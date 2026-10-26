// Small shared primitives for the cinematic Live Intelligence experience.
export function CineSectionLabel({ children }) {
  return <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-cine-cyan">{children}</div>;
}

export function CineCard({ id, title, note, children, className = "" }) {
  return (
    <section id={id} className={`cine-glass rounded-[24px] p-5 sm:p-6 ${className}`}>
      {title && <CineSectionLabel>{title}</CineSectionLabel>}
      {note && <p className="mt-1.5 text-xs leading-relaxed text-cine-muted">{note}</p>}
      {title && <div className="mt-4" aria-hidden="true" />}
      {children}
    </section>
  );
}

export function CineMetric({ label, value, note, tone = "cyan" }) {
  const tones = {
    cyan: "text-cine-cyan",
    arctic: "text-cine-arctic",
    violet: "text-cine-violet",
    slate: "text-cine-muted",
  };
  return (
    <div className="rounded-2xl border border-cine-line/60 bg-cine-surface/60 px-4 py-3.5" title={note}>
      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-cine-muted">{label}</div>
      <div className={`mt-1 text-xl font-extrabold tabular-nums ${tones[tone]}`}>{value}</div>
      {note && <div className="mt-0.5 text-[10px] leading-snug text-cine-muted">{note}</div>}
    </div>
  );
}