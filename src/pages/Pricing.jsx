import { Link } from "react-router-dom";
import { useSEO } from "@/lib/seo";
import { Truck, Scale, ShieldCheck, HandCoins, Phone, Recycle, XCircle } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";

const TIERS = [
  { label: "Minimum pickup", price: 139, weight: "Up to 200 lbs", example: "A few bags, a nightstand, odds and ends" },
  { label: "1/8 truck", price: 189, weight: "200 – 350 lbs", example: "A mattress, a couple of boxes, a small dresser" },
  { label: "1/4 truck", price: 269, weight: "350 – 700 lbs", example: "A sofa and love seat, or a small fridge" },
  { label: "1/2 truck", price: 419, weight: "700 – 1,400 lbs", example: "A studio apartment clear-out" },
  { label: "3/4 truck", price: 549, weight: "1,400 – 2,100 lbs", example: "A garage or basement clear-out" },
  { label: "Full truck", price: 649, weight: "2,100 – 2,800 lbs", example: "A full home or office clear-out" },
];

const GUARANTEES = [
  { icon: ShieldCheck, title: "The quoted price is the price you pay", text: "If your load takes less truck space than estimated, you pay less — you'll never get a surprise hike when the crew arrives." },
  { icon: Scale, title: "Weight-based transparency", text: "Every tier maps to a published weight band, so heavy-but-small loads (concrete, shingles, scrap metal) are priced fairly." },
  { icon: HandCoins, title: "Ways to save", text: "Help the crew carry and save 10% with the Self-Load Discount, or stage items curbside and get $25 off — no need to be home." },
];

const FAQS = [
  { q: "How much does junk removal cost?", a: "Pricing is based on the truck space your load fills, from a $139 minimum pickup up to about $649 for a full truck. The exact price depends on volume and weight, and the final price is confirmed on arrival before we lift anything." },
  { q: "How do I know what I'll pay before the crew arrives?", a: "Get an instant estimate with our online quote tool or from a photo, or call for a free no-obligation estimate. You approve the final price on arrival before we lift a thing — no surprise hikes." },
  { q: "Are there extra fees like fuel or dumping charges?", a: "No. Labor, loading, transport, sorting and disposal are all included in the tier price. No hidden fees, no scale surprises." },
  { q: "What can't you take?", a: "Hazardous materials — paint, chemicals, asbestos, fuel, solvents and propane tanks. Everything else that fits in a truck, we can usually take." },
  { q: "Which cities do you serve?", a: "We're a nationwide agency — service requests are accepted in every Canadian city. Our dispatch team arranges a qualified local contractor for each job, and the recycling directory covers every province and territory. Exact city pricing varies slightly; every quote shows your rate." },
  { q: "Are prices in CAD? Is tax included?", a: "All prices are in Canadian dollars (CAD). GST and/or PST — depending on the pickup address — are added when you approve the final price, and the full amount is shown before you pay." },
  { q: "Can I combine discounts?", a: "One discount per job: the Self-Load Discount (10%), the curbside staging discount ($25) and subscription member rates don't stack — we apply whichever saves you the most." },
];

