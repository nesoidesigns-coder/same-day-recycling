import { Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import RexOrb from '@/components/rex/RexOrb';

// Contextual Rex assistance for the Observatory: never interrupts, never
// blocks the data — a compact card inviting context-aware help with local
// availability and booking. Opens the global Rex chat with a preset question
// so his first answer matches the section being explored.
export default function RexContextBar() {
  const ask = (question, kind) => {
    try {
      base44.analytics.track({ eventName: 'rex_context_open', properties: { section: 'demand', kind } });
    } catch { /* analytics must never block the interaction */ }
    window.dispatchEvent(new CustomEvent('rex:open', { detail: { question } }));
  };

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[#187B65]/40 bg-[#0a2e25] px-4 py-3 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <RexOrb state="idle" size={34} label="" />
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-sm font-extrabold text-market-ink"><Sparkles className="h-4 w-4 text-[#54D9AE]" />Exploring market intelligence?</p>
          <p className="text-xs text-market-muted">Rex can explain local availability or start your booking — no account needed.</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:flex-nowrap">
        <button
          onClick={() => ask('Which Canadian cities do you currently serve with verified contractors, and can I book a same-day pickup?', 'availability')}
          className="rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-[#125C4E]"
        >
          Ask Rex about my area
        </button>
        <button
          onClick={() => ask('I would like an instant quote for a junk removal pickup. What do you take, and how does pricing work?', 'quote')}
          className="rounded-full border border-market-accent px-4 py-2 text-xs font-bold text-market-accent transition-colors hover:bg-[#54D9AE]/10"
        >
          Get a quote from Rex
        </button>
      </div>
    </div>
  );
}