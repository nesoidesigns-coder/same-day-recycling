import { useEffect, useState } from "react";
import { GEOGRAPHY_URL } from "@/components/observatory-v2/observatoryData";

// Loads the platform's Canadian boundary file once per browser session and
// shares it across every cinematic map. On failure the map falls back to an
// honest city-list selector — no fabricated geography.
let cache = null;
let inflight = null;

export default function useCanadaGeography() {
  const [state, setState] = useState(cache ? { geography: cache, error: false } : { geography: null, error: false });

  useEffect(() => {
    if (cache) return;
    let alive = true;
    inflight =
      inflight ||
      fetch(GEOGRAPHY_URL)
        .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
        .then((geo) => {
          cache = geo;
          return geo;
        })
        .catch((e) => {
          inflight = null;
          throw e;
        });
    inflight
      .then((geo) => alive && setState({ geography: geo, error: false }))
      .catch(() => alive && setState({ geography: null, error: true }));
    return () => {
      alive = false;
    };
  }, []);

  return state;
}