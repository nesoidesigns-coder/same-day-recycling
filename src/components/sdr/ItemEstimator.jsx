import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sofa, BedDouble, Refrigerator, WashingMachine, Tv, Table2, Boxes,
  Construction, Trash2, Loader2, Camera, Minus, Plus, ArrowRight, Info, Truck,
} from "lucide-react";

// Visual tap-to-estimate. Every price and load size comes from the existing
// quoteEstimate backend (live pricing settings) — nothing is invented here.
// catalog = an item the platform's pricing table already knows; variable =
// free-form loads priced by the existing photo/description estimation path.
const ITEMS = [
  { key: "couch", label: "Couch", icon: Sofa, catalog: "Sofa" },
  { key: "mattress", label: "Mattress", icon: BedDouble, catalog: "Mattress", specialty: true },
  { key: "fridge", label: "Refrigerator", icon: Refrigerator, catalog: "Fridge", specialty: true },
  { key: "washer", label: "Washing machine", icon: WashingMachine, catalog: "Washer" },
  { key: "tv", label: "Television", icon: Tv, catalog: "TV", specialty: true },
  { key: "desk", label: "Desk", icon: Table2, catalog: "Dining table" },
  { key: "boxes", label: "Cardboard boxes", icon: Boxes, catalog: "Bags/boxes of junk" },
  { key: "debris", label: "Construction debris", icon: Construction, variable: "small renovation debris pile (drywall, lumber, flooring)", specialty: true },
  { key: "mixed", label: "Mixed junk pile", icon: Trash2, variable: "a pile of mixed household junk from a room cleanout", specialty: true },
];

