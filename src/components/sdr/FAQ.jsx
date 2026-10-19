import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "What areas do you serve?", a: "We cover Metro Vancouver and the BC Interior — Vancouver, Burnaby, Richmond, Surrey, Coquitlam (including Port Coquitlam and Port Moody), Kamloops and Kelowna. See the service area list above for neighbourhoods covered in each city." },
  { q: "How fast is same-day furniture removal?", a: "Book before noon and your furniture removal or junk disposal happens the same afternoon. Later bookings are scheduled for the next available slot." },
  { q: "How does pricing work?", a: "Pricing is based on the truck space your items take up. Pickups start at $139 for small loads and top out at $649 for a full truck, depending on your city. We give you a free on-site estimate and you approve the price before we lift a thing — no hidden fees." },
  { q: "What junk items do you take?", a: "Almost everything — furniture removal and sofa or mattress disposal, appliance pickup, electronics, hot tubs, yard waste, construction and renovation debris, garage and estate cleanout contents. We also pick up scrap metal for free within Vancouver (our minimum charge applies in other cities). If you're unsure, just ask." },
  { q: "What can't you take?", a: "Hazardous materials — paint, chemicals, asbestos, and fuel. Anything else, just ask." },
  { q: "What happens to my stuff?", a: "We sort every load: reusable furniture and household items go to donation partners, metal is recycled, and the rest is disposed of responsibly. Most loads avoid the landfill entirely." },
  { q: "Do I need to be home?", a: "Not for curbside pickup. Leave the items outside, pay less, and we handle the rest." },
];

export default function FAQ() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="bg-[#f4f7f5]">
      <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
        <div className="mb-10 text-center">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Good to know</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">FAQ</h2>
        </div>
        <div className="space-y-3">
          {faqs.map((f, i) => (
            <div key={f.q} className="rounded-2xl bg-white border border-slate-100 overflow-hidden">
              <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                <span className="font-bold text-[#0c3b24]">{f.q}</span>
                {open === i ? <Minus className="w-5 h-5 text-[#1d9e56] shrink-0" /> : <Plus className="w-5 h-5 text-[#1d9e56] shrink-0" />}
              </button>
              {open === i && <p className="px-5 pb-5 text-slate-600">{f.a}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}