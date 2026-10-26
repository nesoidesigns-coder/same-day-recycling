import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import CinematicCanadaMap from "@/components/cinematic/CinematicCanadaMap";
import useCanadaGeography from "@/components/cinematic/useCanadaGeography";

// National Operations Map — the same Canadian geographic instrument as the
// public Live Intelligence radar, now driven by admin-verified sources:
// observed demand from the liveIntelligence feed and coverage rings from
// verified Partner records only. Unverified or recruiting territories are
// never drawn as active coverage.
export default function NationalOpsMap() {
  const { geography, error: geoError } = useCanadaGeography();
  const [cities, setCities] = useState(null);
  const [coverageCities, setCoverageCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState("");

  useEffect(() => {
    let alive = true;
    base44.functions.invoke("liveIntelligence", { action: "gauge", days: 30 })
      .then((r) => alive && setCities(r?.data?.cities || []))
      .catch(() => alive && setCities([]));
    base44.entities.Partner.filter({}, {})
      .then((res) => {
        if (!alive) return;
        const partners = res.items || [];
        const set = new Set();
        partners.forEach((p) => {
          if (p.active === false) return;
          if (p.city) set.add(p.city);
          (p.service_cities || []).forEach((c) => set.add(c));
        });
        setCoverageCities([...set]);
      })
      .catch(() => alive && setCoverageCities([]));
    return () => { alive = false; };
  }, []);

  return (
    <div className="rounded-2xl bg-[hsl(var(--cine-bg))] border border-slate-900/40 shadow-sm p-5 text-cine-ink">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-cine-ink">National operations map</h2>
        <span className="font-plex text-[10px] font-bold uppercase tracking-[0.16em] text-cine-muted">
          30-day window · observed records &amp; verified partner coverage
        </span>
      </div>
      {cities === null ? (
        <p className="py-10 text-center text-sm text-cine-muted">Loading national intelligence…</p>
      ) : (
        <CinematicCanadaMap
          geography={geography}
          geoError={geoError}
          cities={cities}
          coverageCities={coverageCities}
          selectedCity={selectedCity}
          onCity={(c) => setSelectedCity((prev) => (prev === c ? "" : c))}
        />
      )}
      {selectedCity && (
        <p className="mt-2 text-xs text-cine-muted">
          Focused on <span className="font-bold text-cine-cyan">{selectedCity}</span> — deep detail lives in the dedicated intelligence areas.
        </p>
      )}
    </div>
  );
}