export default function ItemEstimator({ onBook }) {
  const [qty, setQty] = useState({});
  const [curbside, setCurbside] = useState(false);
  const [quote, setQuote] = useState(null);
  const [quoteSource, setQuoteSource] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const reqId = useRef(0);

  const picks = Object.entries(qty).filter(([, q]) => q > 0);
  const hasSpecialty = picks.some(([k]) => ITEMS.find((i) => i.key === k)?.specialty);
  const itemsText = picks.map(([k, q]) => `${q} × ${ITEMS.find((i) => i.key === k).label}`).join(", ");

  const bump = (key, d) => setQty((prev) => ({ ...prev, [key]: Math.max(0, (prev[key] || 0) + d) }));
  const tap = (key) => {
    if (!qty[key]) {
      bump(key, 1);
      base44.analytics.track({ eventName: "estimate_item_selected", properties: { item: key } });
    }
  };

  const buildPayload = (selections) => {
    const weighted = [];
    const variable = [];
    for (const [key, q] of selections) {
      const item = ITEMS.find((i) => i.key === key);
      if (item.catalog) weighted.push({ name: item.catalog, quantity: q });
      if (item.variable) variable.push(q > 1 ? `about ${q} piles of ${item.variable}` : item.variable);
    }
    // Debris / mixed piles are priced by the existing description estimator.
    if (variable.length) {
      const description = [...weighted.map((i) => `${i.quantity} × ${i.name}`), ...variable].join(", ");
      return { description, curbside };
    }
    return { items: weighted, curbside };
  };

  // Re-price automatically (debounced) whenever the selection changes.
  useEffect(() => {
    if (!picks.length) { setQuote(null); setQuoteSource(null); return; }
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await base44.functions.invoke("quoteEstimate", buildPayload(picks));
        if (id === reqId.current) {
          setQuote(res.data);
          setQuoteSource("items");
          setError("");
          base44.analytics.track({ eventName: "quote_calculated", properties: { source: "item_estimator", items: picks.length } });
        }
      } catch {
        if (id === reqId.current) setError("Couldn't calculate right now — call (604) 849-1745 for a quick quote.");
      } finally {
        if (id === reqId.current) setLoading(false);
      }
    }, 700);
    return () => clearTimeout(t);
  }, [qty, curbside]);

  const pickPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPreview(URL.createObjectURL(f));
    setPhotoBusy(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: f });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri });
      const payload = { image_urls: [signed_url], curbside };
      const base = picks.length ? buildPayload(picks) : null;
      if (base?.description) payload.description = base.description;
      const res = await base44.functions.invoke("quoteEstimate", payload);
      setQuote(res.data);
      setQuoteSource("photo");
      base44.analytics.track({ eventName: "quote_calculated", properties: { source: "item_estimator_photo" } });
    } catch {
      setError("Couldn't read that photo right now — call (604) 849-1745 for a quick quote.");
    } finally {
      setPhotoBusy(false);
    }
  };

  const filled = Math.min(8, Math.round(quote?.eighths ?? 0));
  const busy = loading || photoBusy;

  return (
    <section id="estimate" className="bg-[#f4f7f5]">
      <div className="max-w-7xl mx-auto px-4 py-10 md:py-20">
        <div className="max-w-2xl mb-8">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Tap, see the price</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#102B2A]">See your estimate in seconds</h2>
          <p className="mt-3 text-slate-600">Tap the things you need gone — we'll show the truck space it takes and a price range from our live pricing. Add a photo any time for a tighter estimate.</p>
        </div>

        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-6 items-start">
          <div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {ITEMS.map((item) => {
                const n = qty[item.key] || 0;
                const Icon = item.icon;
                return (
                  <div
                    key={item.key}
                    className={`rounded-2xl border p-2.5 sm:p-4 flex flex-col items-center gap-2 text-center transition-all active:scale-95 ${
                      n > 0 ? "bg-[#187B65] text-white border-[#187B65] shadow-sm" : "bg-white text-[#102B2A] border-slate-200 hover:border-[#187B65]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => tap(item.key)}
                      aria-pressed={n > 0}
                      aria-label={`Add ${item.label}`}
                      className="flex flex-col items-center gap-2 w-full"
                    >
                      <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
                      <span className="text-[11px] sm:text-sm font-bold leading-tight">{item.label}</span>
                    </button>
                    {n > 0 && (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => bump(item.key, -1)} aria-label={`Remove one ${item.label}`}
                          className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="text-sm font-black min-w-[1.2rem]">{n}</span>
                        <button type="button" onClick={() => bump(item.key, 1)} aria-label={`Add one more ${item.label}`}
                          className="w-8 h-8 rounded-full bg-white/25 hover:bg-white/35 flex items-center justify-center">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-4 rounded-2xl bg-white border border-slate-200 p-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={curbside} onChange={(e) => setCurbside(e.target.checked)} className="mt-0.5 accent-[#187B65] w-4 h-4" />
                <span className="text-sm text-[#102B2A]"><span className="font-semibold">Leave it curbside — save $25.</span> Stage items at the curb, lane or garage front; no need to be home.</span>
              </label>
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <label className="cursor-pointer rounded-full bg-[#f4f7f5] border border-slate-200 text-[#102B2A] font-bold px-4 py-2.5 text-sm inline-flex items-center gap-2 hover:border-[#187B65] transition-colors">
                  <Camera className="w-4 h-4" /> {preview ? "Add another photo" : "Or snap a photo"}
                  <input type="file" accept="image/*" capture="environment" onChange={pickPhoto} className="hidden" disabled={photoBusy} />
                </label>
                {preview && <img src={preview} alt="Your items" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />}
                {quoteSource === "photo" && !busy && <span className="text-xs font-bold text-[#187B65]">Estimated from your photo</span>}
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-6 md:p-8">
            {!quote && !busy && (
              <div className="text-center py-10">
                <Truck className="w-10 h-10 text-[#187B65] mx-auto" />
                <p className="text-slate-500 text-sm mt-4 max-w-[16rem] mx-auto">Tap a few items and your estimate appears here — with the truck space it needs.</p>
              </div>
            )}
            {busy && (
              <p className="text-sm text-slate-500 flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking live pricing…</p>
            )}
            {quote && !busy && (
              <>
                <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-2">
                  Your estimate{quoteSource === "photo" ? " · from your photo" : ""}
                </div>
                <div className="text-4xl md:text-5xl font-bold tracking-tight text-[#102B2A] break-words">{quote.range}</div>
                <div className="mt-3 inline-block rounded-full bg-[#187B65]/10 text-[#187B65] font-bold px-4 py-1.5 text-sm">{quote.label}</div>
                <div className="mt-4">
                  <div className="text-xs font-semibold text-slate-500 mb-1.5">Truck space: {quote.eighths} of 8 sections</div>
                  <div className="flex gap-1">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className={`h-2.5 flex-1 rounded-full ${i < filled ? "bg-[#187B65]" : "bg-slate-200"}`} />
                    ))}
                  </div>
                </div>
                {hasSpecialty && (
                  <p className="mt-4 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800 flex items-start gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    Mattresses, appliances with refrigerant, electronics and renovation debris can carry a small specialty disposal fee at the facility — any extra is always confirmed with you before you approve the final price.
                  </p>
                )}
                <ul className="mt-4 space-y-1.5 text-sm text-slate-600">
                  <li>· Transport to the sorting facility and standard disposal included</li>
                  <li>· Labour and loading included within the tier band</li>
                  <li>· Recycling and donation sorting at no extra charge</li>
                </ul>
                <p className="mt-4 text-xs text-slate-400">Preliminary estimate only — not a final quote. The final price is approved by you before any work starts.</p>
                <button
                  onClick={() => onBook({ ...(itemsText ? { items_text: itemsText } : {}), estimate_text: `${quote.range} (${quote.label})` })}
                  className="mt-6 w-full min-h-[52px] rounded-full bg-[#187B65] text-white font-bold px-7 py-3.5 hover:bg-[#125C4E] transition-colors flex items-center justify-center gap-2"
                >
                  Book this pickup <ArrowRight className="w-5 h-5" />
                </button>
              </>
            )}
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}