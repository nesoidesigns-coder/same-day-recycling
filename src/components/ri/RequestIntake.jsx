import { useState } from "react";
import { Loader2, Sparkles, Armchair, Refrigerator, PackageOpen, Recycle, Check } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Service-first intake: four elegant interactive categories plus a
// natural-language describe box. Interpretation reuses the platform's
// existing verified quote engine (quoteEstimate) — items, load size and a
// labeled preliminary range. Nothing here promises a confirmed price.
const CATEGORIES = [
  { key: "furniture", label: "Furniture Removal", icon: Armchair, blurb: "Sofas, mattresses, tables and more" },
  { key: "appliances", label: "Appliance Removal", icon: Refrigerator, blurb: "Fridges, washers, stoves, electronics" },
  { key: "cleanouts", label: "Property Cleanouts", icon: PackageOpen, blurb: "Rooms, garages, estates, turnovers" },
  { key: "junk_removal", label: "Recycling & Other Items", icon: Recycle, blurb: "Scrap metal, yard waste, mixed loads" },
];

export default function RequestIntake({ city, onServiceType, onFill, onEstimate }) {
  const [selected, setSelected] = useState(null);
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [estimate, setEstimate] = useState(null);
  const [error, setError] = useState("");


  const pick = (key) => {
    setSelected(key);
    onServiceType(key);
    base44.analytics.track({ eventName: "service_category_selected", properties: { service: key } });
  };

  const interpret = async () => {
    if (!description.trim() || loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await base44.functions.invoke("quoteEstimate", { description: description.trim().slice(0, 1000), city: city || "" });
      const data = res?.data;
      if (data?.error) {
        setError(data.error);
      } else {
        setEstimate(data);
        if (onEstimate) onEstimate(data);
        base44.analytics.track({ eventName: "quote_calculated", properties: { source: "request_service" } });
        const itemsText = (data.items || []).map((i) => `${i.quantity} × ${i.name}`).join(", ");
        if (itemsText && onFill) onFill(itemsText);
      }
    } catch {
      setError("Could not read your description — you can still submit the request form below.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white border border-si-line shadow-sm p-5 md:p-6">
      <div className="text-sm font-bold text-ri-charcoal">What do you need removed?</div>
      <div className="mt-3 grid grid-cols-2 gap-2.5">
        {CATEGORIES.map((c) => {
          const active = selected === c.key;
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => pick(c.key)}
              aria-pressed={active}
              className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all duration-200 ${
                active
                  ? "border-ri-emerald bg-ri-mint/60 shadow-sm"
                  : "border-si-line bg-ri-ivory hover:border-ri-emerald/50 hover:bg-ri-mint/30"
              }`}
            >
              <span className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${active ? "bg-ri-emerald text-white" : "bg-white text-ri-emerald border border-si-line"}`}>
                <c.icon className="w-[18px] h-[18px]" />
              </span>
              <span className="min-w-0">
                <span className="block text-[13px] font-bold text-ri-charcoal leading-snug">{c.label}</span>
                <span className="block text-[11px] text-ri-slate leading-snug mt-0.5">{c.blurb}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        <label htmlFor="ri-describe" className="block text-sm font-semibold text-ri-charcoal mb-1.5">
          Or just describe it in your own words
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <textarea
            id="ri-describe"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder='e.g. "I need a couch and two mattresses removed tomorrow"'
            className="input resize-none flex-1"
          />
          <button
            type="button"
            onClick={interpret}
            disabled={loading || !description.trim()}
            className="shrink-0 rounded-full bg-ri-emerald text-white font-bold px-5 py-3 text-sm inline-flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 min-h-[46px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {loading ? "Reading…" : "Estimate my load"}
          </button>
        </div>
        <p className="mt-1.5 text-[11px] text-ri-slate">We recognize your items and give an indicative range before you fill in any details.</p>
      </div>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {estimate && !error && (
        <div className="mt-4 rounded-xl bg-ri-ivory border border-si-line p-4" data-testid="preliminary-estimate">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-plex text-xl font-bold text-ri-charcoal">{estimate.range}</span>
            <span className="text-[11px] font-bold uppercase tracking-wide text-ri-emerald">{estimate.label}</span>
          </div>
          <div className="mt-1 font-plex text-[11px] text-ri-slate">Estimated load: {estimate.eighths}/8 of a truck</div>
          {estimate.items?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {estimate.items.slice(0, 12).map((i, idx) => (
                <span key={idx} className="inline-flex items-center gap-1 rounded-full bg-white border border-si-line px-2.5 py-1 text-[11px] font-semibold text-ri-charcoal">
                  <Check className="w-3 h-3 text-ri-emerald" /> {i.quantity} × {i.name}
                </span>
              ))}
            </div>
          )}
          <p className="mt-2.5 text-[11px] text-ri-slate flex items-start gap-1.5">
            <Sparkles className="w-3 h-3 shrink-0 mt-0.5 text-ri-emerald" />
            Preliminary estimate only — not a confirmed price. Your final price is confirmed and approved by you before any work happens.
          </p>
          {estimate.items?.length > 0 && (
            <p className="mt-1.5 text-[11px] font-semibold text-ri-emerald flex items-center gap-1">
              <Check className="w-3 h-3" /> Items added to your request below — edit or add details anytime.
            </p>
          )}
        </div>
      )}
    </div>
  );
}