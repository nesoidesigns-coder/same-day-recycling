import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Camera, ExternalLink, Loader2, Map as MapIcon, Satellite, X } from "lucide-react";
import { base44 } from "@/api/base44Client";

const STREET_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const pinIcon = L.divIcon({ className: "", html: '<div class="h-7 w-7 rounded-full border-4 border-background bg-brand-emerald shadow-lg"></div>', iconSize: [28, 28], iconAnchor: [14, 14] });

const MODES = [
  { key: "map", label: "Map", icon: MapIcon },
  { key: "satellite", label: "Satellite", icon: Satellite },
  { key: "street", label: "Street View", icon: Camera },
];

// Live map + street-level view for one location: the real-world handoff the
// 3D maps deep-zoom into. Street photos are openly licensed Panoramax
// photography verified by this app; Google Street View opens outside the app
// when no permitted photo exists nearby.
export default function LiveCityView({ lat, lng, label, onClose, className = "" }) {
  const [mode, setMode] = useState("map");
  const { data: imagery, isLoading: checking } = useQuery({
    queryKey: ["liveStreetImagery", lat.toFixed(4), lng.toFixed(4)],
    queryFn: async () => (await base44.functions.invoke("streetImagery", { lat, lng })).data,
    staleTime: 300000,
    retry: false,
    enabled: mode === "street",
  });
  const googlePano = `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${lat},${lng}`;

  return (
    <div className={`flex flex-col overflow-hidden rounded-2xl border border-market-line bg-market-bg text-market-ink ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
        <div className="flex gap-1.5" role="group" aria-label="Live view type">
          {MODES.map(({ key, label: modeLabel, icon: Icon }) => (
            <button key={key} type="button" onClick={() => setMode(key)} aria-pressed={mode === key}
              className={`inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-bold transition-colors ${mode === key ? "border-market-accent bg-market-accent/20" : "border-market-line hover:bg-market-surface"}`}>
              <Icon className="h-3.5 w-3.5" /> {modeLabel}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-xs font-semibold text-market-muted sm:block">{label} · live</span>
          {onClose && (
            <button type="button" onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-market-line hover:bg-market-surface" aria-label="Back to the 3D view">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {mode === "street" ? (
        <div className="relative z-0 flex-1 min-h-0">
          {checking && <div className="absolute inset-0 flex items-center justify-center" role="status"><Loader2 className="h-5 w-5 animate-spin text-market-muted" /></div>}
          {imagery?.status === "available" ? (
            <div className="absolute inset-0 flex flex-col">
              <iframe title={`Street photograph near ${label}`} src={imagery.viewer_url} className="min-h-0 w-full flex-1 border-0" allowFullScreen loading="lazy" referrerPolicy="no-referrer" />
              <p className="px-3 py-2 text-[11px] text-market-muted">
                {imagery.credit} · {imagery.license} · {imagery.captured_at?.slice(0, 10)} · {imagery.distance_m} m away.
                Nearby photography, not a confirmation of site access.{" "}
                <a href={imagery.viewer_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-market-accent underline"><ExternalLink className="h-3 w-3" />Open full panorama</a>
              </p>
            </div>
          ) : !checking ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <p className="text-sm text-market-muted">
                {imagery?.status === "provider_error"
                  ? "The street-photo provider check could not complete. The live map and satellite views remain available."
                  : "No openly licensed street photo within 100 m of this location."}
              </p>
              <a href={googlePano} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-market-accent px-5 text-sm font-bold text-market-bg">
                <ExternalLink className="h-4 w-4" /> Open Google Street View
              </a>
              <p className="text-[11px] text-market-muted">Google Street View is a Google service, opened outside this app.</p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="relative z-0 flex-1 min-h-0">
          <MapContainer center={[lat, lng]} zoom={16} minZoom={3} maxZoom={19} scrollWheelZoom={true} style={{ height: "100%", width: "100%" }}>
            <TileLayer
              key={mode}
              maxZoom={19}
              attribution={mode === "satellite" ? "Imagery &copy; Esri" : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>'}
              url={mode === "satellite" ? SATELLITE_URL : STREET_URL}
            />
            <Marker position={[lat, lng]} icon={pinIcon} />
          </MapContainer>
        </div>
      )}
    </div>
  );
}