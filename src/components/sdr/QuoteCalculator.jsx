import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Calculator, Loader2, Plus, Minus, ArrowRight } from "lucide-react";
import { CITIES } from "@/lib/cities";

const CATALOG = [
  "Sofa", "Loveseat", "Mattress", "Box spring", "Dining table", "Dresser",
  "Fridge", "Washer", "Dryer", "Stove", "Dishwasher", "Treadmill", "TV", "Bags/boxes of junk",
];

export default function QuoteCalculator({ onBook, city: fixedCity }) {
  const [qty, setQty] = useState({});
  const [description, setDescription] = useState("");
  const [city, setCity] = useState(fixedCity || "");
  const [loading, setLoading] = useState(false);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState("");

  const bump = (name, d) => setQty((q) => ({ ...q, [name]: Math.max(0, (q[name] || 0) + d) }));

  const calculate = async () => {
    const items = Object.entries(qty).filter(([, q]) => q > 0).map(([name, quantity]) => ({ name, quantity }));
    if (!items.length && !description.trim()) return;
    setLoading(true);
    setError("");
    try {
      const payload = items.length ? { items } : { description: description.trim() };
      if (city) payload.city = city;
      const res = await base44.functions.invoke("quoteEstimate", payload);
      setQuote(res.data);
      base44.analytics.track("quote_calculated", { city: city || "", items: items.length });
    } catch {
      setError("Couldn't calculate right now — please try again or call (604) 849-1745.");
    } finally {
      setLoading(false);
    }
  };

  const itemsText = description.trim()
    ? description.trim()
    : (quote?.items || []).map((i) => `${i.quantity} × ${i.name}`).join(", ");

  return (
    <section id="quote" className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">No guesswork</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Get an instant quote</h2>
          <p className="mt-4 text-slate-600">Pick your items or describe the job — see the price before you book.</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-3xl border border-slate-100 bg-[#f4f7f5] p-6 md:p-8">
            {fixedCity ? (
              <div className="mb-6 rounded-xl bg-white border border-slate-100 px-4 py-2.5 flex items-center justify-between">
                <span className="text-sm font-semibold text-[#0c3b24]">City</span>
                <span className="text-sm font-bold text-[#1d9e56]">{fixedCity}</span>
              </div>
            ) : (
              <label className="block mb-6">
                <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Your city</span>
                <select value={city} onChange={(e) => setCity(e.target.value)} className="input">
                  <option value="">Standard rates (any city)</option>
                  {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
                </select>
              </label>
            )}
            <div className="grid sm:grid-cols-2 gap-2 mb-6">
              {CATALOG.map((name) => (
                <div key={name} className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-3 py-2">
                  <span className="text-sm font-medium text-[#0c3b24]">{name}</span>
                  <div className="flex items-center gap-1.5">
                    <button type="button" onClick={() => bump(name, -1)} aria-label={`Remove ${name}`} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                      <Minus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-[#0c3b24]">{qty[name] || 0}</span>
                    <button type="button" onClick={() => bump(name, 1)} aria-label={`Add ${name}`} className="w-7 h-7 rounded-full bg-[#1d9e56]/15 hover:bg-[#1d9e56]/30 flex items-center justify-center">
                      <Plus className="w-3.5 h-3.5 text-[#1d9e56]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <label className="block">
              <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Or describe it in your own words</span>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="input resize-none"
                placeholder="e.g. old couch, a mini fridge and about ten boxes from the garage"
              />
            </label>
            <button onClick={calculate} disabled={loading} className="mt-4 w-full rounded-full bg-[#0c3b24] text-white font-bold px-7 py-3.5 hover:bg-[#0a3020] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
              {loading ? "Calculating…" : "Calculate my estimate"}
            </button>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
          <div className="rounded-3xl bg-[#0c3b24] text-white p-8 md:p-10">
            {!quote ? (
              <div className="text-center py-10">
                <Calculator className="w-10 h-10 text-[#1d9e56] mx-auto mb-4" />
                <p className="text-slate-300">Your estimate will appear here.</p>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Your estimate</div>
                <div className="text-4xl md:text-5xl font-bold tracking-tight">{quote.range}</div>
                <div className="mt-3 inline-block rounded-full bg-[#1d9e56]/20 text-[#1d9e56] font-semibold px-4 py-1.5 text-sm">{quote.label}</div>
                <p className="mt-5 text-slate-300 text-sm">Final price confirmed on arrival before we lift a thing.</p>
                <button
                  onClick={() => onBook({ items_text: itemsText, estimate_text: `${quote.range} (${quote.label})`, city })}
                  className="mt-8 w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 hover:bg-[#17a04c] transition-colors flex items-center justify-center gap-2"
                >
                  Book this pickup <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}