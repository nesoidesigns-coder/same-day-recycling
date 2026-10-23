import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, TrendingUp, Eye, MousePointerClick, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";

// City-page performance from Google Search Console: clicks, impressions, CTR
// and average position for every /junk-removal-{city} landing page GSC has
// seen in the last 28 days (GSC data lags ~2 days).
export default function CityPagesPerf() {
  const [pages, setPages] = useState([]);
  const [window, setWindow] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("searchConsoleKeywords", { dimension: "page" });
        if (cancelled) return;
        setPages(res?.pages || []);
        setWindow(res?.startDate && res?.endDate ? { start: res.startDate, end: res.endDate } : null);
      } catch {
        if (!cancelled) setError("Could not load Search Console data. The Google Search Console connection may need to be reconnected.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const cityNameFor = (page) => {
    const match = String(page).match(/\/junk-removal-([a-z-]+)/);
    if (!match) return null;
    const city = CITIES.find((c) => c.slug === match[1]);
    return city ? city.name : match[1].replace(/-/g, " ");
  };
  const cityRows = pages
    .filter((p) => cityNameFor(p.page))
    .sort((a, b) => (b.clicks - a.clicks) || (b.impressions - a.impressions));
  const totals = cityRows.reduce(
    (acc, r) => ({ clicks: acc.clicks + r.clicks, impressions: acc.impressions + r.impressions }),
    { clicks: 0, impressions: 0 }
  );

  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#102B2A] tracking-tight flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-[#187B65]" /> City page performance
          </h2>
          <p className="text-sm text-slate-500">
            Last 28 days{window ? ` (${window.start} → ${window.end})` : ""} · Google Search Console
          </p>
        </div>
        {!loading && !error && (
          <div className="flex gap-4 text-sm font-semibold text-[#102B2A]">
            <span className="flex items-center gap-1.5"><MousePointerClick className="w-4 h-4 text-[#187B65]" /> {totals.clicks} clicks</span>
            <span className="flex items-center gap-1.5"><Eye className="w-4 h-4 text-[#187B65]" /> {totals.impressions} impressions</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <div className="w-5 h-5 border-2 border-slate-200 border-t-[#187B65] rounded-full animate-spin" /> Loading search data…
        </div>
      )}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {!loading && !error && cityRows.length === 0 && (
        <p className="mt-4 text-sm text-slate-500">
          No city pages have appeared in Google results yet. Pages only show here once Google begins surfacing them — submit the regenerated sitemap in Search Console to speed up discovery.
        </p>
      )}
      {!loading && !error && cityRows.length > 0 && (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-bold tracking-[0.12em] text-slate-400 uppercase border-b border-slate-100">
                <th className="py-2.5 pr-4">City</th>
                <th className="py-2.5 pr-4">Clicks</th>
                <th className="py-2.5 pr-4">Impressions</th>
                <th className="py-2.5 pr-4">CTR</th>
                <th className="py-2.5 pr-4">Avg. position</th>
                <th className="py-2.5">Page</th>
              </tr>
            </thead>
            <tbody>
              {cityRows.map((r) => (
                <tr key={r.page} className="border-b border-slate-50 hover:bg-[#f4f7f5]/50">
                  <td className="py-3 pr-4 font-semibold text-[#102B2A]">{cityNameFor(r.page)}</td>
                  <td className="py-3 pr-4 font-semibold">{r.clicks}</td>
                  <td className="py-3 pr-4">{r.impressions}</td>
                  <td className="py-3 pr-4">{r.ctr}%</td>
                  <td className="py-3 pr-4">
                    <span className={`inline-flex items-center gap-1 font-semibold ${r.position <= 20 ? "text-[#187B65]" : r.position <= 50 ? "text-amber-600" : "text-slate-500"}`}>
                      <TrendingUp className="w-3.5 h-3.5" /> {r.position}
                    </span>
                  </td>
                  <td className="py-3">
                    <Link to={String(r.page).replace("https://samedayrecycling.ca", "")} className="text-[#187B65] hover:underline flex items-center gap-1">
                      <Search className="w-3.5 h-3.5" /> view page
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}