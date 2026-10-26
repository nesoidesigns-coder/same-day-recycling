import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CITIES } from "@/lib/cities";
import { invoke } from "@/components/si/siShared";
import { ArrowRight, Armchair, BedDouble, Check, Leaf, Minus, Package, Plus, Refrigerator, Share2, Tv, WashingMachine } from "lucide-react";

// Typical published averages for bulky household items. Estimates only — the
// actual weight is measured at pickup, and donation always comes first.
// q = the truck-space key the quote engine resolves (base44/shared/pricing.ts).
const ITEMS = [
  { key: "couch", q: "sofa", label: "Sofa or armchair", kg: 40, Icon: Armchair, note: "Donated when usable" },
  { key: "fridge", q: "fridge", label: "Fridge or freezer", kg: 80, Icon: Refrigerator, note: "Recycled as scrap metal" },
  { key: "mattress", q: "mattress", label: "Mattress", kg: 30, Icon: BedDouble, note: "Donated or broken down" },
  { key: "washer", q: "washer", label: "Washer or dryer", kg: 70, Icon: WashingMachine, note: "Recycled as scrap metal" },
  { key: "tv", q: "tv", label: "TV or electronics", kg: 15, Icon: Tv, note: "E-waste recovery" },
  { key: "boxes", q: "bags/boxes of junk", label: "Bag or box of junk", kg: 10, Icon: Package, note: "Sorted by material" },
];

