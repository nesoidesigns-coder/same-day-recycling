import DataFreshness from "./DataFreshness";

// Compact card that translates one signal into actionable customer
// information. An InsightCard without verified backing data renders the
// explicit insufficient-data note instead of a guess.
const TONES = {
  emerald: "border-ri-emerald/25",
  amber: "border-ri-amber/35",
  slate: "border-si-line",
};

const TYPE_CHIP = {
  recorded_activity: { label: "Demand", tone: "bg-ri-emerald/10 text-ri-emerald" },
  search_interest: { label: "Search interest", tone: "bg-ri-amber/10 text-ri-amber" },
  contractor_availability: { label: "Availability", tone: "bg-ri-emerald/10 text-ri-emerald" },
  published_pricing: { label: "Pricing", tone: "bg-ri-mint text-ri-forest" },
};

export default function InsightCard({ title, text, signalType, source, observedAt, updatedAt, verification, emptyReason, className = "" }) {
  const chip = signalType ? TYPE_CHIP[signalType] : null;
  return (
    <div className={`rounded-2xl bg-white border shadow-sm p-4 flex flex-col ${TONES[signalType && TYPE_CHIP[signalType] ? (signalType === "search_interest" ? "amber" : "emerald") : "slate"]} ${className}`}>
      <div className="flex items-center gap-2">
        {chip && <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${chip.tone}`}>{chip.label}</span>}
        {title && <span className="text-xs font-bold text-ri-charcoal">{title}</span>}
      </div>
      {text ? (
        <p className="mt-2 text-xs text-ri-slate leading-relaxed flex-1">{text}</p>
      ) : (
        <p className="mt-2 text-xs text-ri-slate/70 leading-relaxed flex-1 italic">{emptyReason || "Insufficient verified data for this selection yet."}</p>
      )}
      <DataFreshness className="mt-3" source={source} observedAt={observedAt} updatedAt={updatedAt} verification={verification} size="xs" />
    </div>
  );
}