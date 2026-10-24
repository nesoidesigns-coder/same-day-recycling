import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';

// Interactive service explorer for Market Pulse: every category explains
// itself, points at the right page (or the universal request flow), and can
// hand the question to Rex. No new booking or pricing logic — existing flows
// only.
const CATEGORIES = [
  { name: 'Furniture removal', path: '/furniture-removal', ask: 'How does furniture removal pricing work?', note: 'Sofas, dressers and full room clearances.' },
  { name: 'Appliance removal', path: '/appliance-removal', ask: 'Can you take an old fridge or stove?', note: 'Fridges, stoves, washers, dryers — safely handled and recycled.' },
  { name: 'Mattress disposal', path: '/request-service', ask: 'How do I dispose of a mattress?', note: 'Disposal rules vary by city; we handle it the local-approved way.' },
  { name: 'Scrap metal recycling', path: '/free-metal-pickup', ask: 'Is scrap metal pickup free?', note: 'Metal items are often picked up at no charge — metal has value.' },
  { name: 'Household junk removal', path: '/request-service', ask: 'What junk items do you take?', note: 'General clutter, boxes, broken furniture and mixed loads.' },
  { name: 'Renovation debris', path: '/request-service', ask: 'Can you haul renovation debris?', note: 'Drywall, lumber, flooring and fixtures from your project.' },
  { name: 'Yard waste', path: '/request-service', ask: 'Do you remove branches and yard waste?', note: 'Branches, brush and seasonal yard cleanups.' },
  { name: 'Electronics recycling', path: '/electronics-recycling', ask: 'How is e-waste recycled?', note: 'TVs, computers and electronics routed to certified recyclers.' },
  { name: 'Estate cleanouts', path: '/request-service', ask: 'How do estate cleanouts work?', note: 'Full-property clearances handled with care, room by room.' },
  { name: 'Commercial cleanouts', path: '/commercial-recycling', ask: 'Do you handle commercial cleanouts?', note: 'Offices, retail and property turnovers with scheduled pickups.' },
];

const askRex = (question) => {
  try {
    base44.analytics.track({ eventName: 'rex_context_open', properties: { section: 'market_pulse', kind: 'service_explorer' } });
  } catch { /* analytics must never block the interaction */ }
  window.dispatchEvent(new CustomEvent('rex:open', { detail: { question } }));
};

export default function ServiceExplorer() {
  return (
    <section aria-label="Service explorer" className="rounded-3xl border border-market-line bg-market-surface p-4 sm:p-6">
      <h2 className="text-xl font-extrabold text-market-ink sm:text-2xl">Explore services</h2>
      <p className="mt-1 text-xs text-market-muted">Pick what you need removed or recycled. Each card opens the matching page, or ask Rex first — pricing guidance included, never invented.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map((c) => (
          <div key={c.name} className="flex flex-col rounded-2xl border border-market-line bg-market-bg p-4 transition-colors hover:border-[#54D9AE]/50">
            <h3 className="text-sm font-extrabold text-market-ink">{c.name}</h3>
            <p className="mt-1 flex-1 text-xs leading-relaxed text-market-muted">{c.note}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Link
                to={c.path}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-[#125C4E]"
              >
                Get a quote <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <button
                onClick={() => askRex(c.ask)}
                className="inline-flex items-center gap-1.5 rounded-full border border-market-accent/60 px-3.5 py-2 text-xs font-bold text-market-accent transition-colors hover:bg-[#54D9AE]/10"
              >
                <Sparkles className="h-3.5 w-3.5" /> Ask Rex
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}