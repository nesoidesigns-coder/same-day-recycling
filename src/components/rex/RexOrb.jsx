const STATE_LABELS = {
  idle: "Rex is online",
  listening: "Rex is listening",
  processing: "Rex is thinking",
  success: "Done",
  attention: "Needs your attention",
};

// Rex's visual identity: a small presence orb carrying a real state —
// never a fake "AI working" animation. States map to actual conditions
// (a send in flight, a reply landing, or an action needing a human).
export default function RexOrb({
  state = "idle",
  size = 16,
  label,
  showLabel = true,
  className = "",
}) {
  const text = label || STATE_LABELS[state] || STATE_LABELS.idle;
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`} role="status" aria-label={text}>
      <span
        className={`rex-orb rex-orb--${state}`}
        style={{ width: size, height: size }}
        aria-hidden="true"
      >
        <span className="rex-orb__core" />
      </span>
      {showLabel && text ? (
        <span className="font-semibold leading-none">{text}</span>
      ) : null}
    </span>
  );
}