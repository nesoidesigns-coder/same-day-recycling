import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ArrowRight, Loader2, Truck } from "lucide-react";
import { CITIES } from "@/lib/cities";

const sizeLabel = (e) =>
  e <= 0.5 ? "Minimum pickup"
  : e <= 1.5 ? "1/8 truck"
  : e <= 3 ? "1/4 truck"
  : e <= 4.5 ? "1/2 truck"
  : e <= 6 ? "3/4 truck"
  : "Full truck";

const fillPercent = (e) => Math.round((e / 8) * 100);

export default function LoadEstimator({ onBook }) {
  const [city, setCity] = useState("");
  const [load, setLoad] = useState(2);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);

  useEffect(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const payload = { load_eighths: load };
        if (city) payload.city = city;
        const res = await base44.functions.invoke("quoteEstimate", payload);
        setQuote(res.data);
      } catch {
        // keep showing the last estimate
      }
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer.current);
  }, [load, city]);

  return (
    <section id="estimator" className="bg-[#f4f7f5]">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="max-w-2xl mb-12">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Quick estimate</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Slide to size your load</h2>
          <p className="mt-4 text-slate-600">Not sure how it adds up? Set the slider to roughly how full you think a truck would be, pick your city, and see the price range instantly.</p>
        </div>
        <div className="grid lg:grid-cols-2 gap-8 items-start">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 md:p-8">
            <label className="block mb-8">
              <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Your city</span>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="input">
                <option value="">Standard rates (any city)</option>
                {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
              </select>
            </label>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-[#0c3b24]">Load size</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d9e56]/15 text-[#1d9e56] font-bold px-4 py-1.5 text-sm">
                <Truck className="w-4 h-4" />
                {sizeLabel(load)}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={load}
              onChange={(e) => setLoad(Number(e.target.value))}
              className="w-full accent-[#1d9e56] cursor-pointer"
              aria-label="Load size"
            />
            <div className="flex justify-between mt-2 text-xs font-semibold text-slate-400">
              <span>Minimum</span>
              <span>1/4</span>
              <span>1/2</span>
              <span>3/4</span>
              <span>Full truck</span>
            </div>
            <p className="mt-6 text-sm text-slate-500">
              That's about <span className="font-bold text-[#0c3b24]">{fillPercent(load)}%</span> of a full truck. Adjust it if you're unsure — the estimate updates as you slide.
            </p>
          </div>
          <div className="rounded-3xl bg-[#0c3b24] text-white p-8 md:p-10">
            {!quote ? (
              <div className="text-center py-10">
                {loading ? (
                  <Loader2 className="w-10 h-10 text-[#1d9e56] mx-auto mb-4 animate-spin" />
                ) : (
                  <Truck className="w-10 h-10 text-[#1d9e56] mx-auto mb-4" />
                )}
                <p className="text-slate-300">Your estimate will appear here.</p>
              </div>
            ) : (
              <div>
                <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">
                  Your estimate{city ? ` — ${city}` : ""}
                  {loading && <Loader2 className="inline w-4 h-4 ml-2 animate-spin" />}
                </div>
                <div className="text-4xl md:text-5xl font-bold tracking-tight">{quote.range}</div>
                <div className="mt-3 inline-block rounded-full bg-[#1d9e56]/20 text-[#1d9e56] font-semibold px-4 py-1.5 text-sm">{quote.label}</div>
                <p className="mt-5 text-slate-300 text-sm">Final price confirmed on arrival before we lift a thing.</p>
                <button
                  onClick={() => onBook({ items_text: `${quote.label} load`, estimate_text: `${quote.range} (${quote.label})`, city })}
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