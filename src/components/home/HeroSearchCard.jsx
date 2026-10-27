import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, MapPin } from "lucide-react";

const TABS = ["Residential", "Business", "Property Manager"];

const SERVICES = [
  { value: "", label: "Select service (optional)" },
  { value: "junk_removal", label: "Junk Removal" },
  { value: "furniture", label: "Furniture Removal" },
  { value: "appliances", label: "Appliance Removal" },
  { value: "electronics", label: "Electronics Recycling" },
  { value: "cleanouts", label: "Property Cleanout" },
  { value: "other", label: "Construction Debris" },
];

const NOTES = ["No hidden fees", "Free, no obligation", "Approved price guarantee"];

// The estimate card that sits over the hero: who you are, where you are, what
// you need — one step to the quote.
export default function HeroSearchCard() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(TABS[0]);
  const [postal, setPostal] = useState("");
  const [service, setService] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams({ customer_type: tab.toLowerCase().replace(/\s+/g, "_") });
    if (postal.trim()) params.set("postal", postal.trim().toUpperCase());
    if (service) params.set("service", service);
    navigate(`/request-service?${params.toString()}`);
  };

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl border border-lm-line bg-white p-4 shadow-[0_24px_60px_-32px_rgba(17,24,39,0.45)] md:p-5"
    >
      <div className="flex gap-1 overflow-x-auto rounded-xl bg-lm-bg p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`shrink-0 rounded-lg px-4 py-2 text-[13px] font-bold transition-colors ${
              tab === t ? "bg-white text-lm-ink shadow-sm" : "text-lm-muted hover:text-lm-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2.5 md:flex-row">
        <div className="relative flex-1">
          <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-lm-muted" />
          <input
            value={postal}
            onChange={(e) => setPostal(e.target.value)}
            placeholder="Enter your postal code"
            aria-label="Postal code"
            className="h-12 w-full rounded-xl border border-lm-line bg-white pl-10 pr-3 text-[14px] text-lm-ink placeholder:text-lm-muted/80 focus:border-[hsl(var(--lm-teal))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--lm-teal))]/20"
          />
        </div>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          aria-label="Service"
          className="h-12 rounded-xl border border-lm-line bg-white px-3 text-[14px] text-lm-ink focus:border-[hsl(var(--lm-teal))] focus:outline-none md:w-[240px]"
        >
          {SERVICES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-12 shrink-0 rounded-xl bg-gradient-to-r from-[#FFB13C] to-[#FF9F1C] px-6 text-[14px] font-bold text-white shadow-sm transition-opacity hover:opacity-95 md:w-[190px]"
        >
          Get My Estimate
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5">
        {NOTES.map((n) => (
          <span key={n} className="flex items-center gap-1.5 text-[12px] font-medium text-lm-muted">
            <Check className="h-3.5 w-3.5 text-[hsl(var(--lm-teal))]" /> {n}
          </span>
        ))}
      </div>
    </form>
  );
}