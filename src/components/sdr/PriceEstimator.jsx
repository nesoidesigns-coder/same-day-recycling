import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Calculator, Loader2, Plus, Minus, MapPin, ArrowRight, CheckCircle2 } from "lucide-react";
import { CITIES, cityLabel } from "@/lib/cities";
import { isCityActive } from "@/lib/coverage";

const GROUPS = [
  { name: "Furniture", items: ["Sofa", "Loveseat", "Mattress", "Box spring", "Dining table", "Dresser"] },
  { name: "Appliances", items: ["Fridge", "Washer", "Dryer", "Stove", "Dishwasher"] },
  { name: "Electronics & other", items: ["TV", "Treadmill", "Bags/boxes of junk"] },
];

const TRAVEL_OPTIONS = [
  { km: 0, label: "Within city & metro — travel included (up to 30 km)" },
  { km: 45, label: "Out of town — about 30 to 60 km" },
  { km: 80, label: "Far out — about 60 to 100 km" },
];

const INCLUDED_KM = 30;

const haversineKm = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return Math.round(2 * R * Math.asin(Math.sqrt(h)));
};

export default function PriceEstimator() {
  const [qty, setQty] = useState({});
  const [city, setCity] = useState("");
  const [travelKm, setTravelKm] = useState(0);
  const [autoKm, setAutoKm] = useState(null);
  const [autoNote, setAutoNote] = useState("");
  const [address, setAddress] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [curbside, setCurbside] = useState(false);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bump = (name, d) => setQty((q) => ({ ...q, [name]: Math.max(0, (q[name] || 0) + d) }));
  const anyItems = Object.values(qty).some((q) => q > 0);

  const detect = async () => {
    if (address.trim().length < 4 || detecting) return;
    setDetecting(true);
    setAutoNote("");
    try {
      const res = await base44.functions.invoke("addressGeocode", { query: address.trim() });
      const cand = (res.data?.candidates || []).find((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));
      const mapped = CITIES.filter((c) => Number.isFinite(c.lat) && Number.isFinite(c.lng));
      if (cand && mapped.length) {
        const nearest = mapped.reduce((best, c) => (
          haversineKm(cand, c) < haversineKm(cand, best) ? c : best
        ));
        const km = haversineKm(cand, nearest);
        setAutoKm(km);
        setTravelKm(km);
        setAutoNote(
          km <= INCLUDED_KM
            ? `Detected about ${km} km from ${nearest.name} — travel is included.`
            : `Detected about ${km} km from ${nearest.name} — a travel estimate is added below.`
        );
      } else {
        setAutoNote("Couldn't find that address — pick a distance band instead.");
      }
    } catch {
      setAutoNote("Address check unavailable right now — pick a distance band instead.");
    } finally {
      setDetecting(false);
    }
  };

  useEffect(() => {
    if (!anyItems) { setQuote(null); return undefined; }
    const t = setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const items = Object.entries(qty).filter(([, q]) => q > 0).map(([name, quantity]) => ({ name, quantity }));
        const payload = { items, travel_km: travelKm, curbside };
        if (city) payload.city = city;
        const res = await base44.functions.invoke("quoteEstimate", payload);
        setQuote(res.data);
        base44.analytics.track({ eventName: "quote_calculated", properties: { city: city || "", items: items.length } });
      } catch {
        setError("Couldn't calculate right now — please try again or call (604) 849-1745.");
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [JSON.stringify(qty), city, travelKm, curbside]);

  const itemsText = (quote?.items || []).map((i) => `${i.quantity} × ${i.name}`).join(", ");

  return (
    <section id="price-estimator" className="max-w-7xl mx-auto px-4 py-12">
      <div className="max-w-2xl mb-8">
        <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Instant pricing clarity</div>
        <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#102B2A]">Price estimator</h2>
        <p className="mt-3 text-slate-600">Pick your items, tell us how far out you are, and see a rough quote right away — before you book.</p>
      </div>
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <div className="rounded-3xl border border-slate-100 bg-[#f4f7f5] p-6 md:p-8">
          <label className="block mb-6">
            <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Your city</span>
            <select value={city} onChange={(e) => setCity(e.target.value)} className="input">
              <option value="">Standard rates (active cities)</option>
              {CITIES.map((c) => <option key={c.slug} value={c.name}>{cityLabel(c)}</option>)}
            </select>
            {city && !isCityActive(city) && (
              <span className="mt-2 block text-xs font-semibold text-amber-700">Inquiries open in {city} — this is a standard-rate estimate; local availability and scheduling are confirmed after you submit your inquiry.</span>
            )}
          </label>

          {GROUPS.map((g) => (
            <div key={g.name} className="mb-5">
              <div className="text-sm font-bold text-[#102B2A] mb-2">{g.name}</div>
              <div className="grid sm:grid-cols-2 gap-2">
                {g.items.map((name) => (
                  <div key={name} className="flex items-center justify-between bg-white rounded-xl border border-slate-100 px-3 py-2">
                    <span className="text-sm font-medium text-[#102B2A]">{name}</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => bump(name, -1)} aria-label={`Remove ${name}`} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                        <Minus className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-[#102B2A]">{qty[name] || 0}</span>
                      <button type="button" onClick={() => bump(name, 1)} aria-label={`Add ${name}`} className="w-7 h-7 rounded-full bg-[#187B65]/15 hover:bg-[#187B65]/30 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5 text-[#187B65]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="mb-4 rounded-2xl bg-white border border-slate-100 p-4">
            <div className="flex items-center gap-2 mb-1.5">
              <MapPin className="w-4 h-4 text-[#187B65]" />
              <span className="text-sm font-bold text-[#102B2A]">Distance</span>
            </div>
            <p className="text-xs text-slate-500 mb-3">Travel up to 30 km of your city's centre is included; a per-km estimate applies beyond it.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); detect(); } }}
                placeholder="Street address or postal code (optional)"
                className="input flex-1"
              />
              <button type="button" onClick={detect} disabled={detecting || address.trim().length < 4}
                className="rounded-xl bg-[#102B2A] text-white font-bold px-5 py-3 hover:bg-[#0a3020] transition-colors disabled:opacity-50 flex items-center justify-center gap-2 min-h-[48px]">
                {detecting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Detect distance"}
              </button>
            </div>
            {autoNote && <p className="mt-2 text-xs font-semibold text-[#187B65]">{autoNote}</p>}
            <select
              value={autoKm === null ? travelKm : "auto"}
              onChange={(e) => { if (e.target.value !== "auto") { setAutoKm(null); setTravelKm(Number(e.target.value)); } }}
              className="input mt-3" aria-label="Distance band">
              {autoKm !== null && <option value="auto">{`Use detected distance — about ${autoKm} km`}</option>}
              {TRAVEL_OPTIONS.map((t) => <option key={t.km} value={t.km}>{t.label}</option>)}
            </select>
          </div>

          <label className="flex items-start gap-3 mb-4 rounded-xl bg-white border border-[#187B65]/30 px-4 py-3 cursor-pointer">
            <input type="checkbox" checked={curbside} onChange={(e) => setCurbside(e.target.checked)} className="mt-0.5 accent-[#187B65] w-4 h-4" />
            <span className="text-sm text-[#102B2A]">
              <span className="font-semibold">Leave it curbside — save $25.</span>{" "}
              Stage your items in the driveway, lane or garage front; no need to be home.
            </span>
          </label>
          {!anyItems && (
            <p className="text-sm text-slate-500 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[#187B65]" /> Add items above and your estimate appears instantly.
            </p>
          )}
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        <div className="rounded-3xl bg-[#102B2A] text-white p-5 md:p-10">
          {!quote ? (
            <div className="text-center py-10">
              <Calculator className="w-10 h-10 text-[#187B65] mx-auto mb-4" />
              <p className="text-slate-300">Your estimate will appear here.</p>
            </div>
          ) : (
            <div className={loading ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Your estimate</div>
              <div className="text-4xl md:text-5xl font-bold tracking-tight">{quote.range}</div>
              <div className="mt-3 inline-block rounded-full bg-[#187B65]/20 text-[#187B65] font-semibold px-4 py-1.5 text-sm">{quote.label}</div>
              <p className="mt-2 text-sm text-emerald-100/60">Estimated load size: {quote.eighths} of 8 truck sections</p>
              <ul className="mt-4 space-y-1.5 text-sm text-slate-300">
                {quote.travel_fee > 0 && <li>Includes ${quote.travel_fee} travel beyond the included base distance</li>}
                {quote.discount > 0 && <li>${quote.discount} curbside discount applied</li>}
                <li>Labour, loading, transport and standard disposal included</li>
                <li>Recycling and donation sorting at no extra charge</li>
                <li>Taxes (GST and/or PST) added only when you approve the final price</li>
              </ul>
              <p className="mt-4 text-slate-400 text-xs">
                Rough preliminary estimate. Extra or heavier items found on arrival change the final amount, which you approve before we lift a thing.
              </p>
              <Link
                to="/request-service"
                className="mt-8 w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-4 hover:bg-[#125C4E] transition-colors flex items-center justify-center gap-2"
              >
                Book this pickup <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          )}
          {quote && (
            <div className="mt-6 flex items-start gap-2 text-xs text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
              <span>Based on {itemsText || "your items"}{city ? ` in ${city}` : ""}. Distance basis: {autoKm !== null ? `detected ~${autoKm} km` : `${travelKm === 0 ? "included base" : `~${travelKm} km`} estimate`}.</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}