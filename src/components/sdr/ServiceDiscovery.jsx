import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin, CheckCircle2, XCircle, Search, Clock, Rocket, Loader2,
  ArrowRight, ShieldCheck, Globe,
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { CATEGORY_LABELS } from "@/lib/recyclingTaxonomy";
import { LETTER_PROVINCE, PROVINCE_NAMES } from "./PostalCheck";
import {
  COVERAGE, cityByName, activeCitiesByProvince,
  onboardingCitiesByProvince, comingSoonCitiesByProvince,
} from "@/lib/coverage";

const FSA_RE = /^[A-Z]\d[A-Z]$/;
const normalize = (v) => v.toUpperCase().replace(/[^A-Z0-9]/g, "");

const POPULAR = [
  { label: "Electronics", q: "electronics" },
  { label: "Metal", q: "metal" },
  { label: "Furniture", q: "furniture" },
  { label: "Appliances", q: "appliances" },
  { label: "Cardboard", q: "cardboard" },
  { label: "Plastics", q: "plastics" },
  { label: "Construction", q: "construction materials" },
];

// Resolves free text into a coverage location. Postal codes resolve to their
// province; plain text resolves to a city or province in the coverage source
// of truth. Never invents availability.
function resolveLocation(value) {
  const raw = value.trim();
  if (!raw) return { invalid: true };
  const n = normalize(raw);
  if (n.length >= 4) {
    const fsa = n.slice(0, 3);
    if (FSA_RE.test(fsa) && LETTER_PROVINCE[fsa[0]]) {
      return { type: "province", province: LETTER_PROVINCE[fsa[0]] };
    }
  }
  if (FSA_RE.test(n) && LETTER_PROVINCE[n[0]]) {
    return { type: "province", province: LETTER_PROVINCE[n[0]] };
  }
  const city = COVERAGE.find((c) => c.name.toLowerCase() === raw.toLowerCase());
  if (city) return { type: "city", city: city.name, province: city.province, status: city.status };
  const province = Object.values(PROVINCE_NAMES).find((p) => p.toLowerCase() === raw.toLowerCase());
  if (province) {
    const code = Object.keys(PROVINCE_NAMES).find((k) => PROVINCE_NAMES[k] === province);
    return { type: "province", province: code };
  }
  return { invalid: true };
}

