import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Search, Command, Building2 } from "lucide-react";
import GscRing from "@/components/admin/seo/GscRing";
import SitemapIndexCard from "@/components/admin/seo/SitemapIndexCard";
import AutoSeoRunner from "@/components/admin/seo/AutoSeoRunner";
import CityMetaLibrary from "@/components/admin/seo/CityMetaLibrary";
import CityPagesPerf from "@/components/admin/CityPagesPerf";
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

export default function AdminSeoCommand() {
  const [loading, setLoading] = useState(true);
  const [gsc, setGsc] = useState(null);
  const [sitemap, setSitemap] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("searchConsoleKeywords", {});
      const keywords = res.data?.keywords || [];
      if (!keywords.length) setGsc({ state: "nodata", keywords: [], sites: res.data?.sites || [] });
      else {
        const clicks = keywords.reduce((a, k) => a + (k.clicks || 0), 0);
        const impressions = keywords.reduce((a, k) => a + (k.impressions || 0), 0);
        const position = impressions
          ? keywords.reduce((a, k) => a + (k.position || 0) * k.impressions, 0) / impressions
          : 0;
        setGsc({
          state: "ok",
          keywords,
          sites: res.data?.sites || [],
          clicks,
          impressions,
          ctr: impressions ? (clicks / impressions) * 100 : 0,
          position,
          pages: new Set(keywords.map((k) => k.page).filter(Boolean)).size,
          window: res.data?.startDate && res.data?.endDate ? `${res.data.startDate} → ${res.data.endDate}` : null,
        });
      }
    } catch {
      setGsc({ state: "disconnected", keywords: [], sites: [] });
    }
    try {
      const r = await fetch("/sitemap.xml");
      const t = await r.text();
      setSitemap({ ok: r.ok && (t.match(/<loc>/g) || []).length > 0, urls: (t.match(/<loc>/g) || []).length });
    } catch {
      setSitemap({ ok: false, urls: 0 });
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cityImpressions = (gsc?.keywords || [])
    .filter((k) => /\/(city\/|junk-removal-)/.test(k.page || ""))
    .reduce((a, k) => a + (k.impressions || 0), 0);
  const cityShare = gsc?.impressions ? Math.round((cityImpressions / gsc.impressions) * 100) : 0;

  return (
    <div className="admin-console -mx-4 -my-6 md:-mx-8 md:-my-8 px-4 py-8 md:px-8 min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="text-xs font-bold tracking-[0.2em] text-[#54D9AE] uppercase mb-2 flex items-center gap-2">
            <Command className="w-4 h-4" /> Auto SEO Command Center
          </div>
          <h1 className="admin-headline text-3xl md:text-4xl font-bold tracking-tight">National SEO, on autopilot</h1>
          <p className="mt-2 text-sm text-slate-400 max-w-xl">
            Live Search Console performance, one-click sitemap submission, weekly AI analysis and one-tap page fixes for every city and service page.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="self-start inline-flex items-center gap-2 rounded-full border border-[#54D9AE]/40 text-[#54D9AE] font-bold px-5 py-2.5 text-sm hover:bg-[#54D9AE]/10 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Refresh
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <StatusPill status={gsc?.state === "ok" ? "ok" : gsc?.state === "nodata" ? "pending" : "off"} label={gsc?.state === "ok" ? `Search Console · ${gsc.window}` : gsc?.state === "nodata" ? "Search Console · No Data Yet" : "Search Console Not Connected"} />
        <StatusPill status={sitemap?.ok ? "ok" : "off"} label={sitemap?.ok ? `Sitemap OK · ${sitemap.urls} URLs` : "Sitemap Unavailable"} />
      </div>

      {loading && !gsc ? (
        <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 text-[#54D9AE] animate-spin" /></div>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            <GscRing value={gsc?.state === "ok" ? gsc.clicks.toLocaleString() : "—"} label="Organic clicks" sub="Last 28 days" status={gsc?.state === "ok" ? "ok" : "off"} pct={gsc?.state === "ok" ? 70 : 0} />
            <GscRing value={gsc?.state === "ok" ? gsc.impressions.toLocaleString() : "—"} label="Impressions" sub="Last 28 days" status={gsc?.state === "ok" ? "ok" : "off"} pct={gsc?.state === "ok" ? 85 : 0} />
            <GscRing value={gsc?.state === "ok" ? `${gsc.ctr.toFixed(1)}%` : "—"} label="Click-through rate" sub="Clicks ÷ impressions" status={gsc?.state === "ok" ? "ok" : "off"} pct={gsc?.state === "ok" ? Math.min(100, gsc.ctr * 10) : 0} />
            <GscRing value={gsc?.state === "ok" ? gsc.position.toFixed(1) : "—"} label="Avg. position" sub="Impression-weighted" status={gsc?.state === "ok" ? "ok" : "off"} pct={gsc?.state === "ok" ? Math.max(5, 100 - gsc.position * 5) : 0} />
            <GscRing value={gsc?.state === "ok" ? cityImpressions.toLocaleString() : "—"} label="City-page impressions" sub="city & junk-removal URLs" status={gsc?.state === "ok" ? "ok" : "off"} pct={cityShare} />
            <GscRing value={gsc?.state === "ok" ? `${cityShare}%` : "—"} label="City-page share" sub="of all impressions" status={gsc?.state === "ok" ? "ok" : "off"} pct={cityShare} />
          </div>

          <div className="mt-6"><SitemapIndexCard sitemap={sitemap} sites={gsc?.sites} /></div>

          <div className="mt-6"><CityPagesPerf /></div>

          <div className="mt-6 grid xl:grid-cols-2 gap-6">
            <AutoSeoRunner />
            <CityMetaLibrary />
          </div>

          <AiSeoCommand />

          <div className="mt-8 rounded-2xl border border-[#54D9AE]/10 bg-black/20 p-5 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              <span className="font-bold text-slate-400">Future: SEO tools for the network.</span> These same tools can be exposed to white-label and license-partner recycling businesses through the software plan, giving each tenant its own SEO command center over its own site. Not wired yet — say the word when the network is ready.
            </p>
          </div>
        </>
      )}
    </div>
  );
}