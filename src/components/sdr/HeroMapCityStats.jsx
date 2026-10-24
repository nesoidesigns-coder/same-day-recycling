import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { PUBLIC_POST_QUERY } from "@/components/sdr/useHeroNetwork";
import { networkCopy, networkServiceName, networkTimestamp } from "@/components/sdr/heroNetworkCopy";

export default function HeroMapCityStats({ node, lang = "en" }) {
  const t = networkCopy(lang);
  const services = useQuery({
    queryKey: ["hero-city-post-services", node.name],
    queryFn: () => base44.entities.PublicOpportunity.aggregate({ query: { ...PUBLIC_POST_QUERY, city: node.name }, groupBy: "service_category" }),
    staleTime: 60000, retry: false,
  });
  return (
    <div className="mt-3 space-y-2 border-t border-market-line pt-3 text-sm text-market-ink">
      <p>{t.contractorRecords}: <strong>{node.contractors ?? "—"}</strong>.</p>
      <p>{node.stats.open === null ? t.publicUnavailable : `${t.publicRecords}: ${node.stats.open}.`}</p>
      {(services.data?.rows || []).map((r) => <span key={r.service_category} className="mr-2 inline-block rounded-full border border-market-line px-2 py-1 text-xs">{networkServiceName(r.service_category, lang)}: {r.count}</span>)}
      {services.isError && <p className="text-xs text-market-muted">{t.serviceError}</p>}
      {node.capacity && <p className="text-xs leading-relaxed text-market-muted">{node.capacity.available} {t.accepting}; {node.capacity.same_day} {t.sameDay}</p>}
      <p className="text-xs leading-relaxed text-market-muted">{t.citySource} · {node.name}. {t.notBookings}<br />{t.contractors}: {networkTimestamp(node.coverageAt, lang)}<br />{t.posts}: {networkTimestamp(node.publicAt, lang)}</p>
    </div>
  );
}