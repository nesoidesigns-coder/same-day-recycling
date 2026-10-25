import { useEffect, useMemo, useState } from "react";
import { CITIES } from "@/lib/cities";
import PickupCoverageNotice from "@/components/sdr/PickupCoverageNotice";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Loader2, ArrowRight, ArrowLeft, CheckCircle2, Calculator,
  Plus, Minus, ShieldCheck,
} from "lucide-react";
import {
  normalizePostal, isValidPostal, provinceFromFsa, territoryNeeded, provinceName,
} from "@/lib/geo";
import { TAX_RATES } from "@/lib/canadaTax";
import HeroCanadaBackground from "@/components/sdr/HeroCanadaBackground";
import AddressSearch from "@/components/sdr/AddressSearch";
import PickupHeroHeading from "@/components/sdr/PickupHeroHeading";
import { networkRegionName } from "@/components/sdr/heroNetworkCopy";

// Canada-first guided booking experience: postal code → materials → labeled
// estimate → pickup request. Bilingual (EN/FR), CAD, province-level tax shown
// transparently. Submits through the nationwide inquiry endpoint, which derives
// province from the FSA and sets verified/matching/recruiting coverage.

const T = {
  en: {
    tag: "Canada's intelligent removal & recycling network",
    title: "Junk Removal. Recycling. Intelligent Service Across Canada.",
    sub: "Your next pickup starts here. Enter your postal code, see a transparent estimate before you book — and Rex is with you the whole way.",
    postal: "Your postal code",
    postalPh: "e.g. V6B 1A1",
    postalNext: "Continue",
    province: "Province / territory",
    pickTerritory: "Your postal region covers two territories — which one?",
    coverageNote: "A verified territory is not a confirmed appointment. Contractor acceptance is required.",
    matchingNote: "Requests are accepted nationwide. Your contractor, final price and pickup window require confirmation before an appointment is booked.",
    materials: "What are we picking up?",
    materialsSub: "Pick as many as you like — quantities can be approximate.",
    estNext: "See my estimate",
    estimate: "Your estimate",
    subtotal: "Estimated subtotal",
    taxLabel: "Applicable tax",
    taxNote: "Taxes are calculated on the final approved price — never before.",
    incl: "Includes loading, transport and responsible recycling sorting.",
    contact: "Where do we send confirmation?",
    name: "Full name",
    phone: "Phone number",
    emailOpt: "Email (optional)",
    dateOpt: "Preferred date (optional)",
    submit: "Request my pickup",
    submitting: "Sending…",
    done: "Request received!",
    doneSub: "Our dispatch team is on it. Keep this reference code:",
    rexCues: [
      "I've got this — start with your postal code.",
      "Nice. Now tap what you need gone — rough numbers are fine.",
      "This is a preliminary estimate. You approve the final price before work begins.",
      "Request received. Dispatch must confirm your contractor, price and pickup window.",
    ],
    errors: {
      postal: "Enter a valid Canadian postal code (like V6B 1A1).",
      estimate: "Pick at least one item first.",
      submit: "Something went wrong — please try again or call (604) 849-1745.",
      missing: "Name, phone and at least one item are required.",
    },
  },
  fr: {
    tag: "Le réseau intelligent de débarras et de recyclage du Canada",
    title: "Débarras. Recyclage. Un service intelligent partout au Canada.",
    sub: "Votre prochaine collecte commence ici. Entrez votre code postal, consultez une estimation transparente avant de réserver — et Rex vous accompagne à chaque étape.",
    postal: "Votre code postal",
    postalPh: "p. ex. V6B 1A1",
    postalNext: "Continuer",
    province: "Province / territoire",
    pickTerritory: "Votre région couvre deux territoires — lequel ?",
    coverageNote: "Un territoire vérifié n'est pas un rendez-vous confirmé. L'acceptation d'un entrepreneur est requise.",
    matchingNote: "Les demandes sont acceptées partout au Canada. L'entrepreneur, le prix final et la plage horaire doivent être confirmés avant le rendez-vous.",
    materials: "Que devons-nous ramasser ?",
    materialsSub: "Choisissez autant d'articles que nécessaire — les quantités peuvent être approximatives.",
    estNext: "Voir mon estimation",
    estimate: "Votre estimation",
    subtotal: "Sous-total estimé",
    taxLabel: "Taxe applicable",
    taxNote: "Les taxes sont calculées sur le prix final approuvé — jamais avant.",
    incl: "Chargement, transport et tri responsable des matières recyclables inclus.",
    contact: "Où envoyons-nous la confirmation ?",
    name: "Nom complet",
    phone: "Numéro de téléphone",
    emailOpt: "Courriel (facultatif)",
    dateOpt: "Date souhaitée (facultatif)",
    submit: "Demander ma collecte",
    submitting: "Envoi…",
    done: "Demande reçue !",
    doneSub: "Notre équipe s'en occupe. Gardez ce code de référence :",
    rexCues: [
      "Je m'en occupe — commencez par votre code postal.",
      "Parfait. Touchez ce que vous voulez faire enlever — des chiffres approximatifs suffisent.",
      "Il s'agit d'une estimation préliminaire. Vous approuvez le prix final avant le travail.",
      "Demande reçue. L'équipe doit confirmer votre entrepreneur, le prix et la plage horaire.",
    ],
    errors: {
      postal: "Entrez un code postal canadien valide (p. ex. V6B 1A1).",
      estimate: "Choisissez au moins un article d'abord.",
      submit: "Un problème est survenu — réessayez ou appelez le (604) 849-1745.",
      missing: "Le nom, le téléphone et au moins un article sont requis.",
    },
  },
};

