import { useEffect, useState } from "react";
import { TileLayer } from "react-leaflet";
import { Car } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Real-time road-conditions overlay (TomTom flow + incident tiles), fetched
// once and shared by every map on the site. Absent when no key is configured.
let cached = null;

export function useTrafficOverlay() {
  const [traffic, setTraffic] = useState(cached);
  useEffect(() => {
    if (cached) return;
    let active = true;
    base44.functions
      .invoke("trafficOverlay", {})
      .then((res) => {
        const cfg = res?.data || res;
        if (active && cfg?.enabled) {
          cached = cfg;
          setTraffic(cfg);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);
  return traffic;
}

export function TrafficToggle({ on, onChange }) {
  return (
    <button
      onClick={() => onChange(!on)}
      aria-pressed={on}
      className={
        on
          ? "rounded-full bg-[#187B65] text-white font-bold px-4 py-2 text-xs sm:text-sm inline-flex items-center gap-1.5 shadow-sm"
          : "rounded-full bg-slate-100 text-slate-700 font-medium px-4 py-2 text-xs sm:text-sm inline-flex items-center gap-1.5 hover:bg-slate-200 transition-colors"
      }
    >
      <Car className="w-4 h-4" /> Live traffic {on ? "on" : "off"}
    </button>
  );
}

export function TrafficLayers({ traffic }) {
  if (!traffic) return null;
  return (
    <>
      <TileLayer key="traffic-flow" url={traffic.flow} attribution={traffic.attribution} opacity={0.85} />
      <TileLayer key="traffic-incidents" url={traffic.incidents} opacity={0.9} />
    </>
  );
}