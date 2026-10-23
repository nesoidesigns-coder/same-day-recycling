import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Camera, Loader2, ArrowRight, CheckCircle2, MapPin, SkipForward, Sparkles } from "lucide-react";
import RexOrb from "@/components/rex/RexOrb";
import AiMascotFull from "./AiMascotFull";
import { LETTER_PROVINCE, PROVINCE_NAMES, FSA_RE } from "./PostalCheck";
import { activeCitiesByProvince } from "@/lib/coverage";

// Rex Journey — the immediate, mobile-first guided entry to booking.
// One-tap service selection, postal-code matching (live coverage data),
// an optional photo estimate through the existing quoteEstimate backend,
// then handoff to the standard booking form with the same prefill contract
// the quote calculator uses. Availability is never invented: same-day
// wording only appears for cities the coverage source of truth marks active.
const SERVICES = [
  { key: "furniture", label: "Furniture & couches", items: "Furniture, sofa, dresser" },
  { key: "appliance", label: "Appliances", items: "Appliances (fridge, stove, washer)" },
  { key: "mattress", label: "Mattress", items: "Mattress & box spring" },
  { key: "ewaste", label: "Electronics & TV", items: "Electronics, TV, computer" },
  { key: "metal", label: "Metal & scrap", items: "Metal & scrap pickup" },
  { key: "cleanout", label: "Whole load", items: "Multiple items / full cleanout" },
];

export default function RexJourney({ onBook }) {
  const [services, setServices] = useState([]);
  const [city, setCity] = useState("");
  const [photo, setPhoto] = useState(null);
  const [preview, setPreview] = useState(null);
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleService = (s) => {
    setServices((prev) => (prev.some((x) => x.key === s.key) ? prev.filter((x) => x.key !== s.key) : [...prev, s]));
    base44.analytics.track("rex_journey_service_selected", { service: s.key });
  };

  const checkPostal = (value) => {
    const normalized = value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 3);
    if (!FSA_RE.test(normalized)) return { invalid: true };
    const province = LETTER_PROVINCE[normalized[0]];
    const active = activeCitiesByProvince(province);
    setCity(active.length === 1 ? active[0] : city && active.includes(city) ? city : "");
    return { province, active, done: true };
  };

  const pickPhoto = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
    setEstimate(null);
  };

  const getEstimate = async () => {
    if (!photo) return;
    setLoading(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: photo });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri });
      const res = await base44.functions.invoke("quoteEstimate", {
        image_urls: [signed_url],
        ...(services.length ? { description: services.map((s) => s.label).join(", ") } : {}),
        ...(city ? { city } : {}),
      });
      setEstimate(res.data);
      base44.analytics.track("photo_quote_calculated", { city: city || "", source: "rex_journey" });
    } catch {
      setError("Couldn't read that photo right now — text it to (604) 849-1745 for a quick quote.");
    } finally {
      setLoading(false);
    }
  };

  const itemsText = services.length ? services.map((s) => s.items).join(", ") : "";
  const estimateText = estimate ? `${estimate.range} (${estimate.label})` : "";

  return (
    <section id="rex-journey" className="bg-[#f4f7f5]">
      <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
        <div className="glass-dark rounded-3xl p-5 md:p-8 relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-[#187B65]/25 blur-3xl pointer-events-none" aria-hidden="true" />
          <div className="relative flex items-start gap-3">
            <AiMascotFull height={64} className="mascot-float shrink-0" />
            <div className="min-w-0">
              <RexOrb state={loading ? "processing" : estimate ? "success" : "listening"} size={14} showLabel={false} className="text-[#6ee7b7] text-xs" />
              <h2 className="text-xl md:text-2xl font-bold text-white leading-snug">
                Hi, I'm Rex. What are we clearing out today?
              </h2>
              <p className="text-sm text-[#9fd8c8] mt-1">Tap what you need — I'll match your area and price it. Takes under a minute.</p>
            </div>
          </div>

          {/* Step 1 — one-tap services */}
          <div className="relative mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {SERVICES.map((s) => {
              const on = services.some((x) => x.key === s.key);
              return (
                <motion.button
                  key={s.key}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => toggleService(s)}
                  aria-pressed={on}
                  className={`rounded-2xl px-3 py-3 text-sm font-bold text-left transition-colors border ${
                    on ? "bg-[#187B65] text-[#102B2A] border-[#187B65]" : "bg-white/10 text-white border-white/15 hover:bg-white/20"
                  }`}
                >
                  {s.label} {on && <CheckCircle2 className="w-4 h-4 inline ml-1" />}
                </motion.button>
              );
            })}
          </div>

          {/* Step 2 — postal match */}
          <PostalMatch onCheck={checkPostal} onPickCity={setCity} city={city} />

          {/* Step 3 — optional photo estimate */}
          <div className="relative mt-4 rounded-2xl bg-white/10 border border-white/15 p-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#6ee7b7]" /> Want a price from a photo? (optional)
              </div>
              {photo && !estimate && !loading && (
                <button onClick={getEstimate} className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-4 py-2 text-sm hover:bg-[#1FA184] transition-colors">
                  Price it
                </button>
              )}
            </div>
            <div className="mt-3 flex items-center gap-3">
              <label className="cursor-pointer rounded-xl bg-white text-[#102B2A] font-bold px-4 py-2.5 text-sm inline-flex items-center gap-2 hover:bg-[#f4f7f5] transition-colors">
                <Camera className="w-4 h-4" /> {photo ? "Change photo" : "Snap / choose"}
                <input type="file" accept="image/*" capture="environment" onChange={pickPhoto} className="hidden" />
              </label>
              {preview && <img src={preview} alt="Your items" className="w-14 h-14 rounded-xl object-cover border border-white/20" />}
            </div>
            {loading && (
              <p className="mt-3 text-sm text-[#9fd8c8] flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Rex is reading your photo…</p>
            )}
            {estimate && (
              <div className="mt-3 rounded-xl bg-[#187B65]/20 border border-[#187B65]/40 p-3.5">
                <div className="text-xs font-bold uppercase tracking-[0.15em] text-[#6ee7b7]">Estimate from your photo</div>
                <div className="text-2xl font-bold text-white mt-1">{estimate.range}</div>
                <div className="text-sm font-semibold text-[#9fd8c8]">{estimate.label}</div>
              </div>
            )}
            {error && <p className="mt-3 text-sm text-amber-300">{error}</p>}
          </div>

          {/* Handoff — existing booking form */}
          <button
            onClick={() => onBook({ ...(itemsText ? { items_text: itemsText } : {}), ...(estimateText ? { estimate_text: estimateText } : {}), city })}
            disabled={!services.length}
            className="relative mt-4 w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-4 hover:bg-[#1FA184] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            Book this pickup <ArrowRight className="w-5 h-5" />
          </button>
          <p className="relative mt-2.5 text-xs text-[#9fd8c8] text-center">
            No invention here — same-day pickup is only confirmed once a verified contractor accepts your window.
          </p>
        </div>
      </div>
    </section>
  );
}

