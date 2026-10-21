import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// The live coverage status engine — the single source of contractor-capacity
// and open-request data for every public surface. Reads aggregate, PII-free
// counts from the coverageStatus endpoint; never hardcoded, never derived
// from facility directory counts.
//
// statusFor(city) returns one of:
//   null         — still loading (surfaces show a neutral state)
//   "same_day"   — Same-Day Availability (verified contractor capacity exists)
//   "matching"   — Requests Open — Contractor Matching (open requests in city)
//   "recruiting" — Provider Recruitment (no verified capacity, no open requests)
export default function useCoverageStatus() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let on = true;
    base44.functions
      .invoke("coverageStatus", {})
      .then((res) => {
        if (on) setData(res.data || { verified_cities: [], matching_cities: [] });
      })
      .catch(() => {
        if (on) setData({ verified_cities: [], matching_cities: [] });
      });
    return () => {
      on = false;
    };
  }, []);

  const verified = new Set((data?.verified_cities || []).map((c) => String(c).toLowerCase()));
  const matching = new Set((data?.matching_cities || []).map((c) => String(c).toLowerCase()));

  const statusFor = (city) => {
    if (!data) return null;
    const name = String(city || "").trim().toLowerCase();
    if (verified.has(name)) return "same_day";
    if (matching.has(name)) return "matching";
    return "recruiting";
  };

  return { statusFor, loaded: !!data, verifiedCities: verified, matchingCities: matching };
}