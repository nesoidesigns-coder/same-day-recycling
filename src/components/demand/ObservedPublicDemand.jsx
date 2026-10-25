import { useQuery } from "@tanstack/react-query";
import { ExternalLink, MapPin, Rss, ShieldCheck, Clock3 } from "lucide-react";
import { base44 } from "@/api/base44Client";

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString("en-CA", { dateStyle: "medium" }) : "—");
const CLASS_LABEL = { active_request: "Active request", potential_opportunity: "Potential opportunity", general_discussion: "General discussion" };

// OBSERVED PUBLIC DEMAND — measurement C of three. Source-backed public
// service requests and discussions collected from authorized sources. These
// are observed signals, not all Canadian searches or unique customers, and
// public posters' precise locations are never shown.
export default function ObservedPublicDemand() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["observatory-feed", "public-demand"],
    queryFn: async () => (await base44.functions.invoke("observatoryFeed", {})).data,
    staleTime: 2 * 60 * 1000,
    refetchInterval: 10 * 60 * 1000,
    retry: 1,
  });

  if (isLoading) return <p role="status" className="py-6 text-center text-sm text-market-muted">Loading observed public signals…</p>;
  if (isError) return <p role="alert" className="py-4 text-center text-sm text-market-muted">Observed public-demand data could not be loaded right now.</p>;

  const publicEvents = (data?.feed || []).filter((e) => e.category === "public_opportunity");
  const qualified = data?.counters?.qualified_opportunities?.value ?? null;
  const trending = data?.trending || [];
  const discoverySources = (data?.sources || []).filter((s) => s.layer === "recent");
  const discoveryNote = discoverySources.map((s) => {
    if (s.status === "connected") return `${s.label}: connected (last sync ${fmtDate(s.last_sync)})`;
    if (s.status === "historical_data_only" || !s.last_sync) return `${s.label}: no data collected yet — waiting on connection`;
    return `${s.label}: ${s.status} (last sync ${fmtDate(s.last_sync)})`;
  });

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-market-line bg-market-bg p-4 text-center">
          <p className="text-3xl font-extrabold text-market-ink">{qualified ?? "—"}</p>
          <p className="mt-1 text-[11px] leading-tight text-market-muted">Qualified public signals collected (open)</p>
        </div>
        <div className="rounded-2xl border border-market-line bg-market-bg p-4 text-center">
          <p className="text-3xl font-extrabold text-market-ink">{publicEvents.length || "—"}</p>
          <p className="mt-1 text-[11px] leading-tight text-market-muted">Recent signals shown</p>
        </div>
        <div className="rounded-2xl border border-market-line bg-market-bg p-4 text-center">
          <p className="text-3xl font-extrabold text-market-ink">{trending.length || "—"}</p>
          <p className="mt-1 text-[11px] leading-tight text-market-muted">Service categories represented</p>
        </div>
      </div>

      {trending.length > 0 && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-market-muted">Service categories with collected signals</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {trending.map((t) => (
              <span key={t.category} className="inline-flex items-center gap-1.5 rounded-full border border-market-line px-3 py-1 text-xs font-bold text-market-ink">
                {t.category.replace(/_/g, " ")} · {t.open_opportunities}
              </span>
            ))}
          </div>
        </div>
      )}

      {publicEvents.length ? (
        <ul className="mt-4 divide-y divide-market-line">
          {publicEvents.slice(0, 6).map((e) => (
            <li key={e.id} className="py-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-market-ink">{e.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-market-muted">
                    <span>{e.source_platform}</span>
                    <span>· {CLASS_LABEL[e.classification] || "Public signal"}</span>
                    <span>· published {fmtDate(e.event_at)}</span>
                    <span className="inline-flex items-center gap-0.5"><Clock3 className="h-2.5 w-2.5" /> last checked {fmtDate(e.verified_at)}</span>
                    {(e.city || e.province_code) && <span className="inline-flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{e.city ? `${e.city}${e.province_code ? `, ${e.province_code}` : ""}` : e.province_code}</span>}
                  </p>
                </div>
                {e.link && (
                  <a href={e.link} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 rounded-full border border-market-line px-2.5 py-1 text-[10px] font-bold text-market-accent hover:bg-white/5" aria-label={`View the original public post for ${e.title}`}>
                    <ExternalLink className="h-3 w-3" /> Source
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-4 rounded-2xl border border-market-line bg-market-bg px-4 py-4 text-center">
          <p className="text-xs font-bold text-market-ink">No public signals collected yet.</p>
          <p className="mt-1 text-[11px] text-market-muted">The authorized public discovery feeds have not stored any signals so far. Rather than inventing demand, this panel stays empty until real, source-backed signals exist.</p>
        </div>
      )}

      {discoveryNote.length > 0 && (
        <div className="mt-4 space-y-1 border-t border-market-line pt-3 text-[11px] text-market-muted">
          <p className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-market-muted"><Rss className="h-3 w-3 text-market-accent" /> Discovery source status</p>
          {discoveryNote.map((n) => <p key={n} className="flex items-center gap-1.5"><ShieldCheck className="h-3 w-3 shrink-0 text-market-accent" />{n}</p>)}
        </div>
      )}

      <p className="mt-4 text-[11px] leading-relaxed text-market-muted">
        These are <span className="font-bold text-market-ink">collected observations</span>, not the entire market: public posts represent specific people asking publicly, never a count of all Canadian searches or unique customers. Public posters' precise locations are never displayed, and Google search interest is never counted as a service request.
      </p>
    </div>
  );
}