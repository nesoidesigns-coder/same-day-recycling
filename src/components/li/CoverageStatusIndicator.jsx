// Living Infrastructure — coverage status. Colour is never the only signal:
// every state carries a text label.
const STATES = {
  verified: { text: "Confirmed availability", dot: "bg-[#176B52]" },
  onboarding: { text: "Matching in progress", dot: "bg-[#D99636]" },
  unverified: { text: "Not yet confirmed", dot: "bg-[#64736E]" },
  unknown: { text: "Unknown", dot: "bg-[#64736E]" },
};

export default function CoverageStatusIndicator({ status }) {
  const s = STATES[status] || STATES.unknown;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-li-steel bg-li-pale px-2.5 py-1 text-xs font-semibold text-li-carbon">
      <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} aria-hidden="true" />
      {s.text}
    </span>
  );
}