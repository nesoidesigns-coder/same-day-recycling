import { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  MapPin, Loader2, ArrowRight, ArrowLeft, CheckCircle2, Package, Calculator,
  Plus, Minus, Trash2, ShieldCheck, Sparkles,
} from "lucide-react";
import {
  normalizePostal, isValidPostal, provinceFromFsa, territoryNeeded, provinceName,
} from "@/lib/geo";
import { TAX_RATES } from "@/lib/canadaTax";

// Canada-first guided booking experience: postal code → materials → labeled
// estimate → pickup request. Bilingual (EN/FR), CAD, province-level tax shown
// transparently. Submits through the nationwide inquiry endpoint, which derives
// province from the FSA and sets verified/matching/recruiting coverage.

const T = {
  en: {
    tag: "Instant pickup request",
    title: "Get your pickup started in under a minute.",
    sub: "Enter your Canadian postal code, pick your items, see an honest estimate — done.",
    postal: "Your postal code",
    postalPh: "e.g. V6B 1A1",
    postalNext: "Continue",
    province: "Province / territory",
    pickTerritory: "Your postal region covers two territories — which one?",
    coverageNote: "Same-day service is live here — a verified local contractor takes your job.",
    matchingNote: "Nationwide dispatch is arranging a contractor in your area — nothing is scheduled or charged until one accepts.",
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
      "Here's your honest estimate. Leave the pricing to me.",
      "Sent! I'm watching your request and will keep you posted.",
    ],
    errors: {
      postal: "Enter a valid Canadian postal code (like V6B 1A1).",
      estimate: "Pick at least one item first.",
      submit: "Something went wrong — please try again or call (604) 849-1745.",
      missing: "Name, phone and at least one item are required.",
    },
  },
  fr: {
    tag: "Demande de collecte instantanée",
    title: "Démarrez votre collecte en moins d'une minute.",
    sub: "Entrez votre code postal canadien, choisissez vos articles, obtenez une estimation honnête — c'est fait.",
    postal: "Votre code postal",
    postalPh: "p. ex. V6B 1A1",
    postalNext: "Continuer",
    province: "Province / territoire",
    pickTerritory: "Votre région couvre deux territoires — lequel ?",
    coverageNote: "Le service le jour même est actif ici — un entrepreneur local vérifié prend en charge votre travail.",
    matchingNote: "Notre répartition nationale trouve un entrepreneur dans votre région — rien n'est planifié ni facturé avant l'acceptation.",
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
      "Voici votre estimation honnête. Laissez-moi gérer le prix.",
      "Envoyé ! Je surveille votre demande et je vous tiens au courant.",
    ],
    errors: {
      postal: "Entrez un code postal canadien valide (p. ex. V6B 1A1).",
      estimate: "Choisissez au moins un article d'abord.",
      submit: "Un problème est survenu — réessayez ou appelez le (604) 849-1745.",
      missing: "Le nom, le téléphone et au moins un article sont requis.",
    },
  },
};

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

const STEP_ICONS = [MapPin, Package, Calculator];

