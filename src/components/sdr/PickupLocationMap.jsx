import { useRef } from "react";
import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import usePickupLocation from "@/hooks/usePickupLocation";
import { pickupLocationActions } from "@/lib/pickupLocationStore";
import PickupMapCamera from "@/components/sdr/PickupMapCamera";
import HeroStreetView from "@/components/sdr/HeroStreetView";
import StreetViewFallback from "@/components/sdr/StreetViewFallback";
const SATELLITE_URL = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const STREET_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const pickupIcon = L.divIcon({ className: "", html: '<div class="h-7 w-7 rounded-full border-4 border-background bg-brand-emerald shadow-lg"></div>', iconSize: [28, 28], iconAnchor: [14, 14] });

export default function PickupLocationMap({ lang = "en" }) {
  const pickup = usePickupLocation(), markerRef = useRef(null), fr = lang === "fr";
  if (!pickup) return null;
  const mode = pickup.camera.local.mode, imagery = pickup.imagery;
  const changeMode = (next) => {
    pickupLocationActions.setCamera("local", { mode: next });
    if (next === "street" && imagery.status === "available") pickupLocationActions.setCamera("street", { lat: imagery.lat, lng: imagery.lng, imageId: imagery.image_id });
  };
  return <div>
    <div className="mb-2 flex flex-wrap gap-2" role="group" aria-label={fr ? "Type de carte" : "Map type"}>
      {[{ key: "map", label: fr ? "Carte" : "Map" }, { key: "satellite", label: "Satellite" }, { key: "street", label: fr ? "Vue de rue" : "Street View" }].map((item) => <button key={item.key} type="button" onClick={() => changeMode(item.key)} aria-pressed={mode === item.key} className={`min-h-11 rounded-full border px-4 text-sm font-bold ${mode === item.key ? "border-market-accent bg-market-accent/20" : "border-market-line"}`}>{item.label}</button>)}
    </div>
    {mode === "street" && imagery.status === "available" ? <HeroStreetView key={imagery.image_id} lang={lang} /> : mode === "street" ? <StreetViewFallback lang={lang} /> : <div className="relative z-0 h-64 overflow-hidden rounded-xl border border-market-line sm:h-72" data-pickup-lat={pickup.lat} data-pickup-lng={pickup.lng}>
      <MapContainer center={[pickup.lat, pickup.lng]} zoom={pickup.camera.local.zoom} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }} aria-label={fr ? "Carte du lieu de ramassage" : "Pickup location map"}>
        <PickupMapCamera />
        {mode === "satellite" ? <TileLayer key="sat" url={SATELLITE_URL} attribution="Imagery &copy; Esri" maxZoom={19} /> : <TileLayer key="osm" url={STREET_URL} attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>' maxZoom={19} />}
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} draggable ref={markerRef} eventHandlers={{ dragend: () => { const p = markerRef.current?.getLatLng(); if (p) pickupLocationActions.adjustPin(p.lat, p.lng); } }} />
      </MapContainer>
    </div>}
    <p className="mt-2 text-xs text-market-muted">{fr ? "Déplacez l'épingle vers l'entrée de chargement. La carte OSM et le satellite ne sont pas des photos au niveau de la rue." : "Drag the pin to your loading entrance. OSM map tiles and satellite imagery are not street-level photographs."}</p>
    <p role="status" className="mt-1 text-xs text-market-muted">{["unchecked", "checking"].includes(imagery.status) ? (fr ? "Vérification de l'imagerie de rue à proximité…" : "Checking for nearby street-level imagery…") : imagery.status === "available" ? (fr ? `Photo de rue Panoramax à ${imagery.distance_m} m de l'épingle.` : `Panoramax street photo found ${imagery.distance_m} m from the pickup pin.`) : imagery.status === "provider_error" ? (fr ? "Imagerie de rue indisponible : la vérification du fournisseur a échoué. La carte reste disponible." : "Street-level imagery unavailable: the provider check could not complete. The accurate map remains available.") : (fr ? "Imagerie de rue indisponible : aucune photo autorisée trouvée dans un rayon de 100 m." : "Street-level imagery unavailable: no permitted photo found within 100 m.")}</p>
  </div>;
}