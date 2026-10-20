import { useState, useEffect } from "react";
import { CalendarCheck, Quote, Clock, Home, Truck, Recycle, Leaf, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

const STEPS = [
  {
    icon: CalendarCheck,
    title: "1. Book online or by phone",
    text: "Tell us what furniture needs to go — a quick online form or one call. A photo of the load gets you the sharpest quote.",
  },
  {
    icon: Quote,
    title: "2. Get an upfront quote",
    text: "We price by truck space, not hourly guessing. The range is confirmed before we lift a thing — the price you approve is the price you pay.",
  },
  {
    icon: Clock,
    title: "3. Lock in your window",
    text: "Book before noon and your furniture is usually gone that same afternoon. Every pickup comes with a tight arrival window.",
  },
  {
    icon: Truck,
    title: "4. The crew does all the lifting",
    text: "From the basement, the balcony or a narrow hallway — no need to disassemble, carry or sweep. We take it apart, haul it and tidy up.",
  },
  {
    icon: Recycle,
    title: "5. Sorted for donation and recycling",
    text: "Usable furniture is donated first, the rest is recycled through proper facilities — and you get a receipt showing where everything went.",
  },
];

const ITEMS = [
  "Sofas, couches & sectionals", "Loveseats & recliners", "Mattresses & box springs",
  "Dining tables & chairs", "Dressers & wardrobes", "Bed frames & headboards",
  "Desks & office chairs", "Bookshelves & media units", "Coffee & end tables",
  "Futons & daybeds", "Patio & outdoor furniture", "Hot tubs & pool tables",
];

const ECO = [
  "Donation partners get first pick of usable furniture",
  "Metal frames, springs and hardware sent to recyclers",
  "Mattresses and wood recycled through proper BC facilities",
  "A Recycling Receipt emailed for every load, showing where items went",
];

export default function FurnitureRemoval({ cityName }) {
  const [ecoReady, setEcoReady] = useState(false);
  useEffect(() => { setEcoReady(true); }, []);

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Sofa &amp; furniture removal</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">
            Same-day furniture pickup in {cityName}, step by step
          </h2>
          <p className="mt-4 text-slate-600">
            From a single couch to a whole room's worth of furniture — here's exactly how your same-day pickup works.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <ol className="space-y-4">
              {STEPS.map((s) => (
                <li key={s.title} className="rounded-2xl border border-slate-100 bg-[#f4f7f5] p-5 flex gap-4">
                  <span className="w-10 h-10 shrink-0 rounded-xl bg-[#1d9e56]/15 text-[#1d9e56] flex items-center justify-center">
                    <s.icon className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-[#0c3b24] text-sm">{s.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{s.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-100 bg-[#f4f7f5] p-6 md:p-8">
              <h3 className="text-lg font-bold text-[#0c3b24] mb-4 flex items-center gap-2">
                <Home className="w-5 h-5 text-[#1d9e56]" /> Furniture we pick up
              </h3>
              <ul className="grid sm:grid-cols-2 gap-2">
                {ITEMS.map((item) => (
                  <li key={item} className="flex gap-2 text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-[#1d9e56] shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-xs text-slate-500 mt-4">
                Don't see your item? If we can lift it, we can usually take it — call (604) 849-1745 and ask.
              </p>
            </div>

            <div className={`rounded-3xl bg-[#0c3b24] text-white p-6 md:p-8 transition-opacity duration-700 ${ecoReady ? "opacity-100" : "opacity-0"}`}>
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Leaf className="w-5 h-5 text-[#1d9e56]" /> Where your furniture goes
              </h3>
              <p className="text-sm text-white/80 mb-4">
                Basic haulers take your furniture straight to the dump. We don't — every load is sorted, and you get the proof.
              </p>
              <ul className="space-y-2.5">
                {ECO.map((e) => (
                  <li key={e} className="flex gap-2 text-sm text-white/90">
                    <Recycle className="w-4 h-4 text-[#1d9e56] shrink-0 mt-0.5" />
                    {e}
                  </li>
                ))}
              </ul>
              <Link
                to="/blog"
                className="mt-5 inline-block text-sm font-bold text-[#1d9e56] hover:underline"
              >
                Read our BC recycling guide →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}