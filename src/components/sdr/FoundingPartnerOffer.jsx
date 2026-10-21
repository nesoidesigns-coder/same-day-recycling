import { BadgeCheck, ArrowRight } from "lucide-react";

const LOCKED_TIERS = [
  { name: "Small markets", price: "$349/mo", note: "Towns and smaller regional cities" },
  { name: "Standard cities", price: "$499/mo", note: "Mid-size cities with solid search volume" },
  { name: "Metro territories", price: "$999/mo", note: "Major metros — full network push" },
];

export default function FoundingPartnerOffer() {
  return (
    <section className="bg-gold text-[#102B2A]">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] uppercase mb-4">
            <span className="w-8 h-px bg-[#102B2A]" />
            Founding Partner Program
          </div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Lock today's pricing while you stay in the network.</h2>
          <p className="mt-5 text-[#102B2A]/80 leading-relaxed">
            The network is new, and we're honest about it: the first partners arrive before the case
            studies exist. Founding partners pay today's rate — locked for as long as they remain in
            the network — no matter how much the machine proves itself later.
          </p>
          <p className="mt-3 text-[#102B2A]/80 leading-relaxed">
            In exchange, two things: you run the service standard, and you let us tell your numbers as a
            case study once they exist. That's the whole deal.
          </p>
        </div>
        <div>
          <div className="space-y-3">
            {LOCKED_TIERS.map((t) => (
              <div key={t.name} className="flex items-center justify-between rounded-2xl bg-[#102B2A] text-white px-5 py-4">
                <div>
                  <div className="font-bold">{t.name}</div>
                  <div className="text-xs text-emerald-200/80">{t.note}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{t.price}</div>
                  <div className="text-xs text-gold font-bold">rate locked while you stay in the network</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#102B2A]/10 font-bold px-4 py-2 text-sm">
              <BadgeCheck className="w-4 h-4" /> Founding intake is capped by our verification team's capacity — current availability is confirmed during your application call
            </span>
            <a href="#apply" className="inline-flex items-center gap-2 font-bold hover:underline">
              Apply as a Founding Partner <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}