import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { CITIES } from "@/lib/cities";

export const PUBLIC_POST_QUERY = { status: "open", source_status: "available", classification: { $in: ["active_request", "potential_opportunity"] }, is_sample: { $ne: true } };
export default function useHeroNetwork() {
  const coverage = useCoverageStatus();
  const demand = useQuery({
    queryKey: ["hero-public-post-counts"],
    queryFn: async () => {
      const [groups, total] = await Promise.all([
        base44.entities.PublicOpportunity.aggregate({ query: PUBLIC_POST_QUERY, groupBy: "city" }),
        base44.entities.PublicOpportunity.count(PUBLIC_POST_QUERY),
      ]);
      return { rows: groups.rows, total, observedAt: new Date().toISOString() };
    },
    staleTime: 60000, refetchInterval: 120000, retry: false,
  });
  return useMemo(() => {
    const norm = (v) => String(v || "").trim().toLowerCase();
    const counts = new Map((demand.data?.rows || []).map((r) => [norm(r.city), r.count]));
    const nodes = CITIES.filter((c) => c.lat && c.lng).map((city) => {
      const status = coverage.statusFor(city.name);
      const open = demand.isSuccess ? counts.get(norm(city.name)) || 0 : null;
      const layer = coverage.verifiedCities.has(norm(city.name)) ? "verified" : open > 0 ? "demand" : status === "matching" ? "matching" : status ? "recruiting" : "unknown";
      return { key: city.name, name: city.name, lat: city.lat, lng: city.lng, city, layer, availability: status, contractors: coverage.loaded ? coverage.contractorCounts[city.name] || 0 : null, coverageAt: coverage.loaded ? coverage.generatedAt : null, publicAt: demand.isSuccess ? demand.data?.observedAt : null, capacity: coverage.loaded ? coverage.capacityFor(city.name) : null, stats: { open } };
    });
    const byName = new Map(nodes.map((n) => [norm(n.name), n]));
    const links = coverage.territoryLinks.flatMap((link) => {
      const [a, b] = (link.cities || []).map((city) => byName.get(norm(city)));
      return a && b ? [{ a: [a.lat, a.lng], b: [b.lat, b.lng] }] : [];
    });
    return { nodes, links, coverage, demand };
  }, [coverage, demand.data, demand.isSuccess, demand.isError]);
}