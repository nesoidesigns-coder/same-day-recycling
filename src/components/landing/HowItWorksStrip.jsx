import { Calculator, CalendarCheck, Truck } from "lucide-react";

const STEPS = [
  { n: 1, title: "Get your estimate", text: "Enter your postal code and tell us what needs to go — you see the price band right away.", Icon: Calculator },
  { n: 2, title: "Choose your time", text: "Pick the pickup window that works, same day where a verified contractor is available.", Icon: CalendarCheck },
  { n: 3, title: "We pick it up", text: "The crew confirms the price on arrival — you approve it before anything is lifted.", Icon: Truck },
];

export default function HowItWorksStrip() {
  return (
    <section className="mx-auto max-w-[1280px] px-4">
      <h2 className="font-heading text-[17px] font-extrabold tracking-tight text-lm-ink">How it works</h2>
      <div className="mt-2.5 grid gap-3 md:grid-cols-3">
        {STEPS.map(({ n, title, text, Icon }) => (
          <div key={n} className="flex items-start gap-3 rounded-xl border border-lm-line bg-white p-3.5">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[hsl(var(--ri-mint))] text-[hsl(var(--ri-emerald-ink))]">
              <Icon className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-plex text-[9px] font-bold uppercase tracking-[0.16em] text-lm-muted">Step {n}</span>
              </div>
              <div className="text-[12.5px] font-bold text-lm-ink">{title}</div>
              <p className="mt-0.5 text-[11px] leading-snug text-lm-muted">{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}