import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Loader2, Scale } from "lucide-react";
import { CITIES } from "@/lib/cities";

const ITEMS = [
  { name: "Sofa", lbs: 100 }, { name: "Loveseat", lbs: 60 }, { name: "Mattress", lbs: 60 },
  { name: "Box spring", lbs: 50 }, { name: "Dining table", lbs: 70 }, { name: "Dresser", lbs: 100 },
  { name: "Fridge", lbs: 250 }, { name: "Washer", lbs: 200 }, { name: "Dryer", lbs: 130 },
  { name: "Stove", lbs: 160 }, { name: "Dishwasher", lbs: 90 }, { name: "Treadmill", lbs: 250 },
  { name: "TV", lbs: 60 }, { name: "Bags/boxes of junk", lbs: 30 },
];

const FULL_TRUCK_LBS = 2800;

export default function WeightCalculator({ onBook }) {
  const [qty, setQty] = useState({});
  const [city, setCity] = useState("");
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  const weight = ITEMS.reduce((sum, it) => sum + (qty[it.name] || 0) * it.lbs, 0);
  const eighths = weight > 0 ? Math.min(FULL_TRUCK_LBS, weight) / (FULL_TRUCK_LBS / 8) : 0;
  const overFull = weight > FULL_TRUCK_LBS;

  useEffect(() => {
    clearTimeout(timer.current);
    if (weight <= 0) { setQuote(null); setLoading(false); return; }
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const payload = { load_eighths: eighths };
        if (city) payload.city = city;
        const res = await base44.functions.invoke("quoteEstimate", payload);
        setQuote(res.data);
      } catch {
        // keep the last estimate visible
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer.current);
  }, [weight, eighths, city]);

  const bump = (name, d) => setQty((q) => ({ ...q, [name]: Math.max(0, (q[name] || 0) + d) }));
  const itemsText = ITEMS.filter((it) => qty[it.name] > 0)
    .map((it) => (qty[it.name] > 1 ? `${qty[it.name]} × ${it.name}` : it.name))
    .join(", ");

  return (
    <section id="weight-calculator" className="bg-[#f4f7f5]">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Weight-based pricing</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Price your load by weight</h2>
          <p className="mt-4 text-slate-600">
            Tap the items you're getting rid of — we estimate the weight for you and map it to a published weight band,
            so you see your transparent price before booking.
          </p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 md:p-8">
            <label className="block mb-6">
              <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Your city</span>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="input">
                <option value="">Standard rates (any city)</option>
                {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            <div className="grid sm:grid-cols-2 gap-2">
              {ITEMS.map((it) => (
                <div key={it.name} className="flex items-center justify-between bg-[#f4f7f5] rounded-xl border border-slate-100 px-3 py-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[#0c3b24] truncate">{it.name}</div>
                    <div className="text-[11px] font-semibold text-slate-400">~{it.lbs} lbs each</div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button type="button" onClick={() => bump(it.name, -1)} aria-label={`Remove ${it.name}`} className="w-7 h-7 rounded-full bg-white hover:bg-slate-200 flex items-center justify-center">
                      <span className="text-slate-600 font-bold text-sm leading-none">−</span>
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-[#0c3b24]">{qty[it.name] || 0}</span>
                    <button type="button" onClick={() => bump(it.name, 1)} aria-label={`Add ${it.name}`} className="w-7 h-7 rounded-full bg-[#1d9e56]/15 hover:bg-[#1d9e56]/30 flex items-center justify-center">
                      <span className="text-[#1d9e56] font-bold text-sm leading-none">+</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-3xl bg-[#0c3b24] text-white p-8 md:p-10">
            {weight <= 0 ? (
              <div className="text-center py-10">
                <Scale className="w-10 h-10 text-[#1d9e56] mx-auto mb-4" />
                <p className="text-slate-300">Add items and your weight-based estimate appears here.</p>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Your load</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-bold tracking-tight">~{weight.toLocaleString()} lbs</span>
                  {loading && <Loader2 className="w-5 h-5 animate-spin text-[#1d9e56]" />}
                </div>
                {overFull ? (
                  <>
                    <div className="mt-3 inline-block rounded-full bg-[#1d9e56]/20 text-[#1d9e56] font-semibold px-4 py-1.5 text-sm">More than a full truck</div>
                    <p className="mt-5 text-slate-300 text-sm">That's a multi-truck job — call (604) 849-1745 and we'll quote it in minutes.</p>
                  </>
                ) : (
                  <>
                    {quote ? (
                      <>
                        <div className="mt-4 text-2xl md:text-3xl font-bold tracking-tight text-[#1d9e56]">{quote.range}</div>
                        <div className="mt-3 inline-block rounded-full bg-[#1d9e56]/20 text-[#1d9e56] font-semibold px-4 py-1.5 text-sm">{quote.label}</div>
                      </>
                    ) : (
                      <div className="mt-4 text-2xl font-bold text-slate-400">Calculating…</div>
                    )}
                    <p className="mt-5 text-slate-300 text-sm">Weight estimates are approximate — final price is confirmed on arrival before we lift a thing, and you pay less if the load takes less space.</p>
                    <button
                      onClick={() => onBook({ items_text: itemsText, estimate_text: quote ? `${quote.range} (${quote.label}), ~${weight.toLocaleString()} lbs` : `~${weight.toLocaleString()} lbs`, city })}
                      className="mt-8 w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 hover:bg-[#17a04c] transition-colors flex items-center justify-center gap-2"
                    >
                      Book this pickup <ArrowRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}