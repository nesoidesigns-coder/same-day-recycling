import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Search } from "lucide-react";
import { CITIES } from "@/lib/cities";

const shortPage = (url) => {
  try {
    const p = new URL(url).pathname;
    return p === "/" ? "Home" : p.replace(/^\/+|\/+$/g, "");
  } catch {
    return url;
  }
};

const cityFor = (page) => {
  const slug = page.split("/")[1] || "";
  const city = CITIES.find((c) => c.slug === slug);
  return city ? city.name : null;
};

export default function SeoTab() {
  const [sites, setSites] = useState(null);
  const [siteUrl, setSiteUrl] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = async (url) => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("searchConsoleKeywords", url ? { siteUrl: url } : {});
      setSites(res.data.sites || []);
      setSiteUrl(res.data.siteUrl);
      setData(res.data);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Could not load Search Console data.");
      setSites([]);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading && !data) return <Loader2 className="w-8 h-8 text-[#1d9e56] animate-spin mx-auto my-12" />;

  if (error) return <p className="text-red-600 text-center py-12">{error}</p>;

  let keywords = data?.keywords || [];
  if (cityFilter) keywords = keywords.filter((k) => cityFor(shortPage(k.page)) === cityFilter);
  if (search.trim()) {
    const q = search.trim().toLowerCase();
    keywords = keywords.filter((k) => k.query.toLowerCase().includes(q) || k.page.toLowerCase().includes(q));
  }
  keywords = [...keywords].sort((a, b) => b.clicks - a.clicks);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {(sites?.length > 1) && (
          <select value={siteUrl} onChange={(e) => load(e.target.value)} className="input w-auto py-2 max-w-xs">
            {sites.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        )}
        <span className="text-xs text-slate-500 font-semibold">
          Last 28 days{data ? ` (${data.startDate} → ${data.endDate})` : ""}
        </span>
        <span className="flex-1" />
        <span className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter keywords…"
            className="input w-48 py-2 pl-9"
          />
        </span>
        <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="input w-40 py-2">
          <option value="">All pages</option>
          {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
        </select>
      </div>

      {keywords.length === 0 ? (
        <p className="text-slate-500 text-center py-12">No keyword data yet — Google reporting can take a few days after indexing.</p>
      ) : (
        <div className="rounded-3xl bg-white border border-slate-100 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400 border-b border-slate-100">
                <th className="px-5 py-3 font-bold">Keyword</th>
                <th className="px-5 py-3 font-bold">Page</th>
                <th className="px-5 py-3 font-bold text-right">Clicks</th>
                <th className="px-5 py-3 font-bold text-right">Impressions</th>
                <th className="px-5 py-3 font-bold text-right">CTR</th>
                <th className="px-5 py-3 font-bold text-right">Avg. position</th>
              </tr>
            </thead>
            <tbody>
              {keywords.map((k, i) => (
                <tr key={i} className="border-b border-slate-50 last:border-0">
                  <td className="px-5 py-3 font-semibold text-[#0c3b24]">{k.query}</td>
                  <td className="px-5 py-3 text-slate-500">{shortPage(k.page)}</td>
                  <td className="px-5 py-3 text-right font-bold text-[#0c3b24]">{k.clicks}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{k.impressions}</td>
                  <td className="px-5 py-3 text-right text-slate-600">{k.ctr}%</td>
                  <td className="px-5 py-3 text-right text-slate-600">{k.position}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}