import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Search, Eye, MousePointerClick, TrendingUp, MapPin, AlertCircle, Lightbulb, Globe2, Unplug } from "lucide-react";
import { base44 } from "@/api/base44Client";
import IndexingRecoveryCentre from "@/components/admin/authority/IndexingRecoveryCentre";
import IndexCoverage from "@/components/admin/authority/IndexCoverage";
import SeoAutopilot from "@/components/admin/authority/SeoAutopilot";
import MarketDemandGauges from "@/components/admin/authority/MarketDemandGauges";

const num = (n) => Number(n || 0).toLocaleString("en-CA");
const pct = (v) => `${v || 0}%`;

const VALUE_TONE = { high: "bg-[#187B65] text-white", medium: "bg-[#187B65]/15 text-[#187B65]", low: "bg-slate-100 text-slate-500" };

// Search Authority: real Google Search Console performance + an evidence-based
// opportunity monitor. Every figure comes from GSC or the app's own analytics —
// nothing is estimated. When GSC isn't reachable the module says "Not connected".
export default function AdminSearchAuthority() {
  const [data, setData] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [a, f, t] = await Promise.allSettled([
        base44.functions.invoke("searchAuthority", {}),
        base44.functions.invoke("conversionFunnel", { days: 30 }),
        base44.functions.invoke("visitStats", {}),
      ]);
      setData(a.status === "fulfilled" ? a.value.data : { connected: false, reason: a.reason?.message || "Search Console request failed." });
      setFunnel(f.status === "fulfilled" ? f.value.data : null);
      setTraffic(t.status === "fulfilled" ? t.value.data : null);
      if (a.status === "rejected") setError(a.reason?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const t = data?.totals;
  const tp = data?.totals_previous;
  const delta = (cur, prev) => {
    if (!prev || prev === 0) return cur > 0 ? `+${num(cur)}` : "—";
    const d = Math.round(((cur - prev) / prev) * 100);
    return `${d >= 0 ? "+" : ""}${d}% vs previous 28d`;
  };

  const kpis = t && [
    { label: "Organic clicks", value: num(t.clicks), sub: delta(t.clicks, tp?.clicks), icon: MousePointerClick },
    { label: "Impressions", value: num(t.impressions), sub: delta(t.impressions, tp?.impressions), icon: Eye },
    { label: "Click-through rate", value: pct(t.ctr), sub: tp?.ctr ? `${(t.ctr - tp.ctr).toFixed(1)} pts vs previous` : "—", icon: Search },
    { label: "Average position", value: t.position ? `#${t.position}` : "—", sub: tp?.position ? `prev #${tp.position}` : "—", icon: TrendingUp },
  ];

  const src = traffic?.visits_30d;
  const cls = funnel?.funnel?.visits.by_class || {};
  const realVisits = (cls.customer || 0) + (cls.contractor || 0);

  // Bucket GSC queries to track the long-tail strategy: item-specific local
  // queries ("couch removal vancouver", "mattress disposal ottawa") are the
  // target — buyers with a specific job in hand, less competition than the
  // generic "junk removal" head terms. Generic families are tracked separately
  // so the shift toward long-tail is measurable.
  const SERVICE_ITEM = /couch|sofa|sectional|futon|recliner|mattress|furniture|dresser|bed ?frame|desk|appliance|fridge|stove|washer|dryer|hot ?tub|tv|television|computer|monitor|electronics?|e-?waste/i;
  const FAMILIES = [
    { key: "Service long-tail (item-specific)", test: (q) => SERVICE_ITEM.test(q) },
    { key: "Junk removal (generic head term)", re: /junk|removal|pick ?up|haul|cleanout/i },
    { key: "Waste & disposal (generic)", re: /waste|disposal|management|dump/i },
    { key: "Recycling (generic)", re: /recycl/i },
  ];
  const families = (data?.queries || []).reduce((acc, q) => {
    const f = FAMILIES.find((r) => (r.test ? r.test(q.key) : r.re.test(q.key)));
    const key = f ? f.key : "Other / brand";
    let row = acc.find((a) => a.key === key);
    if (!row) { row = { key, impressions: 0, clicks: 0, best: 0, top: q.key }; acc.push(row); }
    row.impressions += q.impressions || 0;
    row.clicks += q.clicks || 0;
    if (q.position && (!row.best || q.position < row.best)) { row.best = q.position; row.top = q.key; }
    return acc;
  }, []).sort((a, b) => b.impressions - a.impressions);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#102B2A]">Search Authority</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Live Google Search Console performance and an evidence-based SEO opportunity monitor. Figures come only
            from Google and this app's own analytics — never estimated.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#187B65] transition-colors" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-[#102B2A] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading Search Console data…
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl bg-white border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>
      ) : data && !data.connected ? (
        <div className="mt-8 rounded-3xl bg-white border border-slate-100 shadow-sm p-8 text-center">
          <Unplug className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-[#102B2A]">Not connected</h2>
          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">{data.reason || "Search Console data is unavailable."} No figures are shown because none can be verified.</p>
        </div>
      ) : data && (
        <>
          <div className="mt-4 text-[11px] text-slate-500">
            Property: <span className="font-mono">{data.siteUrl}</span> · Window {data.startDate} → {data.endDate} (Google reporting lags ~2 days)
          </div>

          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <k.icon className="w-3.5 h-3.5 text-[#187B65]" /> {k.label}
                </div>
                <div className="mt-1 text-2xl font-extrabold text-[#102B2A]">{k.value}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">{k.sub}</div>
              </div>
            ))}
          </div>

          <MarketDemandGauges />

          <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Top search queries (28 days)</h2>
            <Table
              head={["Query", "Clicks", "Impressions", "CTR", "Position"]}
              rows={data.queries.map((q) => [q.query, num(q.clicks), num(q.impressions), pct(q.ctr), q.position ? `#${q.position}` : "—"])}
              empty="No queries with meaningful volume in this window yet."
            />
          </div>

          <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 inline-flex items-center gap-2">
              <Search className="w-4 h-4 text-[#187B65]" /> Keyword positioning (28 days)
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Real Search Console queries bucketed to track the long-tail strategy: item-specific local queries
              ("couch removal vancouver", "mattress disposal ottawa") are the target — buyers with a specific job
              in hand, less competition than generic "junk removal" head terms. City page titles and keywords are
              generated to lead with these service terms.
            </p>
            <Table
              head={["Term family", "Impressions", "Clicks", "Best position", "Top query"]}
              rows={families.map((f) => [f.key, num(f.impressions), num(f.clicks), f.best ? `#${f.best}` : "—", f.top])}
              empty="No queries with meaningful volume in this window yet."
            />
          </div>

          <div className="mt-5 grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Top pages (28 days)</h2>
              <Table
                head={["Page", "Clicks", "Impr.", "CTR", "Pos."]}
                rows={data.pages.map((p) => [String(p.key).replace(/^https?:\/\/[^/]+/, "") || "/", num(p.clicks), num(p.impressions), pct(p.ctr), p.position ? `#${p.position}` : "—"])}
                empty="No page-level data in this window yet."
              />
            </div>

            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 inline-flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#187B65]" /> Geographic performance (28 days)
              </h2>
              <Table
                head={["Country", "Clicks", "Impressions", "CTR"]}
                rows={data.countries.map((c) => [c.key, num(c.clicks), num(c.impressions), pct(c.ctr)])}
                empty="No geographic data in this window yet."
              />
            </div>
          </div>

          {/* Authority summary — every figure is Google evidence, never estimated */}
          <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat
              label="Indexed pages"
              value={num(data.index.with_impressions)}
              note="sitemap pages with search impressions (90d)"
              tone="text-[#187B65]"
            />
            <MiniStat
              label="Awaiting discovery"
              value={num(data.index.no_impressions)}
              note="in sitemap, zero impressions (90d)"
              tone="text-amber-600"
            />
            <MiniStat
              label="Genuine technical blockers"
              value={num(data.index.genuine_blockers || 0)}
              note="robots, noindex, canonical, fetch"
              tone={(data.index.genuine_blockers || 0) > 0 ? "text-red-600" : "text-[#187B65]"}
            />
            <MiniStat
              label="Verified search impressions"
              value={num(t.impressions)}
              note={`28 days ending ${data.endDate}`}
            />
          </div>

          <SeoAutopilot />
          <IndexingRecoveryCentre index={data.index} siteUrl={data.siteUrl} />
          <IndexCoverage index={data.index} siteUrl={data.siteUrl} />

          <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 inline-flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#187B65]" /> Search → customer journey (30 days)
            </h2>
            {funnel ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <MiniStat label="Search-source visits" value={num(src?.search || 0)} note={`of ${num(realVisits)} real visits`} />
                <MiniStat label="Quote requests" value={num(funnel.funnel.quote_leads.current)} note={`${funnel.rates.visit_to_lead_pct ?? "—"}% of real visits`} />
                <MiniStat label="Booking requests" value={num(funnel.funnel.booking_requests.current)} note={`${funnel.rates.lead_to_booking_pct ?? "—"}% of quote leads`} />
                <MiniStat label="Completed jobs" value={num(funnel.funnel.completed.current)} note={`$${num(funnel.money.completed_job_value)} job value`} />
              </div>
            ) : (
              <p className="text-sm text-slate-600">Journey analytics not connected — conversion figures aren't available right now.</p>
            )}
          </div>

          <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Traffic reconciliation</h2>
            {traffic && data ? (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <MiniStat label="GSC organic clicks" value={num(data.totals?.clicks || 0)} note={`28d ending ${data.endDate}`} />
                  <MiniStat label="Search-source visits" value={num(src?.search || 0)} note="30 days, platform tracking" />
                  <MiniStat label="AI assistant visits" value={num(src?.ai_search || 0)} note="30 days (ChatGPT, Perplexity, …)" />
                  <MiniStat label="Real visits" value={num(realVisits)} note="bots & owner testing excluded" />
                </div>
                <p className="text-[11px] text-slate-500 mt-3">
                  Differences between GSC clicks and platform search visits are expected, not errors: Google reporting
                  lags ~2 days, some sessions arrive direct or via bookmarks, and owner testing plus bot crawls are
                  excluded from platform counts. Quote requests and completed bookings above reconcile the funnel end-to-end.
                </p>
              </>
            ) : (
              <p className="text-sm text-slate-600">Traffic analytics not connected right now.</p>
            )}
          </div>

          <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 inline-flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-[#187B65]" /> SEO Opportunity Monitor
            </h2>
            <p className="text-[11px] text-slate-500 mb-4">
              Every recommendation cites its Search Console evidence. Ranked by expected business value, then confidence.
              Strategy: existing pages in verified operating markets are improved first — no new URLs are created while
              pages still lack indexing evidence.
            </p>
            {data.opportunities.length === 0 ? (
              <p className="text-sm text-slate-600 flex items-start gap-2"><AlertCircle className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" /> No opportunities found in current data — traffic is too low or pages perform at or above site average.</p>
            ) : (
              <div className="space-y-2.5">
                {data.opportunities.map((o, i) => (
                  <div key={i} className="rounded-2xl border border-slate-100 px-4 py-3.5">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <span className="text-[11px] font-bold text-[#102B2A] font-mono">{String(o.page).replace(/^https?:\/\/[^/]+/, "") || "/"}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${VALUE_TONE[o.value]}`}>{o.value} value</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{o.effort} effort</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">{o.confidence} confidence</span>
                    </div>
                    <div className="text-sm text-[#102B2A]"><span className="font-semibold">{o.action}.</span> <span className="text-slate-600">Evidence: {o.evidence}.</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Table({ head, rows, empty }) {
  if (!rows.length) return <p className="text-sm text-slate-500">{empty}</p>;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
          {head.map((h, i) => <th key={h} className={i === 0 ? "py-2 pr-4" : "py-2 pr-4 text-right"}>{h}</th>)}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-slate-100">
            {r.map((c, j) => (
              <td key={j} className={`${j === 0 ? "py-2.5 pr-4 font-semibold text-[#102B2A] break-all" : "py-2.5 pr-4 text-right text-slate-600"}`}>{c}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function MiniStat({ label, value, note, tone }) {
  return (
    <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 px-4 py-3.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-0.5 text-xl font-extrabold ${tone || "text-[#102B2A]"}`}>{value}</div>
      {note && <div className="text-[10px] text-slate-500">{note}</div>}
    </div>
  );
}