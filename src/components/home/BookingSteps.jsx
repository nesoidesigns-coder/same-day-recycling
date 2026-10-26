import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// How booking works — three honest steps in sentence case, mint cards.
const STEPS = [
  { n: "1", title: "Describe what needs to go", desc: "List your items or describe the job in your own words — photos help, too." },
  { n: "2", title: "Approve your upfront price", desc: "You see a clear estimate based on truck space, and approve the final price before anything is loaded." },
  { n: "3", title: "We pick up, sort and recycle", desc: "A verified crew does all the carrying. Every load is sorted for donation, recycling, or responsible disposal — and you get the receipt." },
];

const JOURNEY = ["Discover a service", "Enter your location", "Describe your items", "Review your estimate", "Request pickup", "Provider confirms"];

export default function BookingSteps() {
  return (
    <section id="how-it-works" className="py-4">
      <div className="max-w-2xl">
        <h2 className="text-[26px] font-bold tracking-tight text-si-ink md:text-[32px]">How it works</h2>
        <p className="mt-2 text-sm text-si-muted md:text-base">From description to cleared space — usually in a single visit.</p>
      </div>

      {/* The customer journey — the last step is confirmed by a verified provider */}
      <ol className="mt-6 flex flex-wrap items-center gap-2" aria-label="Customer journey">
        {JOURNEY.map((stage, i) => (
          <li key={stage} className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-si-line bg-white px-3 py-1.5 text-xs font-bold text-ri-forest">
              <span className="inline-flex size-5 min-w-5 items-center justify-center rounded-full bg-ri-forest text-[10px] font-bold text-white">{i + 1}</span>
              {stage}
            </span>
            {i < JOURNEY.length - 1 && <ArrowRight className="size-3.5 shrink-0 text-si-muted" aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-si-muted">
        The final step is confirmed by a verified provider — until then, your request is in matching and we never call it scheduled.
      </p>

      <div className="mt-7 grid gap-4 md:grid-cols-3">
        {STEPS.map((s) => (
          <div key={s.n} className="rounded-[20px] border border-si-line bg-ri-mint/50 p-6 shadow-sm">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-ri-forest text-base font-bold text-white">{s.n}</span>
            <h3 className="mt-3 text-base font-bold text-si-ink">{s.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-si-muted">{s.desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Link
          to="/request-service"
          className="inline-flex items-center gap-1.5 rounded-full bg-ri-amber px-6 py-3 text-sm font-bold text-ri-charcoal transition-all hover:brightness-95"
        >
          Start my request <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}