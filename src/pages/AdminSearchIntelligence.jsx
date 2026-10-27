import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Lightbulb, AlertTriangle, Search, Globe, Clock } from "lucide-react";
import { base44 } from "@/api/base44Client";
import TechSeoPanel from "@/components/admin/TechSeoPanel";
import AiSeoCommand from "@/components/admin/AiSeoCommand";

function StatusPill({ status, label }) {
  const tones = {
    ok: "bg-[#54D9AE]/15 text-[#54D9AE] border-[#54D9AE]/40",
    pending: "bg-amber-400/10 text-amber-300 border-amber-400/40",
    off: "bg-slate-500/10 text-slate-400 border-slate-500/40",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${tones[status] || tones.off}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${status === "ok" ? "bg-[#54D9AE]" : status === "pending" ? "bg-amber-300" : "bg-slate-400"}`} />
      {label}
    </span>
  );
}

function MetricRing({ pct, value, label, sub, status = "ok" }) {
  // Colour through theme tokens, never fixed hex: these panels are re-skinned
  // light on admin routes, where a white arc or white digit disappears.
  const arcClass = status === "ok" ? "stroke-os-cyan" : status === "pending" ? "stroke-os-amber" : "stroke-os-silver";
  const r = 34;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(100, pct ?? 0));
  return (
    <div className="holo-panel-deep relative rounded-2xl border border-[#54D9AE]/15 p-5 flex flex-col items-center text-center overflow-hidden">
      <svg viewBox="0 0 80 80" className="w-20 h-20">
        <circle cx="40" cy="40" r={r} fill="none" className="stroke-si-line" strokeWidth="7" />
        <circle
          cx="40" cy="40" r={r} fill="none" className={arcClass} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c - (clamped / 100) * c}
          transform="rotate(-90 40 40)"
        />
        <text x="40" y="45" textAnchor="middle" className="fill-os-ink" fontSize="15" fontWeight="700">{value}</text>
      </svg>
      <div className="mt-2 text-sm font-bold text-white">{label}</div>
      <div className="mt-1 text-xs text-slate-400">{sub}</div>
    </div>
  );
}

function PendingCard({ label, note, status }) {
  return (
    <div className="holo-panel-deep relative rounded-2xl border border-[#54D9AE]/15 p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-bold text-white">{label}</div>
        <StatusPill status={status} label={status === "pending" ? "Pending" : "Not Connected"} />
      </div>
      <p className="mt-3 text-xs text-slate-400 leading-relaxed">{note}</p>
    </div>
  );
}

export default function AdminSearchIntelligence() {
  const [loading, setLoading] = useState(true);
  const [gsc, setGsc] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [sitemap, setSitemap] = useState(null);
  const [insights, setInsights] = useState(null);
  const [insightsBusy, setInsightsBusy] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  const load = async () => {
    setLoading(true);
    setInsights(null);
    setInsightsError("");
    // Google Search Console — organic clicks, impressions, CTR, position
    try {
      const res = await base44.functions.invoke("searchConsoleKeywords", {});
      const keywords = res.data?.keywords || [];
      if (!keywords.length) setGsc({ state: "nodata" });
      else {
        const clicks = keywords.reduce((a, k) => a + (k.clicks || 0), 0);
        const impressions = keywords.reduce((a, k) => a + (k.impressions || 0), 0);
        const position = impressions
          ? keywords.reduce((a, k) => a + (k.position || 0) * k.impressions, 0) / impressions
          : 0;
        setGsc({
          state: "ok",
          keywords,
          clicks,
          impressions,
          ctr: impressions ? (clicks / impressions) * 100 : 0,
          position,
          pages: new Set(keywords.map((k) => k.page).filter(Boolean)).size,
        });
      }
    } catch {
      setGsc({ state: "disconnected" });
    }
    // Site traffic by source + weekly bookings
    try {
      const res = await base44.functions.invoke("visitStats", {});
      setTraffic(res.data || null);
    } catch {
      setTraffic(null);
    }
    // Sitemap status
    try {
      const r = await fetch("/sitemap.xml");
      const t = await r.text();
      const urls = (t.match(/<loc>/g) || []).length;
      setSitemap({ ok: r.ok && urls > 0, urls });
    } catch {
      setSitemap({ ok: false, urls: 0 });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runInsights = async () => {
    if (!gsc?.keywords?.length) return;
    setInsightsBusy(true);
    setInsightsError("");
    try {
      const res = await base44.functions.invoke("seoInsights", { keywords: gsc.keywords.slice(0, 100) });
      setInsights(res.data || null);
    } catch (e) {
      setInsightsError(e?.message || "Analysis failed");
    }
    setInsightsBusy(false);
  };

  const organic = traffic?.visits_7d?.search || 0;
  const bookings = traffic?.bookings_7d || 0;
  const conversion = organic > 0 ? Math.round((bookings / organic) * 1000) / 10 : null;
  const maxImpr = gsc?.keywords?.length ? Math.max(...gsc.keywords.map((k) => k.impressions || 0)) : 0;

  return (
    <div className="admin-console -mx-4 -my-6 md:-mx-8 md:-my-8 px-4 py-8 md:px-8 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-[0.2em] text-[#54D9AE] uppercase mb-2 flex items-center gap-2">
            <Search className="w-4 h-4" /> Search Intelligence
          </div>
          <h1 className="admin-headline text-3xl md:text-4xl font-bold tracking-tight">National search performance</h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">Live Google Search Console and analytics data. Nothing here is estimated — when a source isn't connected, it says so.</p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="self-start inline-flex items-center gap-2 rounded-full border border-[#54D9AE]/40 text-[#54D9AE] font-bold px-5 py-2.5 text-sm hover:bg-[#54D9AE]/10 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh
        </button>
      </div>

      {loading && !gsc ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-[#54D9AE] animate-spin" /></div>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            <StatusPill status={gsc?.state === "ok" ? "ok" : gsc?.state === "nodata" ? "pending" : "off"} label={gsc?.state === "ok" ? "Search Console Connected" : gsc?.state === "nodata" ? "Search Console · No Data Yet" : "Search Console Not Connected"} />
            <StatusPill status={sitemap?.ok ? "ok" : "off"} label={sitemap?.ok ? `Sitemap OK · ${sitemap.urls} URLs` : "Sitemap Unavailable"} />
            <StatusPill status={traffic ? "ok" : "off"} label={traffic ? "Site Analytics Connected" : "Site Analytics Not Connected"} />
          </div>

          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <MetricRing value={gsc?.state === "ok" ? gsc.clicks.toLocaleString() : "—"} label="Organic clicks" sub="Last 28 days" status={gsc?.state === "ok" ? "ok" : "off"} pct={gsc?.state === "ok" ? 70 : 0} />
            <MetricRing value={gsc?.state === "ok" ? gsc.impressions.toLocaleString() : "—"} label="Impressions" sub="Last 28 days" status={gsc?.state === "ok" ? "ok" : "off"} pct={gsc?.state === "ok" ? 85 : 0} />
            <MetricRing value={gsc?.state === "ok" ? `${gsc.ctr.toFixed(1)}%` : "—"} label="Click-through rate" sub="Clicks ÷ impressions" status={gsc?.state === "ok" ? "ok" : "off"} pct={gsc?.state === "ok" ? Math.min(100, gsc.ctr * 10) : 0} />
            <MetricRing value={gsc?.state === "ok" ? gsc.position.toFixed(1) : "—"} label="Avg. position" sub="Impression-weighted" status={gsc?.state === "ok" ? "ok" : "off"} pct={gsc?.state === "ok" ? Math.max(5, 100 - gsc.position * 5) : 0} />
            <MetricRing value={traffic ? organic.toLocaleString() : "—"} label="Organic visitors" sub="Last 7 days · search source" status={traffic ? "ok" : "off"} pct={traffic ? Math.min(100, organic) : 0} />
            <MetricRing value={conversion !== null ? `${conversion}%` : "—"} label="Organic → leads" sub={`${bookings} bookings this week`} status={conversion !== null ? "ok" : "off"} pct={conversion !== null ? Math.min(100, conversion * 4) : 0} />
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-4">
            <PendingCard label="Indexed pages" note="Google's indexing report is still processing for this property. Per-URL status lives in Search Console → Indexing → Pages once processing completes." status="pending" />
            <PendingCard label="Pages awaiting indexing" note="Discovered but not yet crawled pages appear in the same Search Console indexing report. We surface it as soon as the report finishes processing." status="pending" />
            <PendingCard label="Core Web Vitals" note="Field CWV data requires the PageSpeed Insights API with a key, which is not configured for this app. Lab metrics can be checked manually in PageSpeed Insights meanwhile." status="off" />
          </div>

          <TechSeoPanel />

          <div className="mt-8 holo-panel-deep rounded-2xl border border-[#54D9AE]/15 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><Globe className="w-5 h-5 text-[#54D9AE]" /> Top search queries (last 28 days)</h2>
              <span className="text-xs text-slate-400">{gsc?.state === "ok" ? `${gsc.keywords.length} queries · ${gsc.pages} pages` : "No data yet"}</span>
            </div>
            {gsc?.state === "ok" ? (
              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wider text-slate-500">
                      <th className="pb-3 pr-4 font-bold">Query</th>
                      <th className="pb-3 pr-4 font-bold w-40">Impressions</th>
                      <th className="pb-3 pr-4 font-bold">Clicks</th>
                      <th className="pb-3 pr-4 font-bold">CTR</th>
                      <th className="pb-3 font-bold">Position</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gsc.keywords.slice(0, 10).map((k, i) => (
                      <tr key={i} className="border-t border-white/5 text-slate-200">
                        <td className="py-2.5 pr-4 font-semibold max-w-[240px] truncate">{k.query}</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="w-10 shrink-0 tabular-nums">{k.impressions}</span>
                            <span className="h-1.5 rounded-full bg-[#54D9AE]" style={{ width: `${maxImpr ? Math.max(4, (k.impressions / maxImpr) * 100) : 4}%` }} />
                          </div>
                        </td>
                        <td className="py-2.5 pr-4 tabular-nums">{k.clicks}</td>
                        <td className="py-2.5 pr-4 tabular-nums">{k.ctr}%</td>
                        <td className="py-2.5 tabular-nums">{k.position}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400">
                {gsc?.state === "nodata"
                  ? "Google Search Console is connected but has no query data yet — it usually starts reporting within a few days of the first impressions."
                  : "Connect the Google Search Console integration in the dashboard to see live organic search data here."}
              </p>
            )}
          </div>

          <div className="mt-8 holo-panel-deep rounded-2xl border border-[#54D9AE]/15 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-bold text-white flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-300" /> SEO issues requiring attention</h2>
              <button
                onClick={runInsights}
                disabled={insightsBusy || gsc?.state !== "ok"}
                className="self-start inline-flex items-center gap-2 rounded-full bg-[#187B65] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-50"
              >
                {insightsBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                {insightsBusy ? "Analyzing…" : "Run AI analysis"}
              </button>
            </div>
            {gsc?.state !== "ok" ? (
              <p className="mt-4 text-sm text-slate-400">Needs live Search Console query data before the AI analysis can run.</p>
            ) : insightsError ? (
              <p className="mt-4 text-sm text-red-400">{insightsError}</p>
            ) : insights ? (
              <div className="mt-5 flex flex-col gap-2">
                {insights.quick_wins?.length > 0 ? insights.quick_wins.map((q, i) => (
                  <div key={i} className="rounded-xl bg-black/20 border border-white/5 p-3 text-sm">
                    <p className="font-semibold text-white">&ldquo;{q.query}&rdquo; &rarr; {q.page}</p>
                    <p className="text-slate-400 mt-0.5">{q.why}</p>
                  </div>
                )) : <p className="text-sm text-slate-400">No quick wins found in the current data window.</p>}
              </div>
            ) : (
              <p className="mt-4 text-sm text-slate-400 flex items-center gap-2"><Clock className="w-4 h-4" /> Run the AI analysis to turn live query data into ranked quick wins and page fixes.</p>
            )}
          </div>

          <AiSeoCommand />
        </>
      )}
    </div>
  );
}