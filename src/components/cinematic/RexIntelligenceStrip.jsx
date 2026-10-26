import { Sparkles } from "lucide-react";
import { CineSectionLabel } from "./CinePrimitives";

// Rex as invisible intelligence: a quiet strip of contextual questions that
// open the existing Rex chat. No large chatbot visual — Rex explains what the
// visitor is looking at and guides the next step.
export default function RexIntelligenceStrip({ categoryLabel = "", city = "" }) {
  const ask = (question) =>
    window.dispatchEvent(new CustomEvent("rex:open", { detail: { question } }));

  const cat = categoryLabel || "junk removal";
  const place = city || "my city";
  const questions = [
    `What does ${cat.toLowerCase()} usually cost in ${place}?`,
    "What service options are available near me?",
    `Why is ${cat.toLowerCase()} demand changing?`,
    "Can I schedule a pickup today?",
  ];

  return (
    <div className="rounded-2xl border border-cine-line/60 bg-cine-surface/60 p-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-3.5 w-3.5 text-cine-violet" />
        <CineSectionLabel>Rex intelligence</CineSectionLabel>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-cine-muted">
        Rex reads the same verified records this page shows — and tells you plainly what is measured, what is an estimate, and what is unknown.
      </p>
      <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1">
        {questions.map((q) => (
          <button
            key={q}
            onClick={() => ask(q)}
            className="shrink-0 snap-start rounded-full border border-cine-line/70 bg-cine-bg/60 px-3.5 py-2 text-xs font-semibold text-cine-ink transition-colors hover:border-cine-cyan/60 hover:text-cine-cyan"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}