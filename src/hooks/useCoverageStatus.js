import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";

// One shared snapshot for city cards, counts and the map. The legacy same_day
// key means provider available, never a confirmed appointment or today's capacity.
export default function useCoverageStatus() {
  const { data, isSuccess, isError } = useQuery({
    queryKey: ["public-coverage-status"],
    queryFn: async () => {
      const { data: snapshot } = await base44.functions.invoke("coverageStatus", {});
      if (!Array.isArray(snapshot?.verified_cities) || !Array.isArray(snapshot?.matching_cities)) {
        throw new Error("Coverage status is unavailable.");
      }
      return snapshot;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
  return useMemo(() => {
    const key = (city) => String(city || "").trim().replace(/\s+/g, " ").toLowerCase();
    const verifiedNames = [...new Map((data?.verified_cities || []).map((name) => [key(name), String(name).trim()])).values()];
    const verified = new Set(verifiedNames.map(key));
    const matchingNames = [...new Map((data?.matching_cities || []).filter((name) => !verified.has(key(name))).map((name) => [key(name), String(name).trim()])).values()];
    const matching = new Set(matchingNames.map(key));
    const registry = new Map(CITIES.map((city) => [key(city.name), { ...city, href: `/junk-removal-${city.slug}` }]));
    for (const name of [...verifiedNames, ...matchingNames, ...(data?.recruiting_cities || [])]) {
      if (!registry.has(key(name))) registry.set(key(name), { name, province: null, href: `/request-service?city=${encodeURIComponent(name)}` });
    }
    const capacity = new Map(Object.entries(data?.city_capacity || {}).map(([name, value]) => [key(name), value]));
    return {
      statusFor: (city) => {
        if (!isSuccess || isError) return null;
        const k = key(city);
        if (verified.has(k)) return capacity.get(k)?.available === 0 ? "currently_unavailable" : "same_day";
        if (matching.has(k)) return "matching";
        if (registry.has(k)) return "recruiting";
        return "currently_unavailable";
      },
      loaded: isSuccess && !isError, error: isError,
      verifiedCities: verified, matchingCities: matching,
      verifiedCityNames: verifiedNames, matchingCityNames: matchingNames,
      contractorCounts: data?.contractor_counts || {},
      capacityFor: (city) => capacity.get(key(city)) || null,
      totals: data?.totals || null,
      territoryLinks: data?.territory_links || [],
      generatedAt: data?.generated_at || null,
      locations: [...registry.values()],
    };
  }, [data, isSuccess, isError]);
}