// Job-preparation tags Rex passes to the contractor brief. Nothing here is
// inferred from map imagery — only what the customer confirms.
const ACCESS_TAGS = [
  { key: "inside", en: "Items inside", fr: "Objets à l'intérieur" },
  { key: "stairs", en: "Stairs", fr: "Escaliers" },
  { key: "elevator", en: "Elevator", fr: "Ascenseur" },
  { key: "driveway", en: "Driveway parking", fr: "Stationnement dans l'entrée" },
  { key: "heavy", en: "Heavy items", fr: "Objets lourds" },
];

// Materials grouped by the service type they route to (nationwide dispatch).
const MATERIALS = [
  { key: "sofa", en: "Sofa / couch", fr: "Divan / sofa", service: "furniture" },
  { key: "mattress", en: "Mattress", fr: "Matelas", service: "furniture" },
  { key: "dresser", en: "Dresser / table", fr: "Commode / table", service: "furniture" },
  { key: "fridge", en: "Fridge / freezer", fr: "Réfrigérateur / congélateur", service: "appliances" },
  { key: "washer", en: "Washer / dryer / stove", fr: "Laveuse / sécheuse / cuisinière", service: "appliances" },
  { key: "tv", en: "TV / electronics", fr: "Télé / électronique", service: "electronics" },
  { key: "metal", en: "Scrap metal", fr: "Métal", service: "metal_pickup" },
  { key: "boxes", en: "Bags / boxes of junk", fr: "Sacs / boîtes de déchets", service: "junk_removal" },
  { key: "cleanout", en: "Garage / estate cleanout", fr: "Nettoyage de garage / succession", service: "cleanouts" },
];

