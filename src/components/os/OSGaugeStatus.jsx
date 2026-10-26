// Gauge status line — semantic tones only:
// live (signal cyan) · collecting/pending (mist silver / amber) ·
// unavailable (coral). Green is reserved for verified success and is never
// used for a status the platform has not confirmed.
const STATE_TONES = {
  live: { dot: "bg-cine-cyan", text: "text-cine-cyan" },
  verified: { dot: "bg-cine-green", text: "text-cine-green" },
  collecting: { dot: "bg-cine-muted", text: "text-cine-muted" },
  pending: { dot: "bg-cine-amber", text: "text-cine-amber" },
  unavailable: { dot: "bg-cine-coral", text: "text-cine-coral" },
};

export default function OSGaugeStatus({ state = "live", label, className = "" }) {
  const tone = STATE_TONES[state] || STATE_TONES.collecting;
  return (
    <span className={`inline-flex items-center gap-1.5 font-plex text-[9px] font-bold uppercase tracking-[0.18em] ${tone.text} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
      {label}
    </span>
  );
}