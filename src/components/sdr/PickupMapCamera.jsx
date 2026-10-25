import { useEffect } from "react";
import { useMap, useMapEvents } from "react-leaflet";
import usePickupLocation from "@/hooks/usePickupLocation";
import { pickupLocationActions } from "@/lib/pickupLocationStore";

export default function PickupMapCamera() {
  const pickup = usePickupLocation();
  const map = useMap();
  const lat = pickup?.lat, lng = pickup?.lng;
  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    map.invalidateSize();
    const animate = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    map.flyTo([lat, lng], 17, { animate, duration: 1.1 });
  }, [lat, lng, map]);
  useMapEvents({ moveend: () => {
    const center = map.getCenter();
    pickupLocationActions.setCamera("local", { lat: center.lat, lng: center.lng, zoom: map.getZoom() });
  } });
  return null;
}