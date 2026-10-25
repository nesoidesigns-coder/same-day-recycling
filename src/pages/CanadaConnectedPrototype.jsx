import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Search, ChevronDown, Radio } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSEO } from "@/lib/seo";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import CanadaNetworkMap from "@/components/prototype/CanadaNetworkMap";
import CityIntelPanel from "@/components/prototype/CityIntelPanel";
import NationalServicePulse from "@/components/home/pulse/NationalServicePulse";

// NON-DESTRUCTIVE PROTOTYPE — "Recycling OS — Canada Connected".
// A preview of the redesigned homepage: warm-white canvas, the Canadian
// network as the visual hero, contextual location intelligence, one search.
// The current homepage at / stays untouched until the direction is approved.

export default function CanadaConnectedPrototype() {
  useSEO({ title: "Canada Connected — Homepage Prototype | Same Day Recycling", description: "Design prototype.", path: "/prototype", noindex: true });

  const coverage = useCoverageStatus();
  const [selected, setSelected] = useState(null);
  const [citySignals, setCitySignals] = useState(null);
  const [signalsLoading, setSignalsLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [hint, setHint] = useState("");

  const locations = useMemo(() => {
    if (!coverage.loaded) return [];
    return coverage.locations
      .map((l) => {
        const city = l.lat !== undefined ? l : null; // registry entries carry lat/lng from CITIES
        return city;
      })
      .filter((l) => l && Number.isFinite(l.lat) && Number.isFinite(l.lng))
      .map((l) => ({
        ...l,
        status: coverage.statusFor(l.name),
        pt: { x: (l.lng + 96) * 0.5, y: (l.lat - 62) * 0.5 },
      }));
  }, [coverage.loaded, coverage.locations, coverage.contractorCounts]);

  useEffect(() => {
    if (!selected) { setCitySignals(null); return undefined; }
    let alive = true;
    setSignalsLoading(true);
    base44.functions.invoke("liveIntelligence", { action: "gauge", days: 90, city: selected })
      .then((res) => { if (alive) setCitySignals(res?.data ?? res); })
      .catch(() => { if (alive) setCitySignals(null); })
      .finally(() => { if (alive) setSignalsLoading(false); });
    return () => { alive = false; };
  }, [selected]);

  const explore = (e) => {
    e?.preventDefault();
    const q = query.trim().toLowerCase();
    if (!q) return;
    const match = locations.find((l) => l.name.toLowerCase() === q || l.name.toLowerCase().startsWith(q));
    if (match) { setSelected(match.name); setHint(""); }
    else setHint(`No monitored location matches "${query}" yet — try Vancouver, Calgary, Toronto or Halifax.`);
  };

  const sel = locations.find((l) => l.name === selected) || null;

  return (
    <div className="bg-[#F7FAF8] min-h-screen" style={{ backgroundImage: "linear-gradient(180deg, #EFFBF7 0%, #F7FAF8 32%)" }}>
      <TopBar />
      <Navbar />

      <div className="max-w-[1360px] mx-auto px-4 md:px-8 pt-8">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#D9E5E0] bg-white px-4 py-1.5 font-plex text-[10px] font-semibold text-[#123C32]/70">
          <Radio className="w-3 h-3 text-[#27D5B0]" /> DESIGN PROTOTYPE · CURRENT HOMEPAGE UNCHANGED AT /
        </div>
      </div>

      {/* HERO — 40% message / 60% network */}
      <section className="max-w-[1360px] mx-auto px-4 md:px-8 pt-6 pb-10 grid gap-10 lg:gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] items-start">
        <div className="pt-2 lg:pt-10">
          <h1 className="text-[36px] md:text-[54px] font-bold leading-[1.05] tracking-tight text-[#123C32]">
            Canada, Connected<br />Through Service.
          </h1>
          <p className="mt-5 text-base md:text-lg text-[#123C32]/70 max-w-md">
            Discover what Canadians need removed, recycled, and moved — explore local options,
            understand prices, and connect with available services.
          </p>

          <form onSubmit={explore} className="mt-7 flex flex-col gap-2.5">
            <div className="flex rounded-[16px] border border-[#D9E5E0] bg-white shadow-sm overflow-hidden">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a service or enter your city"
                aria-label="Search a service or enter your city"
                className="flex-1 min-h-[54px] px-5 text-base text-[#123C32] placeholder:text-[#123C32]/45 focus:outline-none"
              />
              <button type="submit" className="min-h-[54px] px-5 text-[#27D5B0] hover:text-[#123C32] transition-colors" aria-label="Search">
                <Search className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button type="submit" className="min-h-[50px] flex-1 rounded-[14px] bg-[#123C32] px-6 font-bold text-white hover:bg-[#0C2A22] transition-colors inline-flex items-center justify-center gap-2">
                Explore My Area <ArrowRight className="w-4 h-4" />
              </button>
              <Link to="/request-service" className="min-h-[50px] flex-1 rounded-[14px] border border-[#123C32]/20 bg-white px-6 font-bold text-[#123C32] hover:border-[#27D5B0] transition-colors inline-flex items-center justify-center">
                Get a Pickup Quote
              </Link>
            </div>
            {hint && <p className="text-sm font-semibold text-[#123C32]/70">{hint}</p>}
          </form>

          {/* Selected-area intelligence on mobile sits right after the hero copy */}
          <div className="lg:hidden mt-6">
            <CityIntelPanel
              location={sel}
              signals={citySignals}
              capacity={sel ? coverage.capacityFor(sel.name) : null}
              loading={signalsLoading}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>

        {/* Canadian network visualization */}
        <div className="relative rounded-[24px] border border-[#D9E5E0] bg-white/70 p-4 md:p-6 shadow-[0_10px_40px_-20px_rgba(18,60,50,0.25)]">
          {locations.length === 0 && (
            <div className="absolute inset-0 grid place-items-center text-sm font-plex text-[#123C32]/50">Loading network…</div>
          )}
          <CanadaNetworkMap
            locations={locations}
            selected={selected}
            onSelect={setSelected}
          />
          {/* Floating contextual panel (desktop) */}
          <div className="hidden lg:block absolute left-6 bottom-14 w-[300px]">
            <CityIntelPanel
              location={sel}
              signals={citySignals}
              capacity={sel ? coverage.capacityFor(sel.name) : null}
              loading={signalsLoading}
              onClose={() => setSelected(null)}
            />
          </div>
        </div>
      </section>

      {/* Exploratory intelligence — below the hero, expandable on mobile */}
      <section className="border-t border-[#D9E5E0]">
        <div className="max-w-[1360px] mx-auto px-4 md:px-8 py-8">
          <details className="group">
            <summary className="flex cursor-pointer items-center justify-between gap-3 rounded-[16px] bg-white border border-[#D9E5E0] px-5 py-4 select-none">
              <span>
                <span className="block text-base font-bold text-[#123C32]">Explore the national pulse</span>
                <span className="block text-xs text-[#123C32]/60">Verified demand signals, filters and drill-down — the full intelligence section</span>
              </span>
              <ChevronDown className="w-5 h-5 text-[#123C32]/60 transition-transform group-open:rotate-180" />
            </summary>
            <div className="mt-4 rounded-[24px] overflow-hidden bg-brand-navy p-4 md:p-8">
              <NationalServicePulse />
            </div>
          </details>
        </div>
      </section>

      <Footer />
    </div>
  );
}