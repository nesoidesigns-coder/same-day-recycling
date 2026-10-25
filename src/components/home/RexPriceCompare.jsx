import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, GitCompareArrows, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Rex Discover price comparison: shows our published rates next to the
// verified advertised prices on file for the customer's city. Averages are
// computed only from records on file — never estimated or invented.

const CAD = (n) => (typeof n === "number" ? "$" + Math.round(n).toLocaleString("en-CA") : null);

const TIERS = [
  ["minimum_pickup", "Minimum pickup"],
  ["one_eighth_truck", "1/8 load"],
  ["quarter_truck", "1/4 load"],
  ["half_truck", "1/2 load"],
  ["three_quarter_truck", "3/4 load"],
  ["full_truck", "Full load"],
];

export default function RexPriceCompare() {
  const [city, setCity] = useState("");
  const [cities, setCities] = useState([]);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const compare = async (c) => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("rexDiscover", { mode: "price_compare", city: c });
      const d = res.data || {};
      setCities(d.cities || []);
      setData(d);
    } catch {
      setData({ error: true });
    }
    setLoading(false);
  };

  // First load fetches the list of cities that have verified data on file.
  useEffect(() => { compare(""); }, []);

  const hasCity = Boolean(data?.city);

  return (
    <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <GitCompareArrows className="w-4 h-4 text-[#187B65]" />
        <h3 className="font-bold text-[#102B2A] text-sm">How our prices stack up</h3>
      </div>
      <p className="mt-1 text-xs text-slate-500">See our published rates next to the advertised prices on file in your city.</p>

      <form
        onSubmit={(e) => { e.preventDefault(); compare(city.trim()); }}
        className="mt-3 flex gap-2"
      >
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="Your city (e.g. Vancouver)"
          aria-label="City for price comparison"
          className="flex-1 min-w-0 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#102B2A] placeholder:text-slate-400 focus:border-[#187B65] focus:outline-none focus:ring-2 focus:ring-[#187B65]/30"
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-xl bg-[#187B65] text-white px-4 text-xs font-bold hover:bg-[#116553] disabled:opacity-40"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Compare"}
        </button>
      </form>

      {cities.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {cities.slice(0, 8).map((c) => (
            <button
              key={c}
              onClick={() => { setCity(c); compare(c); }}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${data?.city === c ? "border-[#187B65] bg-[#187B65]/10 text-[#187B65]" : "border-slate-200 bg-[#f4f7f5] text-slate-600 hover:border-[#187B65] hover:text-[#187B65]"}`}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking prices on file…
        </div>
      )}

      {data && !loading && (
        data.error ? (
          <p className="mt-3 text-xs font-semibold text-red-600">Couldn't load the comparison. Please try again.</p>
        ) : !hasCity ? (
          <p className="mt-3 text-xs text-slate-500">Pick your city above to see the side-by-side comparison.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {data.own_pricing && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  Our published rates{data.own_pricing.city ? ` — ${data.own_pricing.city}` : " (platform-wide)"}
                </div>
                <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {TIERS.filter(([k]) => data.own_pricing.tiers?.[k] != null).map(([k, label]) => (
                    <div key={k} className="rounded-lg bg-[#f4f7f5] px-2.5 py-2 text-xs">
                      <div className="text-slate-500">{label}</div>
                      <div className="font-bold text-[#102B2A]">{CAD(data.own_pricing.tiers[k])}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-xl border border-slate-200 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Advertised prices on file — {data.city}</div>
              {data.local_averages?.minimum_avg != null && data.local_averages?.provider_count > 0 ? (
                <p className="mt-1.5 text-xs text-[#102B2A]">
                  <span className="font-bold">{CAD(data.local_averages.minimum_avg)}</span> — average advertised minimum from {data.local_averages.provider_count} provider{data.local_averages.provider_count === 1 ? "" : "s"} on file
                  {data.local_averages.range_low_avg != null && (
                    <> · typical starting range from about <span className="font-bold">{CAD(data.local_averages.range_low_avg)}</span></>
                  )}
                </p>
              ) : data.local_averages?.range_low_avg != null ? (
                <p className="mt-1.5 text-xs text-[#102B2A]">
                  Advertised rates on file start around <span className="font-bold">{CAD(data.local_averages.range_low_avg)}</span> (published minimums vary by provider)
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-slate-500">No verified advertised prices on file for this city yet — we won't guess. Try a nearby city, or see our rates below.</p>
              )}
              {data.competitors?.length > 0 && (
                <div className="mt-2.5 space-y-2">
                  {data.competitors.map((c) => (
                    <div key={c.name + c.city} className="flex flex-wrap items-baseline justify-between gap-1.5 text-xs border-b border-slate-100 pb-2 last:border-0 last:pb-0">
                      <span className="font-bold text-[#102B2A]">{c.name}</span>
                      <span className="text-slate-600">{c.price_range || "Not published"}{c.minimum ? ` · min ${c.minimum}` : ""}</span>
                      {c.source_url && (
                        <a href={c.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-emerald-700 hover:underline">
                          source <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {data.market_summary && <p className="mt-2 text-[11px] text-slate-500">{data.market_summary}</p>}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] text-slate-400">Verified from each provider's own published page — never estimated.</p>
              <Link to="/pricing" className="text-xs font-bold text-emerald-700 hover:underline">See our full rates</Link>
            </div>
          </div>
        )
      )}
    </div>
  );
}