export default function Pricing() {
  useSEO({
    title: "Junk Removal Pricing — Upfront Rates | Same Day Recycling",
    description: "Transparent junk removal pricing in Canadian dollars — single-item, half-load and full-load rates with recycling-first disposal. Get an instant quote online.",
    path: "/pricing",
  });
  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />

      <section className="bg-[#102B2A] text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 text-center">
          <div className="text-xs font-bold tracking-[0.15em] text-[#187B65] uppercase mb-3">How pricing works</div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
            How Much Does Junk Removal Cost?
          </h1>
          <p className="mt-4 text-emerald-100/85 max-w-2xl mx-auto leading-relaxed">
            You pay for the truck space your load actually fills — nothing more. Every tier maps to a real weight band, the price is approved by you before we lift a thing.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link to="/#book" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-3 hover:bg-[#1FA184] transition-colors">
              Get My Instant Quote
            </Link>
            <a href="tel:+16048491745" className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-white/30 text-white font-bold px-7 py-3 hover:bg-white/10 transition-colors">
              <Phone className="w-4 h-4" /> (604) 849-1745
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#102B2A] text-center">What each price tier covers</h2>
        <p className="text-center text-slate-600 mt-2 text-sm">Standard rates shown (exact city pricing varies slightly — your quote always shows your rate).</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {TIERS.map((t) => (
            <div key={t.label} className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-6">
              <div className="flex items-center gap-2 text-[#102B2A]">
                <Truck className="w-4 h-4 text-[#187B65]" />
                <span className="font-bold text-sm uppercase tracking-wide">{t.label}</span>
              </div>
              <div className="mt-3 text-3xl font-extrabold text-[#102B2A] tabular-nums">${t.price}</div>
              <div className="mt-1 text-sm font-bold text-[#187B65]">{t.weight}</div>
              <p className="mt-2 text-sm text-slate-600">{t.example}</p>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl bg-[#102B2A] text-white p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Recycle className="w-6 h-6 text-[#187B65] shrink-0" />
            <p className="text-sm text-emerald-100/85">Every load is sorted — recycled, donated, or responsibly disposed. Recycling receipts available for every job.</p>
          </div>
          <Link to="/#book" className="shrink-0 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 text-sm hover:bg-[#1FA184] transition-colors">
            Book a Pickup
          </Link>
        </div>
      </section>

      <section className="bg-[#f4f7f5] py-14">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#102B2A] text-center">No games, no guesswork</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {GUARANTEES.map((g) => (
              <div key={g.title} className="rounded-2xl bg-white border border-slate-200 p-6">
                <g.icon className="w-7 h-7 text-[#187B65]" />
                <h3 className="mt-3 font-bold text-[#102B2A]">{g.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{g.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#102B2A] text-center">Pricing facts, clearly stated</h2>
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <Scale className="w-7 h-7 text-[#187B65]" />
            <h3 className="mt-3 font-bold text-[#102B2A]">All prices in Canadian dollars (CAD)</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">Every rate on this page and in every quote is CAD. Applicable taxes (GST and/or PST, based on the pickup address) are added when you approve the final price and shown before you pay anything.</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <ShieldCheck className="w-7 h-7 text-[#187B65]" />
            <h3 className="mt-3 font-bold text-[#102B2A]">Fixed vs estimated — when each applies</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">Online, photo and phone quotes are estimates. The price becomes fixed only once you approve it on arrival, after the crew confirms volume and weight. Once approved, it doesn't change.</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <HandCoins className="w-7 h-7 text-[#187B65]" />
            <h3 className="mt-3 font-bold text-[#102B2A]">Discount stacking rules</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">One discount per job, whichever saves you the most: the Self-Load Discount (10%), the curbside staging discount ($25) and subscription member rates never combine.</p>
          </div>
          <div className="rounded-2xl bg-white border border-slate-200 p-6">
            <Truck className="w-7 h-7 text-[#187B65]" />
            <h3 className="mt-3 font-bold text-[#102B2A]">Load limits &amp; extra items</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">Each tier covers its published weight band. Loads over the band, or items needing special disposal, are quoted to you as additions before anything is loaded — never added silently.</p>
          </div>
          <div className="rounded-2xl bg-[#f4f7f5] border border-slate-200 p-6 md:col-span-2">
            <h3 className="font-bold text-[#102B2A]">Software OS and White Label are separate products</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">Junk-removal pricing above is for household and commercial pickups. <Link to="/software" className="font-semibold text-[#187B65] hover:underline">Software OS</Link> licenses our operating platform to independent haulers (setup fee + monthly or annual subscription). <Link to="/white-label" className="font-semibold text-[#187B65] hover:underline">White Label</Link> runs the same platform under your own brand with different setup terms. Realtor and property-manager partner rates are set separately — see <Link to="/realtors" className="font-semibold text-[#187B65] hover:underline">Realtors</Link> and <Link to="/subscriptions" className="font-semibold text-[#187B65] hover:underline">Subscriptions</Link>.</p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#102B2A] text-center">Pricing questions, answered</h2>
        <div className="mt-8 space-y-4">
          {FAQS.map((f) => (
            <div key={f.q} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-[#102B2A]">{f.q}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-2xl border border-slate-200 bg-[#f4f7f5] p-5 flex items-start gap-3">
          <XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600"><span className="font-bold text-[#102B2A]">What we can't take:</span> hazardous materials — paint, chemicals, asbestos, fuel, solvents, propane tanks.</p>
        </div>
        <div className="mt-10 text-center">
          <Link to="/#book" className="inline-block rounded-full bg-[#187B65] text-[#102B2A] font-bold px-8 py-4 hover:bg-[#1FA184] transition-colors">
            Get My Instant Quote
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}