import { useEffect } from "react";
import { Printer, Recycle, CalendarCheck, Home, Building2, DollarSign, ShieldCheck, Clock, Phone, Quote, Key, Sparkles, Timer } from "lucide-react";
import RealtorLeadForm from "@/components/sdr/RealtorLeadForm";
import RexBanner from "@/components/sdr/RexBanner";

const SEO_TITLE = "Junk Removal Services for Real Estate Professionals | Realtor Partners";
const SEO_DESCRIPTION = "Partner with Same Day Recycling to expedite your property sales. Fast, reliable junk removal for realtors and estate cleanouts across Canada.";

const BENEFITS = [
  {
    icon: Home,
    title: "Listings sold, not staged around clutter",
    text: "Estate cleanouts and pre-listing junk removal finished the same day — so photos and showings aren't delayed by a garage or basement full of stuff.",
  },
  {
    icon: Clock,
    title: "Same-day turnaround",
    text: "Book before noon and we haul that afternoon. Perfect for closing-day surprises, last-minute staging and tenant move-out leftovers.",
  },
  {
    icon: DollarSign,
    title: "Upfront pricing, one invoice",
    text: "Flat rates by load size, quoted before we lift anything. Bill the estate, the seller or yourself — one receipt, no hourly surprises.",
  },
  {
    icon: Recycle,
    title: "Eco-friendly disposal your sellers can feel good about",
    text: "We recycle and donate everything salvageable — a story worth telling in your listing and your marketing.",
  },
];

const SCENARIOS = [
  "Estate and downsizing cleanouts, handled discreetly and fast",
  "Pre-listing decluttering: garages, basements, sheds, hot tubs",
  "Tenant turnover and eviction junk hauls for landlords and strata managers",
  "Closing-day leftovers: furniture the buyers didn't want, gone before possession day",
];

