import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { queryClientInstance } from "@/lib/query-client";

// Global live-activity connection behind every intelligence gauge.
// One realtime subscription per visitor watches the entities the admin and
// contractor dashboards are built from. Any change settles a burst of events
// into a single refresh: open dashboards refetch their verified data through
// react-query, and every gauge on screen pulses once. If realtime is
// unavailable to a visitor, dashboards simply keep their page-load state.

const WATCHED_ENTITIES = [
  "Booking",
  "NationalRequest",
  "QuoteLead",
  "DemandSignal",
  "DemandObservation",
  "PublicOpportunity",
];

let started = false;
let timer = null;
let pulse = 0;
const listeners = new Set();

const handleActivity = () => {
  clearTimeout(timer);
  timer = setTimeout(() => {
    pulse += 1;
    listeners.forEach((l) => l(pulse));
    queryClientInstance.invalidateQueries();
  }, 400);
};

function ensureStarted() {
  if (started) return;
  started = true;
  WATCHED_ENTITIES.forEach((name) => {
    try {
      base44.entities[name].subscribe(handleActivity);
    } catch {
      // realtime unavailable for this entity/visitor — page-load data still renders
    }
  });
}

export function useLivePulse() {
  const [key, setKey] = useState(0);
  useEffect(() => {
    ensureStarted();
    listeners.add(setKey);
    return () => listeners.delete(setKey);
  }, []);
  return key;
}