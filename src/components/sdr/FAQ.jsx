import { useState } from "react";
import { Plus, Minus } from "lucide-react";

export const faqs = [
  { q: "What areas do you serve?", a: "We accept service requests from every Canadian province and territory. Same-day fulfillment is our operating model, and whether your booking can be confirmed same-day depends on contractor availability in your area. We confirm your price and arrival window with you before anything is scheduled or charged." },
  { q: "How fast is same-day furniture removal?", a: "Book before noon and your furniture removal or junk disposal happens the same afternoon. Later bookings are scheduled for the next available slot." },
  { q: "How does pricing work?", a: "Pricing is based on the truck space your items take up. Pickups start at $139 for small loads and top out at $649 for a full truck, depending on your city. We give you a free on-site estimate and you approve the price before we lift a thing — no hidden fees." },
  { q: "What junk items do you take?", a: "Almost everything — furniture removal and sofa or mattress disposal, appliance pickup, electronics, hot tubs, yard waste, construction and renovation debris, garage and estate cleanout contents. Free scrap metal pickup is offered where a network partner is available, confirmed when you request it. If you're unsure, just ask." },
  { q: "What can't you take?", a: "Hazardous materials — paint, chemicals, asbestos, and fuel. Anything else, just ask." },
  { q: "What happens to my stuff?", a: "We sort every load: reusable furniture and household items go to donation partners, metal is recycled, and the rest is disposed of responsibly. Most loads avoid the landfill entirely." },
  { q: "Why does recycling matter?", a: "The published science is clear. In 2022 Canada diverted 27.1% of its solid waste, yet landfills still accounted for 17% of national methane emissions, and recycling aluminum uses about 95% less energy than making it from raw ore (sources: Environment and Climate Change Canada, International Aluminium Institute). Every load we sort keeps material out of that system." },
  { q: "Do I need to be home?", a: "Not for curbside pickup. Stage items in your driveway, lane or garage front and take $25 off with our Curbside Discount — no need to be home, and we text you the arrival window." },
  { q: "Can I get a quote from a photo?", a: "Yes — snap one photo of your junk and we'll send back a firm, no-obligation price. Use the photo quote tool above, or text your photo to (604) 849-1745." },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-[#f4f7f5]">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <div className="mb-10 text-center">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Good to know</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">FAQ</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={f.q} className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                <span className="font-bold text-[#102B2A]">{f.q}</span>
                {open === i ? <Minus className="w-5 h-5 text-[#187B65] shrink-0" /> : <Plus className="w-5 h-5 text-[#187B65] shrink-0" />}
              </button>
              {open === i && <p className="px-5 pb-5 text-slate-600">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}