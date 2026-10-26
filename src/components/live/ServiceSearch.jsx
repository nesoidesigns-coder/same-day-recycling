import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, ArrowRight, Sparkles, RefreshCw } from "lucide-react";
import { CITIES } from "@/lib/cities";
import { base44 } from "@/api/base44Client";
import { setRexContext } from "@/lib/rexSession";

const SERVICES = [
  { label: "Junk Removal", to: "/request-service" },
  { label: "Furniture Removal", to: "/furniture-removal" },
  { label: "Appliance Removal", to: "/appliance-removal" },
  { label: "Electronics Recycling", to: "/electronics-recycling" },
  { label: "Metal Pickup", to: "/free-metal-pickup" },
  { label: "Property Cleanouts", to: "/commercial-recycling" },
  { label: "Same-Day Pickup", to: "/same-day-pickup" },
];

const POSTAL_RE = /^[A-Za-z]\d[A-Za-z](\s?\d[A-Za-z]\d)?$/;
const norm = (s) => String(s || "").trim().replace(/,.*$/, "").replace(/\s+/g, " ").toLowerCase();

// Customer-first service search: a city (or postal code) plus the service
// needed. Coverage status comes from the verified coverage hook — availability
// is never assumed, and unmatched locations stay honest.
export default function ServiceSearch({ cov, onPickCity }) {
  const [query, setQuery] = useState("");
  const [service, setService] = useState(SERVICES[0].label);
  const [result, setResult] = useState(null);

  const search = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    base44.analytics.track({ eventName: "live_service_search", properties: { service } });
    const isPostal = POSTAL_RE.test(q);
    const match = CITIES.find((c) => norm(c.name) === norm(q));
    if (match) {
      setResult({ kind: "city", city: match, status: cov.loaded ? cov.statusFor(match.name) : null });
    } else if (isPostal) {
      setResult({ kind: "postal", query: q });
    } else {
      setResult({ kind: "unmatched", query: q });
    }
  };

  const askRex = (city) => {
    window.dispatchEvent(new CustomEvent("rex:open", {
      detail: { question: `What should I know about ${service.toLowerCase()} ${city ? `in ${city}` : "in my city"}?` },
    }));
  };

  const statusBadge = (status) => {
    const map = {
      same_day: { label: "Verified contractor coverage", cls: "bg-cine-green/15 text-cine-green" },
      matching: { label: "Requests open — contractor matching", cls: "bg-amber-400/10 text-amber-300" },
      recruiting: { label: "Requests open — recruiting a provider", cls: "bg-cine-arctic/15 text-cine-arctic" },
      currently_unavailable: { label: "No current dispatch availability", cls: "bg-cine-bg/60 text-cine-muted border border-cine-line/50" },
      unknown: { label: "Open for requests — status not yet verified", cls: "bg-cine-bg/60 text-cine-muted border border-cine-line/50" },
    };
    const s = map[status || "unknown"] || map.unknown;
    return <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${s.cls}`}>{s.label}</span>;
  };

  return (
    <section className="cine-fade-up cine-glass rounded-[24px] p-5">
      <h2 className="flex items-center gap-2 text-base font-bold text-cine-ink">
        <Search className="w-4 h-4 text-cine-cyan" /> Find service near you
      </h2>
      <p className="mt-1 text-sm text-cine-muted">Enter a Canadian city or postal code and pick the service you need.</p>

      <form onSubmit={search} className="mt-3 flex flex-col gap-2 sm:flex-row">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="City or postal code (e.g. Vancouver)"
          aria-label="City or postal code"
          className="cine-input flex-1 !rounded-full py-3 text-sm"
        />
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          aria-label="Service needed"
          className="cine-input !rounded-full py-3 text-sm sm:w-52"
        >
          {SERVICES.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
        </select>
        <button type="submit" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-amber-400 px-6 py-3 text-sm font-bold text-[#0a1220] transition-all hover:brightness-95">
          Search <ArrowRight className="h-4 w-4" />
        </button>
      </form>

      {result?.kind === "city" && (
        <div className="mt-4 rounded-2xl bg-cine-surface/60 border border-cine-line/60 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <MapPin className="w-4 h-4 text-cine-cyan" />
            <span className="font-bold text-cine-ink">{result.city.name}</span>
            {statusBadge(result.status)}
          </div>
          <p className="mt-2 text-xs leading-relaxed text-cine-muted">
            Requests are open nationwide. When a contractor is verified for this city the status above says so — otherwise your request enters local matching or recruitment. Price and arrival window are always confirmed with you before anything is scheduled.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to={`/request-service?city=${encodeURIComponent(result.city.name)}`}
              onClick={() => {
                setRexContext({ page: "live", city: result.city.name, intent: `Needs ${service.toLowerCase()}` });
                onPickCity(result.city);
              }}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-xs font-bold text-[#0a1220] hover:brightness-95 transition-all"
            >
              Request {service.toLowerCase()} in {result.city.name} <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link to={SERVICES.find((s) => s.label === service)?.to || "/request-service"} className="inline-flex items-center gap-1.5 rounded-full border border-cine-line/70 bg-cine-bg/60 px-4 py-2 text-xs font-bold text-cine-ink hover:border-cine-cyan/60 hover:text-cine-cyan transition-colors">
              About {service}
            </Link>
            <Link to="/pricing" className="inline-flex items-center gap-1.5 rounded-full border border-cine-line/70 bg-cine-bg/60 px-4 py-2 text-xs font-bold text-cine-ink hover:border-cine-cyan/60 hover:text-cine-cyan transition-colors">
              Published pricing
            </Link>
            <button onClick={() => askRex(result.city.name)} className="inline-flex items-center gap-1.5 rounded-full border border-cine-line/70 bg-cine-bg/60 px-4 py-2 text-xs font-bold text-cine-ink hover:border-cine-cyan/60 hover:text-cine-cyan transition-colors">
              <Sparkles className="w-3.5 h-3.5" /> Ask Rex
            </button>
          </div>
        </div>
      )}

      {result?.kind === "postal" && (
        <div className="mt-4 rounded-2xl bg-cine-bg/60 border border-cine-line/50 p-4 text-sm text-cine-muted">
          <p>
            <span className="font-bold text-cine-ink">{result.query}</span> is open for service like every Canadian address — detailed postal-level coverage isn't mapped here yet. Describe your location when you request service and we'll match you locally.
          </p>
          <Link to="/request-service" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-cine-cyan hover:underline">
            Request a pickup <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {result?.kind === "unmatched" && (
        <div className="mt-4 rounded-2xl bg-cine-bg/60 border border-cine-line/50 p-4 text-sm text-cine-muted">
          <p>We couldn't match “{result.query}” to a tracked city — but requests are accepted in every Canadian city, town and rural area.</p>
          <Link to="/request-service" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-cine-cyan hover:underline">
            Request service anyway <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {result === null && !cov.loaded && !cov.error && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-cine-muted"><RefreshCw className="w-3 h-3 animate-spin" /> Coverage records loading…</p>
      )}
    </section>
  );
}