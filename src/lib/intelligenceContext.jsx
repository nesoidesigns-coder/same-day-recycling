import { createContext, useContext, useEffect, useState } from "react";
import { setRexContext } from "@/lib/rexSession";

// RecyclingIntelligenceContext — the ONE shared selection state of Recycling
// OS: the customer's current location (city) and selected service. Every
// entry point (hero location entry, service cards, Live Intelligence
// filters) writes here; every consumer (booking flow, Rex, regional
// intelligence) reads from here. Persisted in sessionStorage so selections
// carry forward between pages in the same visit. No sensitive details are
// ever stored — those belong to the booking flow only. Rex stays in sync
// automatically through the same snapshot it already consumes.

const KEY = "sdr-intelligence";
const EVENT = "sdr:intelligence";

const IntelligenceContext = createContext({ selection: {}, setSelection: () => {} });

function read() {
  try {
    return JSON.parse(sessionStorage.getItem(KEY) || "") || {};
  } catch {
    return {};
  }
}

export function IntelligenceProvider({ children }) {
  const [selection, setSelectionState] = useState(read);

  const setSelection = (patch) => {
    setSelectionState((current) => {
      const next = { ...current, ...patch };
      try {
        sessionStorage.setItem(KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent(EVENT));
      } catch {
        /* storage unavailable — context is optional, never blocking */
      }
      // Rex receives the same selection through its own context snapshot.
      setRexContext({
        ...(next.city ? { city: next.city } : {}),
        ...(next.service ? { service_type: next.service } : {}),
      });
      return next;
    });
  };

  useEffect(() => {
    const on = () => setSelectionState(read());
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
  }, []);

  return <IntelligenceContext.Provider value={{ selection, setSelection }}>{children}</IntelligenceContext.Provider>;
}

export function useIntelligence() {
  return useContext(IntelligenceContext);
}