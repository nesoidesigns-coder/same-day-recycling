import { CalendarCheck, Network, Recycle, Wallet } from "lucide-react";

// Transparency section — how the service actually works, in plain language.
// Built only from mechanisms already published on the site; no performance
// claims, no promises of confirmed work before a provider accepts.
const ITEMS = [
  {
    Icon: Wallet,
    title: "How pricing works",
    text: "You pay for the truck space your load fills. Starting rates are published before you request, extra items beyond the quoted scope are quoted separately, applicable taxes are added, and the final price is always approved by you before anything is loaded.",
  },
  {
    Icon: Network,
    title: "How provider matching works",
    text: "Your request goes to verified local providers whose coverage records include your city. We confirm who can actually take the job — a request is never treated as booked until a provider accepts.",
  },
  {
    Icon: CalendarCheck,
    title: "How pickup confirmation works",
    text: "Once a provider accepts, you get the confirmed arrival window and a tracking link. Until then your request is in matching — we never describe it as scheduled or confirmed.",
  },
  {
    Icon: Recycle,
    title: "How recycling and disposal are handled",
    text: "Every load is sorted for donation first, recycling second and responsible disposal last. You can request the recycling receipt that documents where your materials went.",
  },
];

export default function TransparencyPanel() {
  return (
    <section id="transparency" className="py-12 md:py-16">
      <div className="max-w-2xl">
        <h2 className="text-[26px] font-bold tracking-tight text-si-ink md:text-[32px]">Trust, in plain terms</h2>
        <p className="mt-2 text-sm text-si-muted md:text-base">
          Exactly how pricing, matching, confirmation and disposal work — so you always know what to expect.
        </p>
      </div>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ Icon, title, text }) => (
          <div key={title} className="rounded-[20px] border border-si-line bg-white p-5 shadow-sm">
            <span className="inline-flex size-10 items-center justify-center rounded-full bg-ri-mint/60 text-ri-forest">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="mt-3 text-sm font-bold text-si-ink">{title}</h3>
            <p className="mt-1.5 text-xs leading-relaxed text-si-muted">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}