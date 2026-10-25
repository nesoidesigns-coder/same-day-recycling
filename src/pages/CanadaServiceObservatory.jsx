import { useMemo, useState } from "react";
import { useSEO } from "@/lib/seo";
import ObservatoryNav from "@/components/observatory-v2/ObservatoryNav";
import ObservatorySearch from "@/components/observatory-v2/ObservatorySearch";
import ObservatoryCanvas from "@/components/observatory-v2/ObservatoryCanvas";
import CityIntelPanel from "@/components/observatory-v2/CityIntelPanel";
import SectorPulse from "@/components/observatory-v2/SectorPulse";
import CityExplorer from "@/components/observatory-v2/CityExplorer";
import ObservatoryFooter from "@/components/observatory-v2/ObservatoryFooter";
import useObservatoryData from "@/components/observatory-v2/useObservatoryData";
import { SERVICES, SIGNAL_TYPES, timestamp, keyOf } from "@/components/observatory-v2/observatoryData";
import { Radio, Layers } from "lucide-react";

const DAYS = [["7", "7 days"], ["30", "30 days"], ["90", "90 days"]];

export default function CanadaServiceObservatory() {
  useSEO({
    title: "Canadian Service Observatory | Recycling OS Prototype",
    description: "A full-width national canvas of verified Canadian service coverage and live demand signals — every number labelled with its source and timeframe.",
    path: "/prototype-observatory",
    robots: "noindex, nofollow",
  });

  const [selected, setSelected] = useState(null);
  const [province, setProvince] = useState("");
  const [category, setCategory] = useState("");
  const [days, setDays] = useState("30");
  const [layer, setLayer] = useState("coverage");
  const [listOpen, setListOpen] = useState(false);

  const { coverage, locations, signals, prices, resources } = useObservatoryData({ city: selected || "", province, category, days });
  const counts = useMemo(() => {
    const out = { same_day: 0, matching: 0, recruiting: 0, currently_unavailable: 0 };
    locations.forEach((c) => { out[c.state || "currently_unavailable"] += 1; });
    return out;
  }, [locations]);
  const cityRow = useMemo(
    () => signals.data?.cities?.find((c) => keyOf(c.city) === keyOf(selected)),
    [signals.data, selected]
  );

  return (
    <div className="min-h-screen bg-obs-bg text-obs-ink">
      <ObservatoryNav />

      {/* Primary hero: the national canvas */}
      <section className="mx-auto max-w-[1600px] px-4 pt-10 md:px-8">
        <div className="grid gap-8 lg:grid-cols-[400px_1fr] lg:gap-10">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-obs-mint/40 px-3.5 py-1.5 font-plex text-[10px] font-semibold tracking-[0.14em] text-obs-mint">
              <Radio className="size-3.5 motion-reduce:animate-none animate-pulse" /> LIVE SIGNAL ENGINE · CANADA
            </div>
            <h1 className="mt-4 text-3xl font-bold leading-tight tracking-tight md:text-4xl">The Canadian Service Observatory</h1>
            <p className="mt-3 text-sm leading-relaxed text-obs-muted md:text-base">
              One national canvas of verified coverage and recorded demand. Select a city or province —
              every number you see is labelled with its source and timeframe, and estimates are never blended with facts.
            </p>
            <div className="mt-6"><ObservatorySearch locations={locations} onCity={(name) => { setSelected(name); setListOpen(false); }} onCategory={setCategory} category={category} setListOpen={setListOpen} /></div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <select value={province} onChange={(e) => setProvince(e.target.value)} aria-label="Filter by province" className="min-h-10 rounded-lg border border-obs-line/60 bg-obs-surface px-3 text-xs text-obs-ink outline-none">
                <option value="">All provinces</option>
                <option value="BC">British Columbia</option>
                <option value="AB">Alberta</option>
                <option value="SK">Saskatchewan</option>
                <option value="MB">Manitoba</option>
                <option value="ON">Ontario</option>
                <option value="QC">Quebec</option>
                <option value="NB">New Brunswick</option>
                <option value="NS">Nova Scotia</option>
                <option value="PE">Prince Edward Island</option>
                <option value="NL">Newfoundland and Labrador</option>
                <option value="YT">Yukon</option>
                <option value="NT">Northwest Territories</option>
                <option value="NU">Nunavut</option>
              </select>
              <select value={days} onChange={(e) => setDays(e.target.value)} aria-label="Timeframe" className="min-h-10 rounded-lg border border-obs-line/60 bg-obs-surface px-3 text-xs text-obs-ink outline-none">
                {DAYS.map(([v, l]) => <option key={v} value={v}>Last {l}</option>)}
              </select>
              <div className="flex overflow-hidden rounded-lg border border-obs-line/60" role="group" aria-label="Map layer">
                {[["coverage", "Coverage network"], ["observations", "Signal activity"]].map(([key, label]) => (
                  <button key={key} onClick={() => setLayer(key)} aria-pressed={layer === key}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-bold ${layer === key ? "bg-obs-mint text-obs-bg" : "bg-obs-surface text-obs-muted hover:text-obs-ink"}`}>
                    <Layers className="size-3.5" /> {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1.5 font-plex text-[10px] tracking-wide text-obs-muted">
              <span>{locations.length} CITIES MONITORED</span>
              <span className="text-obs-mint">{counts.same_day} VERIFIED PROVIDER CITIES</span>
              <span>{coverage.totals ? `${coverage.totals.contractors} CONTRACTORS` : "CONTRACTOR COUNT PENDING"}</span>
              <span>{signals.data?.total != null ? `${signals.data.total} SIGNALS IN SAMPLE` : "SIGNAL FEED LOADING"}</span>
            </div>
            {listOpen && (
              <div className="mt-4 rounded-xl border border-obs-line/60 bg-obs-surface p-3">
                <div className="obs-section-label mb-2">Choose a monitored city</div>
                <div className="flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
                  {locations.map((c) => (
                    <button key={c.name} onClick={() => { setSelected(c.name); setListOpen(false); }} className="rounded-full border border-obs-line/60 px-2.5 py-1 text-[11px] font-semibold text-obs-ink hover:border-obs-mint">{c.name}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <ObservatoryCanvas locations={locations} links={coverage.territoryLinks} selected={selected} province={province} onCity={(name) => setSelected(name)} onProvince={(code) => setProvince((p) => (p === code ? "" : code))} layer={layer} />
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-obs-muted">
              <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full bg-obs-mint" /> Verified provider</span>
              <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full bg-obs-amber" /> Contractor matching</span>
              <span className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full bg-obs-muted" /> Requests open</span>
              {layer === "observations" && <span>Halo size = recorded signals in sample</span>}
            </div>
          </div>
        </div>

        {selected && (
          <div className="mt-6">
            <CityIntelPanel
              city={locations.find((c) => keyOf(c.name) === keyOf(selected))}
              capacity={coverage.capacityFor(selected)}
              status={coverage.statusFor(selected)}
              observations={cityRow?.count ?? null}
              prices={prices.data?.prices}
              pricesLoading={prices.isLoading}
              facilities={resources.data?.centers}
            />
          </div>
        )}
      </section>

      {/* Sector explorer */}
      <main className="mx-auto max-w-[1280px] space-y-6 px-4 py-14 md:px-8">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">What Canadians need, sector by sector</h2>
          <p className="mt-2 text-sm text-obs-muted md:text-base">
            Public requests, website inquiries and confirmed bookings each carry their own label. Search-interest records are relative indices, never counts — they are never blended with real requests.
          </p>
        </div>
        <SectorPulse data={signals.data} isLoading={signals.isLoading} error={signals.error} category={category} onCategory={setCategory} onCity={(name) => { setSelected(name); window.scrollTo({ top: 0, behavior: "smooth" }); }} />

        <CityExplorer locations={locations} selected={selected} onCity={(name) => { setSelected(name); window.scrollTo({ top: 0, behavior: "smooth" }); }} counts={counts} />

        <div className="obs-panel p-5 md:p-7">
          <h3 className="text-lg font-bold tracking-tight text-obs-ink">Methodology</h3>
          <ul className="mt-3 space-y-2 text-sm text-obs-muted">
            {SIGNAL_TYPES.map(([key, label]) => <li key={key} className="flex gap-2"><span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-obs-mint" /> {label} are counted only as their own labelled record type.</li>)}
            <li className="flex gap-2"><span className="mt-1.5 inline-block size-1.5 shrink-0 rounded-full bg-obs-mint" /> Coverage facts come exclusively from verified partner records — never inferred from distance or map proximity.</li>
          </ul>
          {signals.data?.generated_at && (
            <p className="mt-4 font-plex text-[10px] tracking-wide text-obs-muted/70">FEED GENERATED {timestamp(signals.data.generated_at)} · COVERAGE SNAPSHOT {timestamp(coverage.generatedAt)}</p>
          )}
        </div>

        <div>
          <div className="obs-section-label mb-3">Service layers on this page</div>
          <div className="flex flex-wrap gap-2">
            {SERVICES.filter(([k]) => k).map(([key, label]) => (
              <button key={key} onClick={() => setCategory(category === key ? "" : key)} aria-pressed={category === key}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-bold ${category === key ? "border-obs-mint bg-obs-mint/10 text-obs-mint" : "border-obs-line/60 text-obs-muted hover:border-obs-mint/50"}`}>{label}</button>
            ))}
          </div>
        </div>
      </main>

      <ObservatoryFooter />
    </div>
  );
}