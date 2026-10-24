import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { PUBLIC_POST_QUERY } from "@/components/sdr/useHeroNetwork";
import { networkCopy, networkTimestamp, networkServiceName } from "@/components/sdr/heroNetworkCopy";
import { Users, MapPin, ClipboardList, TrendingUp } from "lucide-react";

// Market Pulse mode: verified coverage and public-post demand only. Every
// number comes from the live coverageStatus snapshot or a PublicOpportunity
// aggregate — never estimated, never projected. Empty stays empty.
export default function HeroNetworkPulse({ coverage, demand, nodes, onSelect, lang = "en" }) {
  const t = networkCopy(lang);
  const services = useQuery({
    queryKey: ["hero-public-post-services"],
    queryFn: async () => (await base44.entities.PublicOpportunity.aggregate({ query: PUBLIC_POST_QUERY, groupBy: "service_category" })).rows,
    staleTime: 60000, refetchInterval: 120000, retry: false,
  });
  const totalContractors = useMemo(
    () => Object.values(coverage.contractorCounts || {}).reduce((sum, n) => sum + (Number(n) || 0), 0),
    [coverage.contractorCounts]
  );
  const topCities = useMemo(
    () => [...(demand.data?.rows || [])].filter((r) => r.city).sort((a, b) => b.count - a.count).slice(0, 6),
    [demand.data]
  );
  const topServices = useMemo(
    () => [...(services.data || [])].filter((r) => r.service_category).sort((a, b) => b.count - a.count).slice(0, 5),
    [services.data]
  );
  const tile = "rounded-2xl border border-market-line bg-market-bg p-3";
  return (
    <section className="border-t border-market-line px-4 py-4" aria-label={t.pulseTitle} aria-live="polite">
      <h3 className="text-lg font-bold">{t.pulseTitle}</h3>
      <p className="mt-1 text-xs text-market-muted">{t.pulseIntro}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className={tile}>
          <Users className="h-4 w-4 text-[#54D9AE]" aria-hidden="true" />
          <div className="mt-1 text-2xl font-bold tabular-nums">{coverage.loaded ? totalContractors : "–"}</div>
          <div className="text-[11px] leading-tight text-market-muted">{t.pulseVerified}</div>
        </div>
        <div className={tile}>
          <MapPin className="h-4 w-4 text-[#54D9AE]" aria-hidden="true" />
          <div className="mt-1 text-2xl font-bold tabular-nums">{coverage.loaded ? coverage.verifiedCities.size : "–"}</div>
          <div className="text-[11px] leading-tight text-market-muted">{t.pulseCities}</div>
        </div>
        <div className={tile}>
          <ClipboardList className="h-4 w-4 text-[#54D9AE]" aria-hidden="true" />
          <div className="mt-1 text-2xl font-bold tabular-nums">{demand.isSuccess ? demand.data?.total : "–"}</div>
          <div className="text-[11px] leading-tight text-market-muted">{t.pulsePosts}</div>
        </div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-market-line bg-market-bg p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-market-muted"><TrendingUp className="h-3.5 w-3.5" aria-hidden="true" /> {t.pulseTopCities}</div>
          {topCities.length ? (
            <ul className="mt-2 space-y-0.5">
              {topCities.map((row) => {
                const node = nodes.find((n) => n.name.toLowerCase() === String(row.city).trim().toLowerCase());
                return (
                  <li key={row.city}>
                    <button disabled={!node} onClick={() => node && onSelect(node)} className="flex min-h-9 w-full items-center justify-between rounded-lg px-2 text-sm font-semibold text-market-ink hover:bg-white/5 disabled:opacity-60 disabled:hover:bg-transparent">
                      <span className="truncate">{row.city}</span>
                      <span className="tabular-nums text-[#54D9AE]">{row.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-market-muted">{t.pulseEmpty}</p>
          )}
        </div>
        <div className="rounded-2xl border border-market-line bg-market-bg p-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-market-muted"><ClipboardList className="h-3.5 w-3.5" aria-hidden="true" /> {t.pulseTopServices}</div>
          {topServices.length ? (
            <ul className="mt-2 space-y-0.5">
              {topServices.map((row) => (
                <li key={row.service_category} className="flex min-h-9 items-center justify-between rounded-lg px-2 text-sm font-semibold text-market-ink">
                  <span className="truncate">{networkServiceName(row.service_category, lang)}</span>
                  <span className="tabular-nums text-[#54D9AE]">{row.count}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-xs text-market-muted">{t.pulseEmpty}</p>
          )}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-market-muted">
        <span>{t.pulseCoverageStamp}: {networkTimestamp(coverage.generatedAt, lang)}</span>
        <span>{t.pulseDemandStamp}: {networkTimestamp(demand.data?.observedAt, lang)}</span>
        <span>{t.pulseNotBookings}</span>
      </div>
      {demand.isError && <p className="mt-2 text-xs text-market-muted">{t.postsError}</p>}
    </section>
  );
}