export default function RealtorOnePager() {
  useEffect(() => {
    document.title = SEO_TITLE;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute("content", SEO_DESCRIPTION);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", SEO_TITLE);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", SEO_DESCRIPTION);
  }, []);

  return (
    <div className="min-h-screen bg-[#f4f7f5] print:bg-white">
      <div className="print:hidden">
        <RexBanner message="Print this or send it — I do the cleanouts, you do the selling." />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-10 print:p-0">
        <div className="flex justify-end mb-4 print:hidden">
          <button
            onClick={() => window.print()}
            className="rounded-full bg-[#102B2A] text-white font-bold px-5 py-2.5 hover:bg-[#0a3020] transition-colors text-sm flex items-center gap-2"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm print:rounded-none print:shadow-none print:border-0">
          {/* Header */}
          <div className="bg-[#102B2A] text-white rounded-t-3xl px-8 py-8 print:rounded-none">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-10 h-10 rounded-lg bg-[#187B65] text-[#102B2A] flex items-center justify-center">
                <Recycle className="w-5 h-5" />
              </span>
              <span className="text-xl font-bold">Same Day Recycling</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold leading-tight">
              Junk gone the same day your listing needs it gone.
            </h1>
            <p className="mt-2 text-white/80 text-sm md:text-base">
              Same-day junk removal &amp; furniture disposal for realtors across Canada's major cities.
            </p>
          </div>

          <div className="px-8 py-8 space-y-8">
            {/* Why realtors */}
            <section>
              <h2 className="text-lg font-bold text-[#102B2A] flex items-center gap-2 mb-4">
                <Home className="w-5 h-5 text-[#187B65]" /> Why realtors call us first
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {BENEFITS.map((b) => (
                  <div key={b.title} className="rounded-2xl bg-[#f4f7f5] p-4 print:border print:border-slate-200">
                    <b.icon className="w-5 h-5 text-[#187B65] mb-2" />
                    <h3 className="font-bold text-[#102B2A] text-sm">{b.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{b.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Scenarios */}
            <section>
              <h2 className="text-lg font-bold text-[#102B2A] flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 text-[#187B65]" /> Built for your deals
              </h2>
              <ul className="space-y-2">
                {SCENARIOS.map((s) => (
                  <li key={s} className="flex gap-2 text-sm text-slate-700">
                    <CalendarCheck className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </section>

            {/* Open-house clutter-free */}
            <section>
              <h2 className="text-lg font-bold text-[#102B2A] flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-[#187B65]" /> Keep every open house clutter-free
              </h2>
              <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                Clutter kills offers. We clear listings before they cost you money — at every stage of the sale:
              </p>
              <ul className="space-y-2">
                {[
                  "Before listing photos: declutter the shot before the photographer arrives",
                  "Before showings: furniture the sellers never moved is gone same day",
                  "Between open houses: leftover staging and buyer-survey items hauled fast",
                  "Before possession: vacant-property sweeps so keys hand over clean",
                ].map((s) => (
                  <li key={s} className="flex gap-2 text-sm text-slate-700">
                    <Key className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            </section>

            {/* Testimonial */}
            <section className="rounded-2xl bg-[#f4f7f5] p-5 print:border print:border-slate-200">
              <Quote className="w-5 h-5 text-[#187B65] mb-2" />
              <p className="text-sm text-[#102B2A] leading-relaxed italic">
                "I called at 9am about a hoarder-condition condo in Mount Pleasant, had the cleanout quote by 9:40 and the whole unit cleared by 3 the same afternoon. Photos were staged the next morning. I've stopped using anyone else for pre-listing cleanouts."
              </p>
              <p className="text-xs font-bold text-[#102B2A] mt-3">
                Melissa C. — REALTOR®
              </p>
              <p className="text-xs text-slate-500">Same-day turnaround, pre-listing cleanout</p>
            </section>

            {/* How it works */}
            <section>
              <h2 className="text-lg font-bold text-[#102B2A] flex items-center gap-2 mb-3">
                <ShieldCheck className="w-5 h-5 text-[#187B65]" /> How it works
              </h2>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { step: "1", text: "Book online in 2 minutes or call us directly — send us photos of the items if it's easier." },
                  { step: "2", text: "We confirm an upfront flat price by load size and arrive the same day when booked before noon." },
                  { step: "3", text: "We lift, sweep up and leave — recycling and donating everything salvageable." },
                ].map((s) => (
                  <div key={s.step} className="rounded-2xl bg-[#f4f7f5] p-4 print:border print:border-slate-200">
                    <div className="w-7 h-7 rounded-full bg-[#187B65] text-[#102B2A] font-bold flex items-center justify-center text-sm mb-2">{s.step}</div>
                    <p className="text-sm text-slate-700 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Bulk cleanout rates */}
            <section>
              <h2 className="text-lg font-bold text-[#102B2A] flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-[#187B65]" /> Bulk cleanout rates for listings
              </h2>
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[#102B2A] text-white">
                      <th className="text-left px-4 py-3 font-bold">Load size</th>
                      <th className="text-left px-4 py-3 font-bold">What that looks like</th>
                      <th className="text-right px-4 py-3 font-bold">Flat rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      ["Minimum pickup", "A few boxes, one chair, small curbside pile", "$139"],
                      ["1/8 truck", "Single mattress, end tables, a few garbage bags", "$189"],
                      ["1/4 truck", "One sofa or loveseat, small appliance, boxes from one room", "$299"],
                      ["1/2 truck", "Living-room furniture set, fridge + stove, basement corner", "$419"],
                      ["3/4 truck", "Full bedroom + living room set, garage cleanout", "$549"],
                      ["Full truck", "Whole-house estate cleanout, hot tub, renovation debris", "$649"],
                    ].map(([size, example, rate], i) => (
                      <tr key={size} className={i % 2 ? "bg-[#f4f7f5]" : "bg-white"}>
                        <td className="px-4 py-3 font-bold text-[#102B2A]">{size}</td>
                        <td className="px-4 py-3 text-slate-600">{example}</td>
                        <td className="px-4 py-3 text-right font-bold text-[#187B65]">{rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Flat rates by truck space, confirmed before we lift anything. Scrap metal picked up free. Rates shown are national network pricing. Realtor referral credit applies to every completed job.
              </p>
            </section>

            {/* Referral + rates */}
            <section className="grid sm:grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-[#187B65] p-5">
                <h3 className="font-bold text-[#102B2A] text-sm flex items-center gap-2"><DollarSign className="w-4 h-4 text-[#187B65]" /> Realtor referral credit</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">$25 credit for every completed job you send our way — stackable, paid back to you or applied to your client's invoice.</p>
              </div>
              <div className="rounded-2xl border-2 border-[#187B65] p-5">
                <h3 className="font-bold text-[#102B2A] text-sm flex items-center gap-2"><Building2 className="w-4 h-4 text-[#187B65]" /> Property manager plan</h3>
                <p className="text-sm text-slate-600 mt-1 leading-relaxed">For strata and rental portfolios: $299/month covers up to 4 pickups — ideal for ongoing turnover cleanouts.</p>
              </div>
            </section>

            {/* Priority Scheduling */}
            <section className="rounded-2xl border-2 border-[#187B65] bg-white p-5 print:p-5">
              <h2 className="font-bold text-[#102B2A] text-sm flex items-center gap-2 mb-3">
                <Timer className="w-4 h-4 text-[#187B65]" /> Priority Scheduling — realtor partners only
              </h2>
              <ul className="space-y-2">
                {[
                  "Same-day slots reserved for partner agents, even on busy days",
                  "Text-your-job priority line: (604) 849-1745 — partners jump the queue",
                  "Flexible rebooking around showings, inspections and closing dates",
                  "Before/after photos emailed for your file and your seller",
                ].map((p) => (
                  <li key={p} className="flex gap-2 text-sm text-slate-700">
                    <CalendarCheck className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-3">
                Priority scheduling is activated with your first partner job — no fee, no commitment.
              </p>
            </section>

            {/* Lead form */}
            <section className="print:hidden">
              <h2 className="text-lg font-bold text-[#102B2A] flex items-center gap-2 mb-3">
                <CalendarCheck className="w-5 h-5 text-[#187B65]" /> Book a property cleanout
              </h2>
              <RealtorLeadForm />
            </section>

            {/* CTA / footer */}
            <section className="rounded-2xl bg-[#102B2A] text-white px-6 py-6 text-center">
              <p className="font-bold text-lg">Book before noon — we haul the same day.</p>
              <p className="text-white/80 text-sm mt-1">Upfront pricing approved before we lift a thing. Eco receipts on every job.</p>
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a href="tel:+16048491745" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 text-sm flex items-center gap-2">
                  <Phone className="w-4 h-4" /> (604) 849-1745
                </a>
                <span className="text-sm text-white/80 font-medium">samedayrecycling.ca</span>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}