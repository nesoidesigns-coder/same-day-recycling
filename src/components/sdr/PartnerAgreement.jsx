import { MapPin, Users, ShieldCheck, AlertTriangle } from "lucide-react";

const terms = [
  {
    icon: MapPin,
    title: "Exclusivity is metro, not a city line",
    text: "Every metro is one market — one partner serves it. Edmonton is one market; Calgary is another. The agreement defines exclusivity by market boundaries, not by municipal lines.",
  },
  {
    icon: Users,
    title: "Who owns the customer",
    text: "Jobs the machine books come to you through the network, and those customer relationships stay with the network. Your own customers are always yours — the network never touches your existing book.",
  },
  {
    icon: ShieldCheck,
    title: "Service standards",
    text: "The same-day standard, your certificate of insurance on file, the quoted price honored on arrival, and a recycling receipt for every completed job. The agreement makes the network's promises yours to keep.",
  },
  {
    icon: AlertTriangle,
    title: "What ends a partnership",
    text: "No-shows, bait-and-switch pricing, or conduct that burns the name end the agreement — and the territory reopens for the next partner. One bad operator doesn't get to torch a national brand.",
  },
];

export default function PartnerAgreement() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="max-w-2xl">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Before you sign</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">The agreement, in plain English</h2>
          <p className="mt-4 text-slate-600">
            You sign a written agreement before your territory activates. The structure is a service
            agency and trademark license — not a franchise — and the final form is reviewed by
            independent counsel before the first signature. This summary is not a substitute for the
            signed document.
          </p>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 gap-4">
          {terms.map((t) => (
            <div key={t.title} className="rounded-3xl border border-slate-100 bg-[#f4f7f5] p-6">
              <span className="w-10 h-10 rounded-xl bg-[#1d9e56]/10 flex items-center justify-center mb-4">
                <t.icon className="w-5 h-5 text-[#1d9e56]" />
              </span>
              <h3 className="font-bold text-[#0c3b24]">{t.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{t.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}