import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, CheckCircle2, Home, MapPin, Search, Store, Truck } from "lucide-react";

const TABS = [
  { key: "residential", label: "Residential", Icon: Home, line: "Furniture, appliances and household junk — cleared from anywhere on the property." },
  { key: "business", label: "Business", Icon: Store, line: "Office cleanouts, retail fixtures and recurring commercial pickups." },
  { key: "property", label: "Property Manager", Icon: Building2, line: "Tenant turnovers, strata cleanouts and scheduled building clearances." },
];

const STEPS = [
  { n: 1, label: "Enter location", Icon: MapPin },
  { n: 2, label: "Select service", Icon: Truck },
  { n: 3, label: "Get estimate", Icon: Search },
];

const TRUST = ["No hidden fees", "Free, no obligation", "Approved price guarantee"];

// The three-step booking card: category, then the postal code that starts the
// estimate. Nothing is booked or charged here.
export default function BookingCard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("residential");
  const [postal, setPostal] = useState("");
  const active = TABS.find((t) => t.key === tab);

  const submit = (e) => {
    e.preventDefault();
    const value = postal.trim();
    const params = new URLSearchParams();
    if (value) params.set("postal", value);
    params.set("segment", tab);
    navigate(`/request-service?${params.toString()}`);
  };

  return (
    <section>
      <div className="rounded-2xl border border-lm-line bg-white p-4 shadow-[0_10px_30px_-24px_rgba(16,43,42,0.35)] md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 rounded-xl bg-[hsl(var(--ri-mint)/0.45)] p-1" role="tablist" aria-label="Property type">
            {TABS.map(({ key, label, Icon }) => (
              <button
                key={key}
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-bold transition-colors ${
                  tab === key ? "bg-white text-lm-ink shadow-sm" : "text-lm-muted hover:text-lm-ink"
                }`}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4">
            {STEPS.map(({ n, label, Icon }) => (
              <div key={n} className="flex items-center gap-1.5">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-[hsl(var(--lm-teal))] font-plex text-[9.5px] font-bold text-white">{n}</span>
                <span className="hidden items-center gap-1 text-[11px] font-semibold text-lm-muted sm:flex">
                  <Icon className="h-3 w-3" /> {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-3 text-[12.5px] text-lm-muted">{active.line}</p>

        <form onSubmit={submit} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lm-muted" />
            <input
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              placeholder="Enter your postal code or city"
              aria-label="Enter your postal code or city"
              className="h-12 w-full rounded-xl border border-lm-line bg-white pl-10 pr-3 text-[13.5px] text-lm-ink placeholder:text-lm-muted focus:border-[hsl(var(--lm-teal))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--lm-teal)/0.25)]"
            />
          </div>
          <button
            type="submit"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-cn-orange px-6 text-[13.5px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Get My Estimate <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
          {TRUST.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-lm-muted">
              <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--ri-emerald))]" /> {t}
            </span>
          ))}
        </div>

        <Link to="/pricing" className="mt-2 inline-block text-[11px] font-bold text-[hsl(var(--lm-teal))] hover:underline">
          See how pricing works
        </Link>
      </div>
    </section>
  );
}