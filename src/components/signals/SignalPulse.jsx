import { useEffect, useRef, useState } from "react";

// One-shot pulse fired only when a displayed value actually changes to a new
// verified one. Never loops, never fires on load, never animates fabricated
// activity. Renders nothing when idle.
export default function SignalPulse({ trigger, label = "Updated with newly verified data" }) {
  const [on, setOn] = useState(false);
  const prev = useRef(trigger);

  useEffect(() => {
    if (prev.current === trigger) return; // stable when no new data
    prev.current = trigger;
    setOn(true);
    const t = setTimeout(() => setOn(false), 1800); // one animation, once
    return () => clearTimeout(t);
  }, [trigger]);

  if (!on) return null;
  return (
    <span className="relative inline-flex items-center" role="status" aria-label={label}>
      <span className="signal-pulse-dot block w-2 h-2 rounded-full bg-ri-amber" />
      <span className="signal-pulse-ring absolute inset-0 rounded-full border-2 border-ri-amber" />
      <span className="ml-1.5 font-plex text-[10px] font-bold text-ri-forest">{label}</span>
    </span>
  );
}