export default function InstantQuoteFlow() {
  const [lang, setLang] = useState("en");
  const [step, setStep] = useState(0); // 0 postal, 1 materials, 2 estimate+contact, 3 done
  const [fsa, setFsa] = useState("");
  const [postalRaw, setPostalRaw] = useState("");
  const [city, setCity] = useState("");
  const [territory, setTerritory] = useState(""); // for X-prefix: "NT" | "NU"
  const [qty, setQty] = useState({});
  const [estimate, setEstimate] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", preferred_date: "" });
  const [location, setLocation] = useState(null); // verified address + coordinates
  const [accessTags, setAccessTags] = useState([]);
  const [accessNote, setAccessNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const t = T[lang];
  const province = useMemo(() => {
    const p = provinceFromFsa(fsa);
    return p || territory;
  }, [fsa, territory]);

  const validFsa = isValidPostal(postalRaw) && !territoryNeeded(normalizePostal(postalRaw));
  const validTerritory = territoryNeeded(normalizePostal(postalRaw)) && !!territory;
  const postalOk = territoryNeeded(normalizePostal(postalRaw)) ? validTerritory : validFsa;

  const bump = (key, d) => setQty((q) => ({ ...q, [key]: Math.max(0, (q[key] || 0) + d) }));
  const selected = MATERIALS.filter((m) => (qty[m.key] || 0) > 0);
  const activeService = useMemo(() => {
    const counts = {};
    selected.forEach((m) => { counts[m.service] = (counts[m.service] || 0) + qty[m.key]; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : "junk_removal";
  }, [qty]);

  useEffect(() => {
    const selectCity = (event) => {
      const location = event.detail || {};
      if (!location.city) return;
      setCity(location.city);
      const postalProvince = provinceFromFsa(normalizePostal(postalRaw)) || territory;
      if (postalProvince && location.province && postalProvince !== location.province) {
        setPostalRaw(""); setFsa(""); setTerritory(""); setStep(0);
      } else if (step === 2) setStep(1);
      setEstimate(null);
    };
    window.addEventListener("pickup:location", selectCity);
    return () => window.removeEventListener("pickup:location", selectCity);
  }, [postalRaw, territory, step]);

  // The customer adjusted the pickup pin on the local map — the stored
  // location follows, and the booking records it as customer_adjusted.
  useEffect(() => {
    const onAdjust = (event) => {
      const d = event.detail || {};
      if (!Number.isFinite(d.lat) || !Number.isFinite(d.lng)) return;
      setLocation((loc) => (loc ? { ...loc, lat: d.lat, lng: d.lng, adjusted: true } : loc));
    };
    window.addEventListener("pickup:adjust", onAdjust);
    return () => window.removeEventListener("pickup:adjust", onAdjust);
  }, []);

  // Address confirmation: a verified geocoded address fills the city and
  // postal fields, stores the exact coordinates and rotates the globe.
  const onAddressSelect = (candidate) => {
    if (!candidate) return;
    setLocation({ ...candidate, unit: "", adjusted: false });
    setCity(candidate.city || "");
    if (candidate.postal_code) setPostalRaw(String(candidate.postal_code).toUpperCase().slice(0, 7));
    try {
      window.dispatchEvent(new CustomEvent("pickup:address", {
        detail: { address: candidate.label, unit: "", lat: candidate.lat, lng: candidate.lng, city: candidate.city, province: candidate.province, province_name: candidate.province_name, postal: candidate.postal_code },
      }));
      base44.analytics.track({ eventName: "pickup_address_selected", properties: { city: candidate.city || "", province: candidate.province || "" } });
    } catch { /* the map must never block the booking flow */ }
  };

  const goPostal = () => {
    const norm = normalizePostal(postalRaw);
    if (!isValidPostal(norm)) { setError(t.errors.postal); return; }
    if (!city.trim()) { setError(lang === "fr" ? "Entrez votre ville ou municipalité." : "Enter your city or municipality."); return; }
    if (territoryNeeded(norm) && !territory) { setError(t.pickTerritory); return; }
    const knownCity = CITIES.find((c) => c.name.toLowerCase() === city.trim().toLowerCase());
    const postalProvince = provinceFromFsa(norm) || territory;
    if (knownCity && knownCity.province !== postalProvince) { setError(lang === "fr" ? "La ville et le code postal doivent être dans la même province." : "Your city and postal code must be in the same province or territory."); return; }
    setCity(knownCity?.name || city.trim());
    setError("");
    setFsa(norm);
    setStep(1);
    // Geographic focus on the hero map — booking itself never waits on it.
    try {
      const province = provinceFromFsa(norm) || territory || null;
      if (province) {
        window.dispatchEvent(new CustomEvent("hero-map:focus", { detail: { postal: postalRaw, province } }));
        base44.analytics.track({ eventName: "hero_map_postal_focus", properties: { province } });
      }
    } catch { /* the map must never block the booking flow */ }
  };

  const getEstimate = async () => {
    if (!selected.length) { setError(t.errors.estimate); return; }
    setError("");
    setLoading(true);
    try {
      const names = { sofa: "sofa", mattress: "mattress", dresser: "dresser", fridge: "fridge", washer: "washer", tv: "tv", boxes: "bags/boxes of junk" };
      const description = selected.map((m) => `${qty[m.key]} × ${m.en}`).join(", ");
      const payload = selected.every((m) => names[m.key])
        ? { items: selected.map((m) => ({ name: names[m.key], quantity: qty[m.key] })) }
        : { description };
      const res = await base44.functions.invoke("quoteEstimate", { ...payload, city: city.trim() });
      setEstimate(res.data);
      setStep(2);
      base44.analytics.track({ eventName: "quote_calculated", properties: { flow: "instant", province } });
    } catch {
      setError(t.errors.submit);
    } finally {
      setLoading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim() || !selected.length) { setError(t.errors.missing); return; }
    setError("");
    setLoading(true);
    try {
      const itemsText = selected.map((m) => `${qty[m.key]} × ${lang === "fr" ? m.fr : m.en}`).join(", ");
      const res = await base44.functions.invoke("nationalRequest", {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        city: city.trim(),
        province_code: province,
        postal_code: postalRaw,
        service_type: activeService,
        items_description: itemsText,
        preferred_date: form.preferred_date,
        // One authoritative location record: the verified geocode (or the
        // customer's adjusted pin) travels with the request into dispatch.
        ...(location ? {
          address: [location.label, location.unit ? `Unit ${location.unit}` : ""].filter(Boolean).join(", "),
          pickup_lat: location.lat,
          pickup_lng: location.lng,
          pickup_unit: location.unit || "",
          pickup_location_source: location.adjusted ? "customer_adjusted" : "verified_geocode",
        } : {}),
        ...(accessTags.length || accessNote.trim() ? { access_notes: { tags: accessTags, note: accessNote.trim() } } : {}),
      });
      if (!res.data?.ok || !res.data?.reference_code) throw new Error("Request confirmation unavailable");
      setResult(res.data);
      setStep(3);
      base44.analytics.track({ eventName: "national_request_submitted", properties: { flow: "instant", province, service: activeService } });
    } catch (err) {
      setError(err?.response?.data?.error || t.errors.submit);
    } finally {
      setLoading(false);
    }
  };

  const tax = TAX_RATES[province] || null;

  return (
    <section id="book" className="relative bg-market-bg text-market-ink">
      <div className="mx-auto grid max-w-screen-2xl items-start gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(20rem,0.8fr)_minmax(0,1.7fr)] lg:gap-7 lg:py-6">
      <div className="min-w-0">
        <PickupHeroHeading lang={lang} onLanguage={setLang} step={step} copy={t} />
        <div className="mt-4">
          {step === 0 && (
            <div className="rounded-2xl border border-market-line bg-market-surface p-4 sm:p-5">
              <AddressSearch lang={lang} onSelect={onAddressSelect} />
              {location && (
                <div className="mb-3 rounded-xl border border-[#187B65]/40 bg-[#187B65]/10 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#54D9AE]" />
                    <p className="min-w-0 text-sm">
                      <span className="font-bold">{location.street_level ? "≈ " : ""}{location.label}{location.unit ? `, ${lang === "fr" ? "unité" : "unit"} ${location.unit}` : ""}</span>
                      <span className="block text-xs text-market-muted">{[location.city, location.province_name, location.postal_code].filter(Boolean).join(", ")}</span>
                      {location.street_level && <span className="block text-[11px] font-semibold text-[#FBBF24]">{lang === "fr" ? "Point approximatif — ajustez l'épingle sur la carte." : "Approximate point — adjust the pin on the map."}</span>}
                    </p>
                  </div>
                  <label className="mt-2 block max-w-xs">
                    <span className="mb-1 block text-xs font-semibold">{lang === "fr" ? "Unité / appartement (facultatif)" : "Unit / apartment (optional)"}</span>
                    <input value={location.unit} onChange={(e) => setLocation({ ...location, unit: e.target.value })} maxLength={40} className="input bg-white/95" placeholder={lang === "fr" ? "p. ex. 304" : "e.g. 304"} autoComplete="address-line2" />
                  </label>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-sm font-semibold mb-1.5">{t.postal}</span>
                <input
                  value={postalRaw}
                  onChange={(e) => setPostalRaw(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && goPostal()}
                  maxLength={7}
                  className="input bg-white/95 font-mono tracking-[0.25em] uppercase"
                  placeholder={t.postalPh}
                  inputMode="text"
                />
              </label>
              {territoryNeeded(normalizePostal(postalRaw)) && (
                <div className="order-3 col-span-2 mt-1">
                  <span className="block text-sm font-semibold mb-2">{t.pickTerritory}</span>
                  <div className="flex gap-2">
                    {["NT", "NU"].map((c) => (
                      <button key={c} onClick={() => setTerritory(c)} className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${territory === c ? "bg-brand-emerald text-market-ink border-[#187B65]" : "border-white/25 hover:border-[#187B65]"}`}>
                        {networkRegionName({ code: c, name: c === "NT" ? "Northwest Territories" : "Nunavut" }, lang)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold">{lang === "fr" ? "Ville / municipalité" : "City / municipality"}</span>
                <input value={city} onChange={(e) => setCity(e.target.value)} list="instant-pickup-cities" maxLength={120} className="input bg-white/95" autoComplete="address-level2" placeholder={lang === "fr" ? "Votre ville" : "City name"} />
                <datalist id="instant-pickup-cities">{CITIES.map((c) => <option key={c.name} value={c.name} />)}</datalist>
              </label>
              </div>
              {postalOk && <PickupCoverageNotice city={city} lang={lang} dark />}
              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              <button onClick={goPostal} className="mt-5 w-full rounded-full bg-brand-emerald text-market-ink font-bold px-7 py-4 hover:bg-brand-emerald/90 transition-colors flex items-center justify-center gap-2">
                {t.postalNext} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="rounded-2xl border border-market-line bg-market-surface p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-lg font-bold">{t.materials}</h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#54D9AE]">
                  <MapPin className="w-3.5 h-3.5" /> {postalRaw || fsa} · {networkRegionName({ code: province, name: provinceName(province) || province }, lang)}
                </span>
              </div>
              <p className="text-xs text-market-muted mb-4">{t.materialsSub}</p>
              <PickupCoverageNotice city={city} lang={lang} dark />
              <div className="grid sm:grid-cols-2 gap-2">
                {MATERIALS.map((m) => (
                  <div key={m.key} className="flex items-center justify-between bg-white/95 rounded-xl px-3 py-2.5">
                    <span className="text-sm font-semibold text-[#102B2A]">{lang === "fr" ? m.fr : m.en}</span>
                    <div className="flex items-center gap-1.5">
                      <button type="button" onClick={() => bump(m.key, -1)} aria-label="-" className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center">
                        <Minus className="w-3.5 h-3.5 text-slate-600" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-[#102B2A]">{qty[m.key] || 0}</span>
                      <button type="button" onClick={() => bump(m.key, 1)} aria-label="+" className="w-7 h-7 rounded-full bg-[#187B65]/15 hover:bg-[#187B65]/30 flex items-center justify-center">
                        <Plus className="w-3.5 h-3.5 text-[#187B65]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              <div className="mt-5 flex gap-2">
                <button onClick={() => setStep(0)} className="rounded-full border border-white/25 px-5 py-3 text-sm font-bold hover:border-white/50 transition-colors inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> {lang === "fr" ? "Retour" : "Back"}
                </button>
                <button onClick={getEstimate} disabled={loading} className="flex-1 rounded-full bg-brand-emerald text-market-ink font-bold px-7 py-4 hover:bg-brand-emerald/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
                  {loading ? t.submitting : t.estNext}
                </button>
              </div>
            </div>
          )}

          {step === 2 && estimate && (
            <form onSubmit={submit} className="rounded-2xl border border-market-line bg-market-surface p-4 sm:p-5">
              <h3 className="text-lg font-bold">{t.estimate}</h3>
              <div className="mt-4 rounded-2xl bg-[#102B2A]/60 border border-[#187B65]/25 p-5">
                <div className="text-4xl md:text-5xl font-bold tracking-tight">{estimate.range}</div>
                <div className="mt-2 inline-block rounded-full border border-market-line bg-market-bg text-market-accent font-semibold px-4 py-1.5 text-sm">{estimate.label}</div>
                <div className="mt-4 pt-4 border-t border-[#187B65]/20 grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-market-muted text-xs font-bold uppercase tracking-wider">{t.subtotal}</div>
                    <div className="font-bold mt-0.5 tabular-nums">{estimate.range} CAD</div>
                  </div>
                  <div>
                    <div className="text-market-muted text-xs font-bold uppercase tracking-wider">{t.taxLabel}</div>
                    <div className="font-bold mt-0.5">{tax ? tax.label : `GST (5%) — ${province || "?"}`}</div>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-market-muted">{t.taxNote}</p>
                <p className="mt-1 text-[11px] text-market-muted flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#187B65] shrink-0" />{t.incl}</p>
                <p className="mt-2 text-[11px] text-market-muted">
                  {lang === "fr" ? "Estimation préliminaire. Le prix final est soumis à votre approbation avant le travail. Tout ajout exige une approbation distincte." : "Preliminary estimate. You approve the final price before work begins. Additional items require a separate quote and your approval."}
                </p>
              </div>

              <PickupCoverageNotice city={city} lang={lang} dark />
              <h3 className="text-lg font-bold mt-6 mb-3">{t.contact}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input required placeholder={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input bg-white/95" autoComplete="name" />
                <input required placeholder={t.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input bg-white/95" autoComplete="tel" type="tel" />
                <input placeholder={t.emailOpt} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input bg-white/95" type="email" autoComplete="email" />
                <input value={form.preferred_date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} className="input bg-white/95" type="date" aria-label={t.dateOpt} />
              </div>
              <h3 className="text-lg font-bold mt-6 mb-2">{lang === "fr" ? "Préparation du travail (Rex)" : "Job preparation (Rex)"}</h3>
              <p className="text-xs text-market-muted mb-2">{lang === "fr" ? "Rex transmet ces détails à votre entrepreneur — ils ne changent jamais l'estimation." : "Rex passes these details to your contractor — they never change the estimate."}</p>
              <div className="flex flex-wrap gap-2">
                {ACCESS_TAGS.map((tag) => (
                  <button key={tag.key} type="button" onClick={() => setAccessTags((tags) => (tags.includes(tag.key) ? tags.filter((k) => k !== tag.key) : [...tags, tag.key]))} aria-pressed={accessTags.includes(tag.key)} className={`min-h-10 rounded-full border px-3.5 text-sm font-bold transition-colors ${accessTags.includes(tag.key) ? "border-[#187B65] bg-[#187B65]/20 text-market-ink" : "border-white/25 hover:border-[#187B65]"}`}>{lang === "fr" ? tag.fr : tag.en}</button>
                ))}
              </div>
              <input value={accessNote} onChange={(e) => setAccessNote(e.target.value)} maxLength={200} className="input bg-white/95 mt-2" placeholder={lang === "fr" ? "Note d'accès (facultatif) — p. ex. entrée par la ruelle" : "Access note (optional) — e.g. enter from the back lane"} />
              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="rounded-full border border-white/25 px-5 py-3 text-sm font-bold hover:border-white/50 transition-colors inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> {lang === "fr" ? "Retour" : "Back"}
                </button>
                <button type="submit" disabled={loading} className="flex-1 rounded-full bg-brand-emerald text-market-ink font-bold px-7 py-4 hover:bg-brand-emerald/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {loading ? t.submitting : t.submit}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="rounded-3xl bg-white/5 border border-[#187B65]/40 p-6 md:p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#187B65] mx-auto" />
              <p className="mt-3 text-sm text-market-muted">{t.doneSub}</p>
              <div className="mt-3 inline-block rounded-2xl bg-[#102B2A]/70 border border-[#187B65]/30 px-6 py-3 font-mono text-xl font-bold tracking-[0.25em] text-white">
                {result?.reference_code || "PENDING"}
              </div>
              <p className="mt-4 text-xs text-market-muted">{t.matchingNote}</p>
              <a href={`/request-status?reference=${encodeURIComponent(result?.reference_code || "")}`} className="mt-5 inline-block rounded-full bg-[#187B65] text-white font-bold px-6 py-3 text-sm hover:bg-[#1FA184] transition-colors">
                {lang === "fr" ? "Suivre ma demande" : "Track my request"}
              </a>
            </div>
          )}
        </div>
      </div>
      <div className="min-w-0"><HeroCanadaBackground lang={lang} /></div>
      </div>
    </section>
  );
}