import { useEffect, useState } from "react";
import { TrendingUp, Eye, MousePointerClick, BarChart3, RefreshCw } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function SearchConsoleTab() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortKey, setSortKey] = useState("clicks");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("searchConsoleKeywords", {});
      setData(res.data || res);
    } catch (e) {
      setError(e?.message || "Could not load Search Console data");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const keywords = data?.keywords || [];
  const totals = keywords.reduce(
    (acc, k) => ({
      clicks: acc.clicks + k.clicks,
      impressions: acc.impressions + k.impressions,
    }),
    { clicks: 0, impressions: 0 }
  );
  const avgCtr = totals.impressions ? ((totals.clicks / totals.impressions) * 100).toFixed(1) : "0.0";
  const avgPos = keywords.length
    ? (keywords.reduce((a, k) => a + k.position, 0) / keywords.length).toFixed(1)
    : "—";

  // Quick wins: decent impressions, ranking 4-15, few clicks
  const quickWins = keywords
    .filter((k) => k.impressions >= 50 && k.position >= 4 && k.position <= 15 && k.clicks < 5)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 5);

  const sorted = [...keywords].sort((a, b) => (b[sortKey] || 0) - (a[sortKey] || 0)).slice(0, 25);
  const maxImpressions = Math.max(...keywords.map((k) => k.impressions), 1);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-bold text-[#0c3b24]">Search Console Keywords</h2>
          <p className="text-xs text-slate-500">
            {data ? `Google search performance, ${data.startDate} → ${data.endDate}` : "Loading…"}
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-4 py-2 text-sm hover:bg-[#17a04c] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {loading && !data ? (
        <div className="text-sm text-slate-500 py-10 text-center">Pulling the latest keyword data…</div>
      ) : error ? (
        <div className="rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm p-4">
          {error} — make sure the Search Console account is connected and the site is verified.
        </div>
      ) : !keywords.length ? (
        <div className="rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-sm p-4">
          No keyword data for this window yet — the site may still be indexing in Google.
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div className="rounded-2xl bg-[#f4f7f5] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                <MousePointerClick className="w-4 h-4 text-[#1d9e56]" /> Clicks
              </div>
              <div className="text-2xl font-bold text-[#0c3b24]">{totals.clicks.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl bg-[#f4f7f5] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                <Eye className="w-4 h-4 text-[#1d9e56]" /> Impressions
              </div>
              <div className="text-2xl font-bold text-[#0c3b24]">{totals.impressions.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl bg-[#f4f7f5] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                <TrendingUp className="w-4 h-4 text-[#1d9e56]" /> Avg CTR
              </div>
              <div className="text-2xl font-bold text-[#0c3b24]">{avgCtr}%</div>
            </div>
            <div className="rounded-2xl bg-[#f4f7f5] p-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wide mb-1">
                <BarChart3 className="w-4 h-4 text-[#1d9e56]" /> Avg Position
              </div>
              <div className="text-2xl font-bold text-[#0c3b24]">{avgPos}</div>
            </div>
          </div>

          {quickWins.length > 0 && (
            <div className="rounded-2xl border border-[#1d9e56]/30 bg-[#f4f7f5] p-4 mb-5">
              <div className="font-bold text-[#0c3b24] text-sm mb-2">Quick wins — high impressions, low clicks</div>
              <ul className="space-y-1.5">
                {quickWins.map((k, i) => (
                  <li key={i} className="text-sm text-slate-700">
                    <span className="font-semibold">"{k.query}"</span> — position {k.position}, {k.impressions.toLocaleString()} impressions but only {k.clicks} clicks. A better title could win the click.
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2 mb-3">
            {[
              { key: "clicks", label: "Sort: Clicks" },
              { key: "impressions", label: "Sort: Impressions" },
              { key: "position", label: "Sort: Position" },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSortKey(s.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-bold ${sortKey === s.key ? "bg-[#0c3b24] text-[#1d9e56]" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                  <th className="px-4 py-3">Keyword</th>
                  <th className="px-4 py-3">Clicks</th>
                  <th className="px-4 py-3">Impressions</th>
                  <th className="px-4 py-3">CTR</th>
                  <th className="px-4 py-3">Pos</th>
                  <th className="px-4 py-3">Page</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((k, i) => (
                  <tr key={i} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-semibold text-[#0c3b24]">{k.query}</td>
                    <td className="px-4 py-2.5">{k.clicks}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-10">{k.impressions}</span>
                        <div className="h-1.5 rounded-full bg-[#1d9e56]/20 flex-1 min-w-16">
                          <div
                            className="h-1.5 rounded-full bg-[#1d9e56]"
                            style={{ width: `${Math.round((k.impressions / maxImpressions) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">{k.ctr}%</td>
                    <td className="px-4 py-2.5">{k.position}</td>
                    <td className="px-4 py-2.5 text-xs text-slate-500 max-w-40 truncate">{k.page}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}