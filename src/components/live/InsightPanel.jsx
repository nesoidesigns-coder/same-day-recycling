import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Info, CheckCircle2 } from "lucide-react";
import { LIVE_CATEGORIES, DEMAND_TYPE_LABELS } from "@/lib/liveCategories";

// Plain-language guidance per service category. General knowledge about how
// the service works — never invented counts, prices or availability.
const CATEGORY_GUIDE = {
  furniture_appliance_removal: {
    expl: "Couches, mattresses, fridges and other household items, picked up and sorted for donation or recycling first.",
    cost: "Priced by truck space: a single fridge is usually a minimum pickup; a roomful of furniture is typically a quarter to half load.",
    tip: "Mention fridges or freezers when you describe the job — they need certified refrigerant handling.",
  },
  moving_downsizing: {
    expl: "Clearing a home around a move — pre-move decluttering, final cleanouts, and estate transitions.",
    cost: "Priced by truck space across the job; larger moves often stage several pickups over a few weeks.",
    tip: "Book the final clearout after your movers leave so the crew takes everything the movers won't.",
  },
  renovation_construction_debris: {
    expl: "Renovation waste — drywall, lumber, shingles, fixtures and yard debris from projects and repairs.",
    cost: "Heavy materials are priced by weight bands, so heavy-but-small loads are quoted fairly.",
    tip: "Clean drywall and clean wood can often be recycled rather than landfilled — keeping them separate helps.",
  },
  property_management_turnover: {
    expl: "Between-tenant clearouts for rentals, stratas and managed properties.",
    cost: "Flat per-pickup tier pricing, with recurring plans for steady turnover volume.",
    tip: "Property managers can set up recurring service so every turnover is one message away.",
  },
  recycling_specialty_disposal: {
    expl: "Materials that need the right destination — electronics, scrap metal and other specialty streams.",
    cost: "Scrap metal is often free or discounted; specialty disposal follows the receiving facility's rates.",
    tip: "Not sure where something goes? The disposal advisor identifies the right stream and your local depot.",
  },
  commercial_office_cleanouts: {
    expl: "Office furniture, e-waste and cleanouts for businesses, storefronts and warehouses.",
    cost: "Volume-based tiers; access details like elevators or loading docks affect scheduling, not price.",
    tip: "Describe elevator and dock access so the crew arrives with the right equipment.",
  },
  urgent_same_day: {
    expl: "Pickups that need to happen today — the core of the same-day service.",
    cost: "Same tier pricing as any load; book before noon for the best same-day odds.",
    tip: "Book before noon — morning requests give the network the best chance to dispatch today.",
  },
  donation_reuse_circular: {
    expl: "Usable furniture and household goods routed to donation partners before anything is recycled or landfilled.",
    cost: "Loads that are mostly clean, reusable items can price lower — donation-friendly loads go further.",
    tip: "Flag reusable items in your description so the crew separates them for donation.",
  },
};

const SOURCE_LABEL = {
  reddit: "public community posts",
  public_forum: "public forums",
  search_console: "Google Search Console",
  keyword_dataset: "keyword datasets",
  recycling_os: "this platform's records",
  unlabelled: "other recorded sources",
};

export default function InsightPanel({ data, selectedRow, cov }) {
  const label = selectedRow ? LIVE_CATEGORIES[selectedRow.key] : null;
  const guide = selectedRow ? CATEGORY_GUIDE[selectedRow.key] : null;
  const verifiedCount = cov.verifiedCityNames?.length ?? null;

  const askRex = () => {
    window.dispatchEvent(new CustomEvent("rex:open", {
      detail: { question: label ? `Explain the ${label} signal in plain language.` : "Explain what Canada Live shows in plain language." },
    }));
  };

  return (
    <div className="rounded-2xl bg-white border border-si-line p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ri-charcoal">{label || "What the radar shows"}</h3>
          <p className="mt-1 text-sm leading-relaxed text-ri-slate">
            {guide
              ? guide.expl
              : "Each segment is a real service category. The segment's reach shows verified demand records for that category in your selected window — never estimates, and never blended across record types."}
          </p>
        </div>
        <button onClick={askRex} className="inline-flex shrink-0 items-center gap-1 rounded-full border border-si-line bg-ri-ivory px-3 py-1.5 text-xs font-bold text-ri-forest hover:border-ri-emerald transition-colors">
          <Sparkles className="w-3.5 h-3.5" /> Ask Rex
        </button>
      </div>

      {guide && (
        <div className="mt-3 space-y-2 text-sm">
          <div className="rounded-xl bg-ri-mint/40 border border-si-line px-3.5 py-2.5">
            <span className="text-xs font-bold uppercase tracking-wide text-ri-emerald-ink">What affects the price</span>
            <p className="mt-1 text-ri-charcoal leading-relaxed">{guide.cost}</p>
          </div>
          <div className="rounded-xl bg-ri-ivory border border-si-line px-3.5 py-2.5">
            <span className="text-xs font-bold uppercase tracking-wide text-ri-slate">Good to know</span>
            <p className="mt-1 text-ri-charcoal leading-relaxed">{guide.tip}</p>
          </div>
        </div>
      )}

      {selectedRow?.demand_types && (
        <div className="mt-4">
          <span className="text-xs font-bold uppercase tracking-wide text-ri-slate">Record types, kept separate</span>
          <ul className="mt-1.5 grid grid-cols-2 gap-1.5">
            {Object.entries(selectedRow.demand_types).map(([type, n]) => (
              <li key={type} className="flex items-baseline justify-between gap-2 rounded-lg bg-ri-ivory px-2.5 py-1.5 text-xs text-ri-charcoal">
                <span className="truncate">{DEMAND_TYPE_LABELS[type] || type}</span>
                <span className="tabular-nums font-bold">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!selectedRow && data?.by_source && Object.keys(data.by_source).length > 0 && (
        <div className="mt-4">
          <span className="text-xs font-bold uppercase tracking-wide text-ri-slate">Where records come from</span>
          <ul className="mt-1.5 space-y-1">
            {Object.entries(data.by_source).map(([src, n]) => (
              <li key={src} className="flex items-baseline justify-between gap-2 text-xs text-ri-charcoal">
                <span>{SOURCE_LABEL[src] || src}</span>
                <span className="tabular-nums font-bold">{n}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {verifiedCount != null && (
        <div className="mt-4 flex items-start gap-1.5 text-xs text-ri-slate">
          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ri-emerald-ink" />
          <span>{verifiedCount} cit{verifiedCount === 1 ? "y" : "ies"} currently have a verified contractor on file. Bookings are confirmed per job, after a contractor accepts.</span>
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/request-service" className="inline-flex items-center gap-1.5 rounded-full bg-ri-amber px-4 py-2 text-xs font-bold text-ri-charcoal hover:brightness-95 transition-all">
          Get a quote <ArrowRight className="w-3.5 h-3.5" />
        </Link>
        <Link to="/pricing" className="inline-flex items-center gap-1.5 rounded-full border border-si-line bg-white px-4 py-2 text-xs font-bold text-ri-forest hover:border-ri-emerald transition-colors">
          See pricing
        </Link>
      </div>
      <p className="mt-3 flex items-start gap-1.5 text-[11px] text-ri-slate">
        <Info className="mt-0.5 h-3 w-3 shrink-0" />
        Guidance here explains how the service works. It never invents prices, availability or demand counts — those come from the verified records beside it.
      </p>
    </div>
  );
}