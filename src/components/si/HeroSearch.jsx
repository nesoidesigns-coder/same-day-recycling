import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, ArrowRight, Sofa, Refrigerator, Trash2, Boxes, KeyRound, Building2 } from "lucide-react";
import { SERVICE_SHORTCUTS } from "./siShared";

const ICONS = { furniture: Sofa, appliance: Refrigerator, junk: Trash2, moving: Boxes, estate: KeyRound, commercial: Building2 };

// Section 1 — The Customer Arrival: headline, search, quote action and the six
// service shortcuts. Selecting a shortcut updates the intelligence on the page
// and reveals direct actions; it never forces the customer to re-enter context.
export default function HeroSearch({ category, onCategory, city, onCity, cities }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const selected = SERVICE_SHORTCUTS.find((s) => s.category === category && s.category) || null;

  const findService = (e) => {
    e.preventDefault();
    const text = `${query.trim() || "junk removal"} in ${city || "Canada"}`;
    navigate(`/service-finder?q=${encodeURIComponent(text)}`);
  };

  const quoteTo = `/request-service${city ? `?city=${encodeURIComponent(city)}` : ""}`;

  return (
    <div id="top">
      <h1 className="text-[32px] font-bold leading-[1.08] tracking-tight text-si-ink md:text-[52px]">
        What Can We Help You Remove?
      </h1>
      <p className="mt-4 max-w-xl text-base leading-relaxed text-si-muted md:text-lg">
        From one couch to a complete cleanout, explore local pickup options, transparent pricing, and smarter
        recycling across Canada.
      </p>

      <form onSubmit={findService} className="mt-7 max-w-xl">
        <div className="flex items-center gap-3 rounded-2xl border border-si-line bg-white px-4 py-1 shadow-sm">
          <Search className="size-5 shrink-0 text-si-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search furniture, appliances, junk removal, moving..."
            aria-label="What do you need removed?"
            className="h-14 w-full bg-transparent text-base text-si-ink outline-none placeholder:text-si-muted/70"
          />
        </div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <div className="flex flex-1 items-center gap-3 rounded-2xl border border-si-line bg-white px-4 py-1 shadow-sm">
            <MapPin className="size-5 shrink-0 text-si-muted" />
            <input
              value={city}
              onChange={(e) => onCity(e.target.value)}
              list="si-city-options"
              placeholder="Enter your city or postal code"
              aria-label="Your city or postal code"
              className="h-14 w-full bg-transparent text-base text-si-ink outline-none placeholder:text-si-muted/70"
            />
            <datalist id="si-city-options">
              {cities.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>
          <button
            type="submit"
            className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-si-forest px-7 text-base font-bold text-white shadow-sm transition-colors hover:bg-si-mint hover:text-si-forest"
          >
            Find My Service <ArrowRight className="size-4" />
          </button>
        </div>
        <Link to={quoteTo} className="mt-3 inline-flex h-12 items-center rounded-2xl border border-si-forest/25 px-6 text-sm font-bold text-si-forest transition-colors hover:bg-si-forest hover:text-white">
          Get a Free Quote
        </Link>
      </form>

      {/* Six service shortcuts */}
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 max-w-xl">
        {SERVICE_SHORTCUTS.map((s) => {
          const Icon = ICONS[s.key];
          const active = category && s.category === category;
          return (
            <button
              key={s.key}
              onClick={() => onCategory(active ? "" : s.category)}
              aria-pressed={Boolean(active)}
              className={`flex items-center gap-2.5 rounded-2xl border px-3.5 py-3 text-left transition-all ${
                active ? "border-si-mint bg-si-mint/10 shadow-sm" : "border-si-line bg-white hover:border-si-mint/60"
              }`}
            >
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-xl ${active ? "bg-si-mint text-white" : "bg-si-bg2 text-si-forest"}`}>
                <Icon className="size-5" />
              </span>
              <span className={`text-[13px] font-bold leading-tight ${active ? "text-si-forest" : "text-si-ink"}`}>{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Contextual actions for the selected service */}
      {selected && (
        <div className="mt-4 flex max-w-xl flex-wrap items-center gap-3 rounded-2xl border border-si-line bg-si-bg2 px-4 py-3">
          <span className="text-sm font-semibold text-si-ink">
            {selected.label} selected — the intelligence below is updated.
          </span>
          <Link
            to={selected.to}
            className="inline-flex items-center gap-1.5 rounded-full bg-si-forest px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-si-mint hover:text-si-forest"
          >
            Explore {selected.label} <ArrowRight className="size-3.5" />
          </Link>
          <Link to={quoteTo} className="text-sm font-bold text-si-forest underline-offset-4 hover:underline">
            Get a Quote
          </Link>
        </div>
      )}
    </div>
  );
}