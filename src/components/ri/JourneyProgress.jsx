import { Check } from "lucide-react";

const STEPS = ["Describe", "Understand", "Estimate", "Locate", "Confirm"];
// Each step is a link to the section of the page where it happens, so a
// customer can jump straight to the part of the journey they're on.
const TARGETS = ["#ri-intake", "#ri-intake", "#ri-intake", "#request-form", "#request-form"];

// Live journey progress for /request-service. `reached[i]` is true once step
// i's outcome exists anywhere on the page. A step counts as complete when it
// or any later step is reached, so skipping the smart intake never leaves
// earlier steps falsely pending.
export default function JourneyProgress({ reached = [] }) {
  let lastReached = -1;
  reached.forEach((r, i) => {
    if (r) lastReached = i;
  });

  return (
    <nav aria-label="Your service request journey">
      <ol className="flex items-start gap-1.5">
        {STEPS.map((label, i) => {
          const done = i <= lastReached;
          const current = i === lastReached + 1;
          return (
            <li key={label} className="min-w-0 flex-1">
              <a href={TARGETS[i]} aria-label={`Go to ${label}`} className="block group">
                <div
                  className={`h-1 rounded-full transition-colors duration-500 ${
                    done ? "bg-ri-emerald" : current ? "bg-ri-amber" : "bg-si-line"
                  }`}
                />
                <div className="mt-1.5 flex items-center gap-1">
                  {done ? (
                    <Check className="w-3 h-3 shrink-0 text-ri-emerald" />
                  ) : (
                    <span className={`font-plex text-[10px] leading-none ${current ? "text-ri-amber-ink" : "text-ri-slate/60"}`}>
                      {i + 1}
                    </span>
                  )}
                  <span
                    className={`truncate text-[10px] font-bold leading-none sm:text-xs ${
                      done ? "text-ri-emerald" : current ? "text-ri-amber-ink" : "text-ri-slate/60"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}