function PostalMatch({ onCheck, onPickCity, city }) {
  const [value, setValue] = useState("");
  const [result, setResult] = useState(null);

  const submit = (e) => {
    e.preventDefault();
    const r = onCheck(value);
    if (r.invalid) {
      setResult({ invalid: true });
      return;
    }
    setResult(r);
  };

  return (
    <div className="relative mt-4 rounded-2xl bg-white/10 border border-white/15 p-4">
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2" aria-label="Postal code service check">
        <div className="relative flex-1">
          <MapPin className="w-4 h-4 text-[#6ee7b7] absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            value={value}
            onChange={(e) => { setValue(e.target.value); setResult(null); }}
            placeholder="Postal code (e.g. V6B 1A1)"
            autoComplete="postal-code"
            className="w-full rounded-xl bg-white text-[#102B2A] placeholder:text-slate-400 pl-10 pr-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#187B65]"
            aria-label="Postal code"
          />
        </div>
        <button type="submit" className="rounded-xl bg-white text-[#102B2A] font-bold px-5 py-3 text-sm hover:bg-[#f4f7f5] transition-colors">
          Check my area
        </button>
      </form>
      {result?.invalid && <p className="mt-2 text-sm text-amber-300">Enter a valid Canadian postal code or its first 3 characters.</p>}
      {result?.active && (
        <div className="mt-3">
          {result.active.length > 0 ? (
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#6ee7b7]">
                Same-day live in {PROVINCE_NAMES[result.province] || result.province}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.active.map((c) => (
                  <button
                    key={c}
                    onClick={() => onPickCity(c)}
                    className={`rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors ${
                      city === c ? "bg-[#187B65] text-[#102B2A]" : "bg-white text-[#102B2A] hover:bg-[#f4f7f5]"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-[#9fd8c8] flex items-start gap-2">
              <SkipForward className="w-4 h-4 shrink-0 mt-0.5" />
              Same-day isn't confirmed in {PROVINCE_NAMES[result.province] || result.province} yet — you can still request service nationwide and we'll match a qualified contractor.
            </p>
          )}
        </div>
      )}
    </div>
  );
}