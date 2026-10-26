import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

// The one live connection behind the Live Intelligence gauges: it loads the
// verified radar feed and re-runs the exact same query the moment an
// underlying platform record changes — gauges move as activity happens,
// never on a timer. If realtime events are unavailable to a visitor (records
// restricted by role), the connection degrades silently to the page-load
// fetch, so the gauge still renders its verified state.
export default function useLiveGauge({ days = 30, province = "", city = "", category = "" } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const lastGenerated = useRef(null);
  const argsRef = useRef({ days, province, city, category });
  argsRef.current = { days, province, city, category };

  // One refresh = one genuine pulse of the feed timestamp, never fabricated.
  const fetchGauge = () => {
    const args = argsRef.current;
    return base44.functions
      .invoke("liveIntelligence", { action: "gauge", ...args })
      .then((res) => {
        setData(res.data);
        setError(false);
        setLoading(false);
        if (res.data?.generated_at && res.data.generated_at !== lastGenerated.current) {
          lastGenerated.current = res.data.generated_at;
          setPulseKey((k) => k + 1);
        }
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    setLoading(true);
    fetchGauge();
  }, [days, province, city, category]);

  // Realtime: any change to the entities the radar is built from settles a
  // burst of events into a single refresh.
  useEffect(() => {
    let timer = null;
    const unsubs = [];
    ["DemandSignal", "QuoteLead", "NationalRequest"].forEach((name) => {
      try {
        unsubs.push(base44.entities[name].subscribe(() => {
          clearTimeout(timer);
          timer = setTimeout(fetchGauge, 400);
        }));
      } catch {
        // realtime unavailable for this entity/visitor — load fetch still works
      }
    });
    return () => {
      clearTimeout(timer);
      unsubs.forEach((u) => u && u());
    };
  }, []);

  return { data, loading, error, pulseKey };
}