export default function ServiceDiscovery({ onCity }) {
  const navigate = useNavigate();
  const [value, setValue] = useState("");
  const [step, setStep] = useState("location"); // location -> material -> results
  const [resolved, setResolved] = useState(null);
  const [material, setMaterial] = useState("");
  const [providers, setProviders] = useState(null);
  const [loading, setLoading] = useState(false);
  const [providersLoading, setProvidersLoading] = useState(false);

  const check = (e) => {
    e.preventDefault();
    setLoading(true);
    const r = resolveLocation(value);
    setResolved(r);
    setStep(r.invalid ? "location" : "material");
    setLoading(false);
  };

  const pickCity = (cityName) => {
    const c = cityByName(cityName);
    setResolved({ type: "city", city: cityName, province: c?.province, status: c?.status });
  };

  const loadProviders = () => {
    if (!resolved || providersLoading) return;
    setProvidersLoading(true);
    const q = resolved.type === "city"
      ? { verification: "verified", city: resolved.city }
      : { verification: "verified", province: resolved.province };
    base44.entities.Provider
      .filter(q, { sort: "-created_date", limit: 3 })
      .then((res) => {
        setProviders(res.items || res);
        setStep("results");
      })
      .catch(() => {
        setProviders([]);
        setStep("results");
      })
      .finally(() => setProvidersLoading(false));
  };

  const searchDirectory = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (material.trim()) params.set("q", material.trim());
    if (resolved?.type === "city") params.set("loc", resolved.city);
    else if (resolved?.province) params.set("loc", PROVINCE_NAMES[resolved.province]);
    navigate(`/recycling${params.toString() ? `?${params}` : ""}`);
  };

  const availability = resolved && !resolved.invalid && (() => {
    if (resolved.type === "city") {
      const c = cityByName(resolved.city);
      return { status: c?.status || "unknown", active: [], onboarding: [], comingSoon: [] };
    }
    return {
      status: "province",
      active: activeCitiesByProvince(resolved.province),
      onboarding: onboardingCitiesByProvince(resolved.province),
      comingSoon: comingSoonCitiesByProvince(resolved.province),
    };
  })();

  return (
    <div className="rounded-3xl bg-white shadow-xl border border-slate-100 p-5 md:p-6 text-left">
      <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#187B65] mb-2">Find services near you</div>
      <h2 className="text-lg font-bold text-[#102B2A] leading-snug">One search: your location, your material, verified providers.</h2>

      {/* Step 1 — one location field: postal code or city */}
      {step === "location" && (
        <form onSubmit={check} className="mt-4 grid gap-3" aria-label="Service location check">
          <div className="relative">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <label htmlFor="discovery-location" className="sr-only">Enter your postal code or city</label>
            <input
              id="discovery-location"
              value={value}
              onChange={(e) => { setValue(e.target.value); setResolved(null); }}
              placeholder="Postal code or city (e.g. M5V 2T6 or Surrey)"
              autoComplete="postal-code"
              className="input !bg-slate-50 pl-10"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full min-h-[48px] rounded-xl bg-[#187B65] text-white font-bold text-base uppercase tracking-wide px-6 py-3 hover:bg-[#125C4E] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Check coverage
          </button>
        </form>
      )}

      {resolved?.invalid && (
        <div className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            We couldn't place "{value}". Enter a Canadian postal code or a city we track.
            <button onClick={() => setStep("location")} className="block mt-1 font-bold text-[#187B65] underline">
              Try again
            </button>
          </span>
        </div>
      )}

      {/* Step 2 — real coverage status, then material selection */}
      {step === "material" && availability && (
        <div className="mt-4">
          <div className="rounded-xl bg-[#f4f7f5] border border-[#187B65]/20 px-4 py-4">
            {availability.status === "active" && (
              <div className="flex items-center gap-2 text-sm font-bold text-[#102B2A]">
                <CheckCircle2 className="w-4 h-4 text-[#187B65] shrink-0" />
                Same-day pickup is live in {resolved.city}
              </div>
            )}
            {availability.status === "partner_onboarding" && (
              <div className="flex items-start gap-2 text-sm font-bold text-[#102B2A]">
                <Rocket className="w-4 h-4 text-[#187B65] mt-0.5 shrink-0" />
                <span>Partner onboarding is underway in {resolved.city} — same-day pickup isn't confirmed there yet.</span>
              </div>
            )}
            {availability.status === "coming_soon" && (
              <div className="flex items-start gap-2 text-sm font-bold text-[#102B2A]">
                <Clock className="w-4 h-4 text-[#187B65] mt-0.5 shrink-0" />
                <span>Service is coming soon to {resolved.city} — not available yet.</span>
              </div>
            )}
            {availability.status === "province" && (
              <>
                <div className="flex items-start gap-2 text-sm font-bold text-[#102B2A]">
                  <MapPin className="w-4 h-4 text-[#187B65] mt-0.5 shrink-0" />
                  <span>
                    {availability.active.length > 0
                      ? `Same-day pickup is live in ${PROVINCE_NAMES[resolved.province]}:`
                      : availability.onboarding.length > 0
                        ? `Partner onboarding is underway in ${PROVINCE_NAMES[resolved.province]} — no confirmed same-day service yet.`
                        : `No confirmed service in ${PROVINCE_NAMES[resolved.province]} yet.`}
                  </span>
                </div>
                {availability.active.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {availability.active.map((city) => (
                      <button key={city} onClick={() => pickCity(city)} className="rounded-full bg-white border border-[#187B65]/40 px-4 py-2 text-sm font-bold text-[#102B2A] hover:border-[#187B65] transition-colors min-h-[44px]">
                        {city}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="mt-4">
            <div className="text-xs font-bold tracking-[0.15em] text-slate-400 uppercase mb-2">Step 2 · What do you need handled?</div>
            <div className="flex flex-wrap gap-2">
              {POPULAR.map((c) => (
                <button
                  key={c.q}
                  onClick={() => setMaterial(c.q)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors min-h-[44px] ${material === c.q ? "bg-[#187B65] text-white" : "bg-white border border-slate-200 text-[#102B2A] hover:border-[#187B65]"}`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <form onSubmit={searchDirectory} className="mt-3">
              <label htmlFor="discovery-material" className="sr-only">Material, product, or service</label>
              <input
                id="discovery-material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Or describe it (e.g. mattress, paint, e-waste)"
                className="input !bg-slate-50"
              />
            </form>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={loadProviders}
              disabled={providersLoading}
              className="w-full min-h-[48px] rounded-xl bg-[#187B65] text-white font-bold text-base uppercase tracking-wide px-6 py-3 hover:bg-[#125C4E] transition-colors disabled:opacity-60 inline-flex items-center justify-center gap-2"
            >
              {providersLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              Show verified providers
            </button>
            <button
              onClick={searchDirectory}
              className="w-full min-h-[48px] rounded-xl border-2 border-[#187B65] text-[#187B65] font-bold text-base uppercase tracking-wide px-6 py-3 hover:bg-[#187B65]/10 transition-colors inline-flex items-center justify-center gap-2"
            >
              Search directory <ArrowRight className="w-4 h-4" />
            </button>
          </div>
          {resolved.type === "city" && resolved.status === "active" && (
            <button
              onClick={() => onCity?.(resolved.city)}
              className="mt-2 w-full min-h-[48px] rounded-xl bg-[#102B2A] text-white font-bold text-base px-6 py-3 hover:bg-[#0a3020] transition-colors inline-flex items-center justify-center gap-2"
            >
              <Clock className="w-4 h-4 text-[#54D9AE]" /> Book a pickup in {resolved.city}
            </button>
          )}
        </div>
      )}

      {/* Step 3 — verified providers from real records only */}
      {step === "results" && (
        <div className="mt-4">
          {providers === null ? null : providers.length === 0 ? (
            <div className="rounded-xl bg-[#f4f7f5] border border-slate-100 px-4 py-4 text-sm text-slate-600">
              <div className="flex items-start gap-2 font-bold text-[#102B2A]">
                <Search className="w-4 h-4 text-[#187B65] mt-0.5 shrink-0" />
                <span>No verified providers listed near {resolved.type === "city" ? resolved.city : PROVINCE_NAMES[resolved.province]} yet.</span>
              </div>
              <p className="mt-1.5 pl-6">The network grows weekly — browse the full directory or request a pickup and we'll confirm what's possible.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {providers.map((p) => (
                <Link
                  key={p.id}
                  to={`/provider/${p.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-white border border-slate-100 px-4 py-3 hover:border-[#187B65] transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm font-bold text-[#102B2A]">
                      <span className="truncate">{p.name}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold shrink-0">
                        <ShieldCheck className="w-2.5 h-2.5" /> Verified
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" /> {[p.city, p.province].filter(Boolean).join(", ")}
                      {p.accepted_categories?.length > 0 && (
                        <span className="truncate">· {p.accepted_categories.slice(0, 2).map((k) => CATEGORY_LABELS[k] || k).join(", ")}</span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#187B65] shrink-0" />
                </Link>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link
              to="/recycling"
              className="w-full min-h-[48px] rounded-xl border-2 border-[#187B65] text-[#187B65] font-bold text-sm uppercase tracking-wide px-4 py-3 hover:bg-[#187B65]/10 transition-colors text-center inline-flex items-center justify-center gap-2"
            >
              <Globe className="w-4 h-4" /> Full directory
            </Link>
            {resolved.type === "city" && resolved.status === "active" && (
              <button
                onClick={() => onCity?.(resolved.city)}
                className="w-full min-h-[48px] rounded-xl bg-[#102B2A] text-white font-bold text-sm px-4 py-3 hover:bg-[#0a3020] transition-colors inline-flex items-center justify-center gap-2"
              >
                <Clock className="w-4 h-4 text-[#54D9AE]" /> Request a pickup
              </button>
            )}
          </div>
          <button onClick={() => { setStep("location"); setProviders(null); setMaterial(""); }} className="mt-3 text-xs font-bold text-[#187B65] underline">
            Start a new search
          </button>
        </div>
      )}
    </div>
  );
}