export default function ImpactEstimator({ className = "" }) {
  const [counts, setCounts] = useState({});
  const [copied, setCopied] = useState(false);
  const [city, setCity] = useState("");
  const [quote, setQuote] = useState(null);
  const [loadingQuote, setLoadingQuote] = useState(false);

  const selected = ITEMS.filter((i) => counts[i.key] > 0);
  const total = selected.reduce((sum, i) => sum + i.kg * counts[i.key], 0);
  const count = selected.reduce((sum, i) => sum + counts[i.key], 0);

  // Preliminary price from the published rate engine, debounced while tapping.
  useEffect(() => {
    if (!count) {
      setQuote(null);
      setLoadingQuote(false);
      return;
    }
    setLoadingQuote(true);
    const t = setTimeout(async () => {
      try {
        const data = await invoke("quoteEstimate", {
          items: selected.map((i) => ({ name: i.q, quantity: counts[i.key] })),
          city,
        });
        setQuote(data);
      } catch {
        setQuote(null);
      } finally {
        setLoadingQuote(false);
      }
    }, 400);
    return () => clearTimeout(t);
  }, [counts, city]);

  const bump = (key, delta) =>
    setCounts((c) => ({ ...c, [key]: Math.max(0, (c[key] || 0) + delta) }));

  const share = async () => {
    const text = count
      ? `My Same Day Recycling estimate: about ${total} kg that could be donated or recycled instead of landfilled. Estimate yours: https://samedayrecycling.ca/impact-calculator`
      : "What happens to your junk? Estimate your recycling impact: https://samedayrecycling.ca/impact-calculator";
    if (navigator.share) {
      try { await navigator.share({ title: "Same Day Recycling — Impact Estimator", text }); return; } catch { /* user cancelled */ }
    }
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };

  return (
    <div className={`grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] ${className}`}>
      {/* Item picker */}
      <div className="rounded-[24px] border border-si-line bg-white p-4 shadow-sm sm:p-6">
        <h3 className="text-lg font-bold text-ri-charcoal">What are you getting rid of?</h3>
        <p className="mt-1 text-sm text-ri-slate">Tap the plus to add items. We donate what's usable first, recycle the rest.</p>
        <label className="mt-3 flex items-center gap-2 text-xs font-bold text-si-muted">
          Prices for
          <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-full border border-si-line bg-white px-3 py-1.5 text-xs font-semibold text-si-ink">
            <option value="">Canada — standard rates</option>
            {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
          </select>
        </label>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {ITEMS.map(({ key, label, Icon, note }) => (
            <div key={key} className="flex items-center gap-2.5 rounded-2xl border border-si-line bg-ri-ivory px-3 py-2.5">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-ri-forest">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block truncate text-[13px] font-bold text-ri-charcoal">{label}</span>
                <span className="block text-[11px] text-ri-slate">{note}</span>
              </span>
              <div className="flex shrink-0 items-center gap-1.5">
                <button onClick={() => bump(key, -1)} aria-label={`Remove one ${label}`} className="flex size-7 items-center justify-center rounded-full border border-si-line bg-white text-ri-forest transition-colors hover:bg-ri-mint">
                  <Minus className="size-3.5" />
                </button>
                <span className={`w-4 text-center font-plex text-sm font-bold ${counts[key] ? "text-ri-forest" : "text-ri-slate/50"}`}>{counts[key] || 0}</span>
                <button onClick={() => bump(key, 1)} aria-label={`Add one ${label}`} className="flex size-7 items-center justify-center rounded-full bg-ri-amber text-ri-charcoal transition-transform hover:scale-105">
                  <Plus className="size-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live impact readout */}
      <div className="rounded-[24px] border border-si-line bg-ri-forest p-6 text-ri-ivory shadow-sm">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-ri-ivory/70">
          <Leaf className="size-4" /> Your estimated impact
        </div>
        {count ? (
          <>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-plex text-5xl font-extrabold tracking-tight">{total}</span>
              <span className="text-lg font-bold text-ri-ivory/80">kg</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ri-ivory/85">
              across {count} item{count === 1 ? "" : "s"} that we would sort for donation first, then recycling — kept out of the landfill.
            </p>
          </>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-ri-ivory/85">
            Add items to see an estimate of the weight we could donate or recycle instead of landfills. An empty load reads zero — never a guess.
          </p>
        )}
        <div className="mt-4 rounded-xl bg-ri-ivory/10 px-3 py-2.5">
          <div className="text-[11px] font-bold uppercase tracking-[0.12em] text-ri-ivory/70">Preliminary price estimate</div>
          {loadingQuote ? (
            <div className="mt-1.5 flex items-center gap-2 text-sm text-ri-ivory/80">
              <span className="size-3.5 animate-spin rounded-full border-2 border-ri-ivory/40 border-t-ri-ivory" /> Calculating…
            </div>
          ) : quote ? (
            <>
              <div className="mt-1 font-plex text-2xl font-extrabold tracking-tight">{quote.range}</div>
              <p className="mt-0.5 text-[11px] leading-snug text-ri-ivory/75">{quote.label} — {quote.eighths}/8 of a truck. Final price approved by you before any work.</p>
            </>
          ) : (
            <p className="mt-1 text-[11px] leading-snug text-ri-ivory/75">
              {count ? "Price estimate unavailable right now — you still get a free quote before any booking." : "Add items to see a preliminary price range for the truck space they'd fill."}
            </p>
          )}
        </div>
        <p className="mt-3 rounded-xl bg-ri-ivory/10 px-3 py-2 text-[11px] leading-snug text-ri-ivory/75">
          Item weights are published averages and an estimate only — your load is measured at pickup, and recycling outcomes are reported in your receipt.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <Link to="/request-service" className="inline-flex items-center justify-center gap-1.5 rounded-full bg-ri-amber px-5 py-3 text-sm font-bold text-ri-charcoal transition-all hover:brightness-95">
            Get a free pickup quote <ArrowRight className="size-4" />
          </Link>
          <button onClick={share} className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ri-ivory/30 px-5 py-3 text-sm font-bold text-ri-ivory transition-colors hover:bg-ri-ivory/10">
            {copied ? <><Check className="size-4" /> Link copied</> : <><Share2 className="size-4" /> Share your impact</>}
          </button>
        </div>
      </div>
    </div>
  );
}