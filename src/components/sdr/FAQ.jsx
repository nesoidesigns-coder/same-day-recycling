import { useState } from "react";
import { Plus, Minus } from "lucide-react";

const faqs = [
  { q: "How fast is same-day?", a: "Book before noon and we're usually there the same afternoon. Later bookings are scheduled for the next available slot." },
  { q: "How does pricing work?", a: "Pricing is based on the truck space used. We give you a free on-site estimate and you approve the price before we lift a thing." },
  { q: "What can't you take?", a: "Hazardous materials — paint, chemicals, asbestos, and fuel. Anything else, just ask." },
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