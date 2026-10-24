import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { PUBLIC_POST_QUERY } from "@/components/sdr/useHeroNetwork";

export default function HeroMapCityStats({ node }) {
  const services = useQuery({
    queryKey: ["hero-city-post-services", node.name],
    queryFn: () => base44.entities.PublicOpportunity.aggregate({ query: { ...PUBLIC_POST_QUERY, city: node.name }, groupBy: "service_category" }),
    staleTime: 60000, retry: false,
  });
  return (
    <div className="mt-3 space-y-2 border-t border-market-line pt-3 text-sm text-market-ink">
      <p>{node.contractors} verified contractor{node.contractors === 1 ? "" : "s"} covering this municipality.</p>
      <p>{node.stats.open === null ? "Public-post counts unavailable." : `${node.stats.open} open public service post${node.stats.open === 1 ? "" : "s"} recorded.`}</p>
      {(services.data?.rows || []).map((r) => <span key={r.service_category} className="mr-2 inline-block rounded-full border border-market-line px-2 py-1 text-xs">{String(r.service_category || "other").replaceAll("_", " ")}: {r.count}</span>)}
      {services.isError && <p className="text-xs text-market-muted">Service breakdown unavailable.</p>}
      {node.capacity && <p className="text-xs text-market-muted">{node.capacity.available} accepting dispatch; {node.capacity.same_day} record same-day capability. No slot is confirmed by these counts.</p>}
      <p className="text-xs text-market-muted">Source: explicit contractor territories and open public posts, current snapshot. Posts are not bookings or search volumes.</p>
    </div>
  );
}