import { useQuery } from "@tanstack/react-query";
import MapGeography from "@/components/observatory-v2/MapGeography";
import MapNodes from "@/components/observatory-v2/MapNodes";
import MapRelationships from "@/components/observatory-v2/MapRelationships";
import { GEOGRAPHY_URL } from "@/components/observatory-v2/observatoryData";

// The observatory's primary surface: a full-width, dark-graphite Canada canvas.
// Nothing here is decorative — province outlines come from Natural Earth 1:50m
// (public domain), nodes from verified coverage, links from confirmed
// contractor territories, and counts from the live labelled signal feed.
export default function ObservatoryCanvas({ locations, links, selected, province, onCity, onProvince, layer }) {
  const geo = useQuery({
    queryKey: ["canada-boundaries"],
    queryFn: async () => {
      const res = await fetch(GEOGRAPHY_URL);
      if (!res.ok) throw new Error("Geography unavailable");
      return res.json();
    },
    staleTime: Infinity,
  });

  return (
    <div className="obs-map-frame relative">
      {geo.isLoading && (
        <div className="grid h-[420px] md:h-[560px] place-items-center text-obs-muted" role="status">Loading national map…</div>
      )}
      {geo.isError && (
        <div className="grid h-[420px] md:h-[560px] place-items-center px-6 text-center text-obs-muted">
          The national map could not load. City intelligence below stays available.
        </div>
      )}
      {geo.data && (
        <svg
          viewBox="250 0 600 520"
          className="h-auto w-full"
          role="img"
          aria-label="Map of Canada with monitored service locations"
        >
          <rect x="0" y="0" width="1200" height="520" fill="var(--obs-map-ocean)" />
          <MapGeography geography={geo.data} province={province} onProvince={onProvince} />
          <MapRelationships links={links} locations={locations} selected={selected} layer={layer} />
          <MapNodes locations={locations} selected={selected} onCity={onCity} layer={layer} scale={1} hover={""} setHover={() => {}} />
          <text x="265" y="512" fontSize="9" letterSpacing="1.5" className="fill-obs-muted/70 font-mono">
            BASEMAP: NATURAL EARTH 1:50M · PROJECTION: LAMBERT CONFORMAL CONIC
          </text>
        </svg>
      )}
    </div>
  );
}