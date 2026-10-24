import { GEOGRAPHY_SOURCE } from "@/lib/canadaOutline";
import { networkCopy, networkTimestamp } from "@/components/sdr/heroNetworkCopy";

export default function HeroNetworkSummary({ coverage, demand, lang = "en" }) {
  const t = networkCopy(lang);
  return (
    <details className="border-t border-market-line px-4 py-2.5 text-xs leading-relaxed text-market-muted sm:py-3">
      <summary className="min-h-11 cursor-pointer font-semibold text-market-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-market-ink">{t.provenance}</summary>
      <div className="mt-3 space-y-3">
        <dl className="grid grid-cols-3 gap-3 text-market-ink">
          <div><dt className="text-xs text-market-muted">{t.contractors}</dt><dd className="mt-1 text-xl font-bold">{coverage.loaded ? coverage.totals?.contractors ?? "—" : "—"}</dd></div>
          <div><dt className="text-xs text-market-muted">{t.territories}</dt><dd className="mt-1 text-xl font-bold">{coverage.loaded ? coverage.verifiedCityNames.length : "—"}</dd></div>
          <div><dt className="text-xs text-market-muted">{t.posts}</dt><dd className="mt-1 text-xl font-bold">{demand.isSuccess ? demand.data?.total ?? "—" : "—"}</dd></div>
        </dl>
        <p>{t.territoriesSource}<br />{coverage.error ? t.coverageError : !coverage.loaded ? t.checking : `${t.snapshot}: ${networkTimestamp(coverage.generatedAt, lang)}`}</p>
        <p>{t.postsSource}<br />{demand.isError ? t.postsError : `${t.snapshot}: ${networkTimestamp(demand.data?.observedAt, lang)}`}</p>
        <p>{t.boundaries}</p>
        <a href={GEOGRAPHY_SOURCE} target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center underline underline-offset-2">{t.geography}</a>
      </div>
    </details>
  );
}