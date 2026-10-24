import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { X, Sparkles, Radio, ShieldCheck, Globe2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { CITIES } from "@/lib/cities";

// Living Canadian network hero background: a lazy-loaded 3D scene fed by
// verified Recycling OS records (coverage snapshot, open public requests,
// AI demand insight). Booking stays fully independent — the scene mounts
// only after first paint, pauses off-screen, and degrades to nothing when
// WebGL is unavailable.

const PROVINCE_NAMES = { AB:"Alberta", BC:"British Columbia", MB:"Manitoba", NB:"New Brunswick", NL:"Newfoundland and Labrador", NS:"Nova Scotia", NT:"Northwest Territories", NU:"Nunavut", ON:"Ontario", PE:"Prince Edward Island", QC:"Quebec", SK:"Saskatchewan", YT:"Yukon" };

const LEGEND = [
  { key: "verified", color: "#2fd4a0", label: "Verified coverage" },
  { key: "demand", color: "#22d3ee", label: "Customer demand" },
  { key: "ai", color: "#a78bfa", label: "AI intelligence" },
  { key: "matching", color: "#fbbf24", label: "Contractor matching" },
  { key: "selected", color: "#ffffff", label: "Selected location" },
];

const STATUS_META = {
  verified: { label: "Verified coverage", note: "A verified contractor serves this territory." },
  matching: { label: "Contractor matching", note: "Open to requests while a provider is matched." },
  demand: { label: "Customer demand signal", note: "Public service requests recorded for this area." },
  ai: { label: "AI market finding", note: "AI intelligence flagged this region — an estimate, not a verified fact." },
};

export default function HeroCanadaBackground() {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const focusRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [exploring, setExploring] = useState(null); // {province, cities}

  const coverage = useCoverageStatus();
  const demandQ = useQuery({
    queryKey: ["heroDemandCities"],
    queryFn: async () => {
      const page = await base44.entities.PublicOpportunity.filter({ status: "open" }, { limit: 100 });
      return page.items || page;
    },
    staleTime: 120_000, refetchInterval: 300_000,
  });
  const aiQ = useQuery({
    queryKey: ["heroAiRegions"],
    queryFn: async () => {
      const page = await base44.entities.DemandInsight.list({ sort: "-created_date", limit: 1 });
      return (page.items || page)[0] || null;
    },
    staleTime: 600_000,
  });

  // Data-derived nodes — every layer comes from a real record, never invented.
  const { nodes, links, cityIndex } = useMemo(() => {
    const byName = new Map(CITIES.filter((c) => c.lat).map((c) => [c.name.toLowerCase(), c]));
    const demandCities = new Map();
    (demandQ.data || []).forEach((o) => {
      const c = byName.get(String(o.city || "").toLowerCase());
      if (c) demandCities.set(c.name, (demandCities.get(c.name) || 0) + 1);
    });
    const aiText = aiQ.data && aiQ.data.is_sample !== true
      ? `${aiQ.data.summary || ""} ${typeof aiQ.data.analysis === "object" ? JSON.stringify(aiQ.data.analysis) : aiQ.data.analysis || ""}`.toLowerCase()
      : "";
    const aiCities = new Set([...byName.keys()].filter((k) => aiText.includes(k)).map((k) => byName.get(k).name));

    const layerFor = (name) => {
      if (coverage.verifiedCities.has(name.toLowerCase())) return "verified";
      if (coverage.matchingCities.has(name.toLowerCase())) return "matching";
      if (demandCities.has(name)) return "demand";
      if (aiCities.has(name)) return "ai";
      return null;
    };
    const ns = [];
    const idx = new Map();
    CITIES.forEach((c) => {
      if (!c.lat) return;
      const layer = layerFor(c.name);
      if (!layer) return;
      const node = { key: c.name, name: c.name, lat: c.lat, lng: c.lng, layer, city: c, contractors: coverage.contractorCounts?.[c.name] };
      ns.push(node);
      idx.set(c.name, node);
    });
    // Regional service relationships: nearest verified city within the same province.
    const verified = ns.filter((n) => n.layer === "verified");
    const ls = [];
    const done = new Set();
    verified.forEach((n) => {
      let best = null, bestD = Infinity;
      verified.forEach((m) => {
        if (m.key === n.key || m.city.province !== n.city.province) return;
        const d = Math.hypot(n.lat - m.lat, (n.lng - m.lng) * 0.7);
        if (d < bestD) { bestD = d; best = m; }
      });
      if (best && bestD < 8 && !done.has(`${n.key}|${best.key}`)) {
        done.add(`${best.key}|${n.key}`);
        ls.push({ a: [n.lat, n.lng], b: [best.lat, best.lng] });
      }
    });
    return { nodes: ns, links: ls, cityIndex: idx };
  }, [coverage.verifiedCities, coverage.matchingCities, coverage.contractorCounts, demandQ.data, aiQ.data]);

  // Mount the 3D scene after first paint (idle), pause when off-screen.
  useEffect(() => {
    let disposed = false;
    let instance = null;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const start = async () => {
      if (disposed || instance || !mountRef.current || !nodes.length) return;
      const mod = await import("./HeroCanadaMap3D");
      if (disposed) return;
      instance = mod.mountHeroCanadaScene(mountRef.current, {
        nodes, links, focusRef, mobile: window.innerWidth < 640,
        onSelect: (node) => {
          setSelected(node);
          instance?.highlight(node.key);
          base44.analytics.track({ eventName: "hero_map_node_click", properties: { city: node.name, layer: node.layer } });
        },
      });
      if (instance) { sceneRef.current = instance; setReady(true); }
    };
    const t = setTimeout(start, 1500); // never contends with first paint
    return () => {
      disposed = true;
      clearTimeout(t);
      instance?.dispose();
      sceneRef.current = null;
    };
  }, [nodes.length, links.length]);

  // Postal-code focus: "hero-map:focus" { postal, province } from the booking flow.
  useEffect(() => {
    const onFocus = (e) => {
      const { province } = e.detail || {};
      if (!province) return;
      const inProvince = nodes.filter((n) => n.city.province === province);
      if (!inProvince.length) return;
      const lat = inProvince.reduce((a, n) => a + n.lat, 0) / inProvince.length;
      const lng = inProvince.reduce((a, n) => a + n.lng, 0) / inProvince.length;
      focusRef.current = { lat, lng };
      sceneRef.current?.focusOn(lat, lng);
      sceneRef.current?.highlight(null);
      setExploring({ province, cities: inProvince.length });
      base44.analytics.track({ eventName: "hero_map_region_focus", properties: { province } });
    };
    window.addEventListener("hero-map:focus", onFocus);
    return () => window.removeEventListener("hero-map:focus", onFocus);
  }, [nodes]);

  const readingCoverage = coverage.loaded ? coverage.verifiedCityNames.length : null;
  const readingContractors = coverage.loaded ? Object.values(coverage.contractorCounts || {}).reduce((a, n) => a + (Number(n) || 0), 0) : null;
  const readingDemand = demandQ.data ? demandQ.data.length : null;

  const sel = selected;
  const selPath = sel?.city?.slug ? `/junk-removal-${sel.city.slug}` : `/request-service?city=${encodeURIComponent(sel?.name || "")}`;

  return (
    <div className="absolute inset-0" aria-hidden={false}>
      {/* 3D canvas layer */}
      <div ref={mountRef} className="absolute inset-0 opacity-80" />

      {/* Readability gradients — keep the booking form the visual priority */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#102B2A]/60 via-transparent to-[#102B2A]/70" />

      {/* Legend */}
      <div className="absolute left-3 top-3 hidden max-w-[240px] flex-col gap-1 rounded-2xl glass-dark px-3 py-2.5 md:flex">
        {LEGEND.map((l) => (
          <span key={l.key} className="flex items-center gap-2 text-[10px] font-semibold text-emerald-50/85">
            <span className="h-2 w-2 rounded-full" style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Floating intelligence readings — compact, sourced, desktop only */}
      <div className="pointer-events-none absolute right-3 top-3 hidden flex-col gap-2 md:flex">
        <div className="pointer-events-auto w-52 rounded-2xl glass-dark px-3.5 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#54D9AE]"><ShieldCheck className="h-3 w-3" />Verified network</p>
          <p className="mt-0.5 text-lg font-extrabold leading-none text-white">{readingCoverage ?? "—"} <span className="text-[10px] font-semibold text-emerald-50/60">cities live</span></p>
          {readingContractors ? <p className="mt-0.5 text-[10px] text-emerald-50/60">{readingContractors} verified contractor{readingContractors === 1 ? "" : "s"} · live coverage snapshot</p> : null}
        </div>
        <div className="pointer-events-auto w-52 rounded-2xl glass-dark px-3.5 py-2.5">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#22d3ee]"><Radio className="h-3 w-3" />Live public requests</p>
          <p className="mt-0.5 text-lg font-extrabold leading-none text-white">{readingDemand ?? "—"} <span className="text-[10px] font-semibold text-emerald-50/60">open</span></p>
          <p className="mt-0.5 text-[10px] text-emerald-50/60">Verified discovery feed · anonymized</p>
        </div>
      </div>

      {/* Region focus chip (postal-code interaction) */}
      {exploring && (
        <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 rounded-full glass-dark px-3.5 py-2 text-[11px] font-bold text-white">
          <Globe2 className="h-3.5 w-3.5 text-[#54D9AE]" />
          Exploring {PROVINCE_NAMES[exploring.province] || exploring.province} · {exploring.cities} network {exploring.cities === 1 ? "city" : "cities"}
          <button onClick={() => setExploring(null)} aria-label="Dismiss" className="text-emerald-50/60 hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Selected-node intelligence panel */}
      {sel && (
        <div className="absolute inset-x-3 bottom-3 z-20 rounded-2xl glass-dark p-4 md:inset-x-auto md:right-3 md:top-16 md:bottom-auto md:w-72" role="dialog" aria-label={`${sel.name} network details`}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-extrabold text-white">{sel.name}</p>
              <p className="text-[11px] font-semibold" style={{ color: LEGEND.find((l) => l.key === sel.layer)?.color }}>
                {STATUS_META[sel.layer]?.label}
              </p>
              {sel.contractors ? <p className="mt-0.5 text-[11px] text-emerald-50/70">{sel.contractors} verified contractor{sel.contractors === 1 ? "" : "s"}</p> : null}
            </div>
            <button onClick={() => { setSelected(null); sceneRef.current?.highlight(null); }} aria-label="Close" className="text-emerald-50/60 hover:text-white"><X className="h-4 w-4" /></button>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-emerald-50/70">{STATUS_META[sel.layer]?.note}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to={selPath} onClick={() => base44.analytics.track({ eventName: "hero_map_book_click", properties: { city: sel.name } })}
              className="rounded-full bg-[#187B65] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#125C4E]">
              Book in {sel.name}
            </Link>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent("rex:open", { detail: { question: `You're exploring ${sel.name}. I can help you estimate your pickup and check available service options.` } }))}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#54D9AE]/50 px-3.5 py-2 text-xs font-bold text-[#54D9AE] hover:bg-[#54D9AE]/10">
              <Sparkles className="h-3.5 w-3.5" /> Ask Rex
            </button>
            <Link to="/demand" className="rounded-full border border-white/25 px-3.5 py-2 text-xs font-bold text-white/85 hover:border-white/50">Market Pulse</Link>
          </div>
        </div>
      )}

      {/* Mobile legend — compact row, only once the scene is ready */}
      {ready && (
        <div className="absolute left-3 bottom-3 flex flex-wrap gap-1.5 md:hidden">
          {LEGEND.slice(0, 4).map((l) => (
            <span key={l.key} className="inline-flex items-center gap-1 rounded-full glass-dark px-2 py-1 text-[9px] font-semibold text-emerald-50/85">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: l.color }} />{l.label}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}