export default function InstantQuoteFlow() {
  const [lang, setLang] = useState("en");
  const [step, setStep] = useState(0); // 0 postal, 1 materials, 2 estimate+contact, 3 done
  const [fsa, setFsa] = useState("");
  const [postalRaw, setPostalRaw] = useState("");
  const [territory, setTerritory] = useState(""); // for X-prefix: "NT" | "NU"
  const [qty, setQty] = useState({});
  const [estimate, setEstimate] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", preferred_date: "" });
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

  const goPostal = () => {
    const norm = normalizePostal(postalRaw);
    if (!isValidPostal(norm)) { setError(t.errors.postal); return; }
    setError("");
    setFsa(norm);
    if (territoryNeeded(norm)) setTerritory("");
    setStep(1);
  };

  const getEstimate = async () => {
    if (!selected.length) { setError(t.errors.estimate); return; }
    setError("");
    setLoading(true);
    try {
      const items = selected.map((m) => ({ name: lang === "fr" ? m.fr : m.en, quantity: qty[m.key] }));
      const res = await base44.functions.invoke("quoteEstimate", { items });
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
        city: provinceName(province) || province,
        province_code: province,
        postal_code: postalRaw,
        service_type: activeService,
        items_description: itemsText,
        preferred_date: form.preferred_date,
      });
      setResult(res.data);
      setStep(3);
      base44.analytics.track({ eventName: "booking_submitted", properties: { flow: "instant", province, service_type: activeService } });
    } catch (err) {
      setError(err?.response?.data?.error || t.errors.submit);
    } finally {
      setLoading(false);
    }
  };

  const tax = TAX_RATES[province] || null;

  return (
    <section id="instant-quote" className="bg-[#102B2A] text-white">
      <div className="max-w-3xl mx-auto px-4 py-12 md:py-16">
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase">{t.tag}</div>
          <div className="flex rounded-full border border-white/20 p-0.5" role="group" aria-label="Language">
            {["en", "fr"].map((l) => (
              <button key={l} onClick={() => setLang(l)} className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-colors ${lang === l ? "bg-[#187B65] text-[#032015]" : "text-white/60 hover:text-white"}`}>
                {l === "en" ? "EN" : "FR"}
              </button>
            ))}
          </div>
        </div>

        <h2 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight">{step === 3 ? t.done : t.title}</h2>
        {step !== 3 && <p className="mt-3 text-slate-300 text-sm md:text-base">{t.sub}</p>}

        {/* Progress */}
        <div className="mt-5 flex items-center gap-2">
          {STEP_ICONS.map((Icon, i) => (
            <div key={i} className={`h-1.5 rounded-full flex-1 ${step > i ? "bg-[#187B65]" : step === i ? "bg-[#187B65]/50" : "bg-white/10"}`} />
          ))}
        </div>

        {/* Rex assist bar */}
        <div className="mt-5 flex items-center gap-3 rounded-2xl bg-white/5 border border-[#187B65]/30 px-4 py-3">
          <span className="rex-orb rex-orb--listening w-9 h-9"><span className="rex-orb__core" /></span>
          <p className="text-sm text-emerald-50/90 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#187B65] shrink-0" />
            {t.rexCues[Math.min(step, t.rexCues.length - 1)]}
          </p>
        </div>

        <div className="mt-6">
          {step === 0 && (
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-8">
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
                <div className="mt-4">
                  <span className="block text-sm font-semibold mb-2">{t.pickTerritory}</span>
                  <div className="flex gap-2">
                    {["NT", "NU"].map((c) => (
                      <button key={c} onClick={() => setTerritory(c)} className={`rounded-full border px-4 py-2 text-sm font-bold transition-colors ${territory === c ? "bg-[#187B65] text-[#032015] border-[#187B65]" : "border-white/25 hover:border-[#187B65]"}`}>
                        {c === "NT" ? "Northwest Territories" : "Nunavut"}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {postalOk ? (
                <p className="mt-4 text-[11px] text-emerald-100/60 flex items-start gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-[#187B65] shrink-0 mt-0.5" />
                  {t.matchingNote}
                </p>
              ) : null}
              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              <button onClick={goPostal} className="mt-5 w-full rounded-full bg-[#187B65] text-[#032015] font-bold px-7 py-4 hover:bg-[#1FA184] transition-colors flex items-center justify-center gap-2">
                {t.postalNext} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-8">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h3 className="text-lg font-bold">{t.materials}</h3>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#187B65]">
                  <MapPin className="w-3.5 h-3.5" /> {postalRaw || fsa} · {provinceName(province) || province}
                </span>
              </div>
              <p className="text-xs text-slate-400 mb-4">{t.materialsSub}</p>
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
                <button onClick={getEstimate} disabled={loading} className="flex-1 rounded-full bg-[#187B65] text-[#032015] font-bold px-7 py-4 hover:bg-[#1FA184] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
                  {loading ? t.submitting : t.estNext}
                </button>
              </div>
            </div>
          )}

          {step === 2 && estimate && (
            <form onSubmit={submit} className="rounded-3xl bg-white/5 border border-white/10 p-6 md:p-8">
              <h3 className="text-lg font-bold">{t.estimate}</h3>
              <div className="mt-4 rounded-2xl bg-[#102B2A]/60 border border-[#187B65]/25 p-5">
                <div className="text-4xl md:text-5xl font-bold tracking-tight">{estimate.range}</div>
                <div className="mt-2 inline-block rounded-full bg-[#187B65]/20 text-[#187B65] font-semibold px-4 py-1.5 text-sm">{estimate.label}</div>
                <div className="mt-4 pt-4 border-t border-[#187B65]/20 grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-emerald-100/50 text-xs font-bold uppercase tracking-wider">{t.subtotal}</div>
                    <div className="font-bold mt-0.5 tabular-nums">{estimate.range} CAD</div>
                  </div>
                  <div>
                    <div className="text-emerald-100/50 text-xs font-bold uppercase tracking-wider">{t.taxLabel}</div>
                    <div className="font-bold mt-0.5">{tax ? tax.label : `GST (5%) — ${province || "?"}`}</div>
                  </div>
                </div>
                <p className="mt-3 text-[11px] text-emerald-100/50">{t.taxNote}</p>
                <p className="mt-1 text-[11px] text-emerald-100/50 flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#187B65] shrink-0" />{t.incl}</p>
                <p className="mt-2 text-[11px] text-slate-400">
                  {lang === "fr" ? "Estimation préliminaire — le prix final est approuvé sur place." : "Preliminary estimate — you approve the final price on site."}
                </p>
              </div>

              <h3 className="text-lg font-bold mt-6 mb-3">{t.contact}</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                <input required placeholder={t.name} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input bg-white/95" autoComplete="name" />
                <input required placeholder={t.phone} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input bg-white/95" autoComplete="tel" type="tel" />
                <input placeholder={t.emailOpt} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input bg-white/95" type="email" autoComplete="email" />
                <input value={form.preferred_date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setForm({ ...form, preferred_date: e.target.value })} className="input bg-white/95" type="date" aria-label={t.dateOpt} />
              </div>
              {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="rounded-full border border-white/25 px-5 py-3 text-sm font-bold hover:border-white/50 transition-colors inline-flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> {lang === "fr" ? "Retour" : "Back"}
                </button>
                <button type="submit" disabled={loading} className="flex-1 rounded-full bg-[#187B65] text-[#032015] font-bold px-7 py-4 hover:bg-[#1FA184] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                  {loading ? t.submitting : t.submit}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <div className="rounded-3xl bg-white/5 border border-[#187B65]/40 p-6 md:p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#187B65] mx-auto" />
              <p className="mt-3 text-sm text-emerald-100/70">{t.doneSub}</p>
              <div className="mt-3 inline-block rounded-2xl bg-[#102B2A]/70 border border-[#187B65]/30 px-6 py-3 font-mono text-xl font-bold tracking-[0.25em] text-white">
                {result?.reference_code || "PENDING"}
              </div>
              <p className="mt-4 text-xs text-slate-400">{t.matchingNote}</p>
              <a href="/request-status" className="mt-5 inline-block rounded-full bg-[#187B65] text-[#032015] font-bold px-6 py-3 text-sm hover:bg-[#1FA184] transition-colors">
                {lang === "fr" ? "Suivre ma demande" : "Track my request"}
              </a>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}