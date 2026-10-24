import { Sparkles, Activity, Radio } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import RexOrb from '@/components/rex/RexOrb';

// Market Pulse hero: brands the demand experience, explains what the
// customer is looking at, and offers natural-language Rex discovery with
// preset questions. Reuses the global Rex chat via the rex:open event.
const QUICK_QUESTIONS = [
  { label: 'Mattress disposal in Vancouver', q: 'How do I dispose of a mattress in Vancouver?' },
  { label: 'Old refrigerator recycling', q: 'Can I recycle an old refrigerator?' },
  { label: 'Furniture removal cost', q: 'Is furniture removal expensive in Toronto?' },
  { label: 'Clear a whole apartment', q: 'What is the best way to clear an apartment?' },
  { label: 'Junk removed today', q: 'Can I get junk removed today?' },
];

const ask = (question) => {
  try {
    base44.analytics.track({ eventName: 'rex_context_open', properties: { section: 'market_pulse', kind: 'quick_question' } });
  } catch { /* analytics must never block the interaction */ }
  window.dispatchEvent(new CustomEvent('rex:open', { detail: { question } }));
};

export default function MarketPulseHero() {
  return (
    <section aria-label="Market Pulse" className="relative overflow-hidden rounded-3xl border border-market-line bg-market-surface px-5 py-8 sm:px-8 sm:py-10">
      {/* Subtle radar sweep — decorative but reduced-motion safe */}
      <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full border border-[#54D9AE]/15">
        <div className="absolute inset-6 rounded-full border border-[#54D9AE]/10" />
        <div className="absolute inset-16 rounded-full border border-[#54D9AE]/10" />
      </div>

      <div className="relative">
        <p className="flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-market-accent">
          <Radio className="h-4 w-4" />Market Pulse
          <span className="rounded-full bg-[#187B65] px-2 py-0.5 text-[9px] tracking-widest text-white">LIVE</span>
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-market-ink sm:text-4xl">Canadian Market Pulse</h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-market-muted">
          A living view of recycling and removal demand across Canada: verified service activity,
          regional interest, and what customers like you are asking — with Rex on hand to turn any
          signal into guidance, availability, or a booking.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <RexOrb state="idle" size={34} label="" />
          <span className="text-xs font-bold text-market-ink">Ask Rex anything on this page:</span>
          <Sparkles className="h-3.5 w-3.5 text-[#54D9AE]" />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {QUICK_QUESTIONS.map((item) => (
            <button
              key={item.q}
              onClick={() => ask(item.q)}
              className="rounded-full border border-market-accent/60 px-3.5 py-2 text-xs font-bold text-market-accent transition-colors hover:bg-[#54D9AE]/10"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-market-line pt-4 text-[11px] text-market-muted">
          <Activity className="h-3.5 w-3.5 text-[#54D9AE]" />
          <span>Every figure below comes from a verified record with its source, period and scope labeled. Nothing is estimated or simulated.</span>
        </div>
      </div>
    </section>
  );
}