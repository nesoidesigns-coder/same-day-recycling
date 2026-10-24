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
  const rows = (services.data?.rows || []).slice().sort((a, b) => b.count - a.count);
  return (
    <div className="mt-3 space-y-3 border-t border-market-line pt-3 text-sm text-market-ink">
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-market-bg p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-market-muted">{t.contractors}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{node.contractors ?? "—"}</div>
        </div>
        <div className="rounded-xl bg-market-bg p-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-market-muted">{t.demandTitle}</div>
          <div className="mt-1 text-2xl font-bold tabular-nums">{node.stats.open ?? "—"}</div>
          <div className="mt-1 text-[11px] text-market-muted">{t.posts}</div>
        </div>
      </div>
      {node.stats.open !== null && (
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-market-muted">{t.topServices}</div>
          {services.isError ? (
            <p className="mt-1 text-xs text-market-muted">{t.serviceError}</p>
          ) : rows.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {rows.map((r) => (
                <span key={r.service_category} className="rounded-full border border-market-line bg-market-bg px-2.5 py-1 text-xs font-semibold">
                  {networkServiceName(r.service_category, lang)}: {r.count}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-1 text-xs text-market-muted">{t.noPosts}</p>
          )}
        </div>
      )}
      {node.capacity && <p className="text-xs leading-relaxed text-market-muted">{node.capacity.available} {t.accepting}; {node.capacity.same_day} {t.sameDay}</p>}
      <p className="text-xs leading-relaxed text-market-muted">{t.citySource} · {node.name}. {t.notBookings}<br />{t.contractors}: {networkTimestamp(node.coverageAt, lang)}<br />{t.posts}: {networkTimestamp(node.publicAt, lang)}</p>
    </div>
  );
}