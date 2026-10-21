import { ShieldCheck, Scale, Users, ArrowRight } from "lucide-react";

const BANDS = [
  { size: "Minimum pickup", weight: "Up to 200 lbs" },
  { size: "1/8 truck", weight: "200 - 350 lbs" },
  { size: "1/4 truck", weight: "350 - 700 lbs" },
  { size: "1/2 truck", weight: "700 - 1,400 lbs" },
  { size: "3/4 truck", weight: "1,400 - 2,100 lbs" },
  { size: "Full truck", weight: "2,100 - 2,800 lbs" },
];

const perks = [
  {
    icon: ShieldCheck,
    title: "Guaranteed pricing",
    text: "You pay the price you approve before we lift anything. If your load takes less truck space than estimated, you pay less — you'll never get a surprise hike when the crew arrives.",
  },
  {
    icon: Users,
    title: "Self-Load Discount",
    text: "Help the crew carry and save 10% off your job. Most haulers only offer full-service labor at full price — we think your effort should count.",
  },
  {
    icon: Scale,
    title: "Weight-based transparency",
    text: "Heavy but small-footprint items (concrete, shingles, scrap metal) shouldn't be priced like a bedroom full of junk. Every tier is mapped to a real weight band, so you pay for what you actually have.",
  },
];

export default function TransparentPricing() {
  return (
    <section id="transparent-pricing" className="bg-[#f4f7f5]">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">No games, no guesswork</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Transparent, weight-based pricing</h2>
          <p className="mt-4 text-slate-600">
            Other haulers quote "volume" and you find out the real number when a truck is already in your lane.
            We publish exactly what each price tier covers, guarantee the quote, and reward customers who lend a hand.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4 mb-10">
          {perks.map((p) => (
            <div key={p.title} className="rounded-3xl border border-slate-100 bg-white p-6">
              <span className="w-11 h-11 rounded-2xl bg-[#102B2A] text-[#187B65] flex items-center justify-center mb-4">
                <p.icon className="w-5 h-5" />
              </span>
              <div className="font-bold text-[#102B2A]">{p.title}</div>
              <p className="mt-2 text-sm text-slate-600">{p.text}</p>
            </div>
          ))}
        </div>
        <div className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 max-w-xl">
          <div className="text-sm font-bold text-[#102B2A] uppercase tracking-wide mb-4">What each price tier covers</div>
          <div className="divide-y divide-slate-100">
            {BANDS.map((b) => (
              <div key={b.size} className="flex items-center justify-between py-3">
                <span className="text-sm font-semibold text-[#102B2A]">{b.size}</span>
                <span className="text-sm font-bold text-[#187B65]">{b.weight}</span>
              </div>
            ))}
          </div>
          <a href="#quote" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-3.5 hover:bg-[#125C4E] transition-colors">
            Get my instant quote <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
}