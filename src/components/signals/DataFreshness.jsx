// One consistent freshness label used by every Living Signals display:
// source, observation/update time and verification status.
const VERIFICATION_LABEL = {
  verified: { text: "Verified", tone: "text-ri-emerald-ink" },
  public: { text: "Public source", tone: "text-ri-slate" },
  aggregate: { text: "Aggregate data", tone: "text-ri-slate" },
};

const fmt = (iso) => {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleString("en-CA", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
};

export default function DataFreshness({ source, observedAt, updatedAt, verification = "verified", size = "sm", className = "" }) {
  const status = VERIFICATION_LABEL[verification] || VERIFICATION_LABEL.public;
  const updated = fmt(updatedAt) || fmt(observedAt);
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-0.5 font-plex text-xs text-ri-slate ${className}`}>
      {updated && <span>Updated {updated}</span>}
      {source && <span aria-hidden="true">·</span>}
      {source && <span>{source}</span>}
      <span className={`font-bold ${status.tone}`}>{status.text}</span>
    </div>
  );
}