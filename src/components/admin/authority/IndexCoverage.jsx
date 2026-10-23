import { bucketCls, bucketLabel, fmtDate } from "./buckets";

// Index coverage from real Google evidence: sitemap counts, Google's
// submitted-vs-indexed figures, and per-URL URL Inspection results with full
// detail (coverage state, last crawl, canonical, robots, sitemap discovery).
export default function IndexCoverage({ index }) {
  const sample = index.inspection_sample || [];
  const entries = Object.entries(index.inspection_buckets || {});

  return (
    <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">Index coverage</h2>
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 bg-slate-100 rounded-full px-2 py-0.5">Google evidence</span>
      </div>

      {index.sitemap_error ? (
        <p className="text-sm text-slate-600">Couldn't read the submitted sitemap from the live site — index coverage is shown as "Not connected" for this section.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 mb-4">
            {entries.map(([b, n]) => (
              <span key={b} className={`rounded-full px-3 py-1 text-[11px] font-bold ${bucketCls(b)}`}>
                {bucketLabel(b)} · {n}
              </span>
            ))}
            {entries.length === 0 && <span className="text-sm text-slate-500">No URL inspections in the latest sweep — all sitemap URLs show search impressions.</span>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <Stat label="Pages in sitemap" value={index.sitemap_pages} />
            <Stat
              label="Google submitted/indexed"
              value={index.sitemap_submitted_indexed ? `${index.sitemap_submitted_indexed.indexed} / ${index.sitemap_submitted_indexed.submitted}` : "—"}
            />
            <Stat label="Missing from sitemap" value={(index.sitemap_missing || []).length} tone={(index.sitemap_missing || []).length ? "text-amber-600" : "text-[#187B65]"} />
            <Stat label="With search impressions (90d)" value={index.with_impressions} tone="text-[#187B65]" />
          </div>

          {sample.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-4">Page</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Coverage state (Google)</th>
                    <th className="py-2 pr-4">Last crawl</th>
                    <th className="py-2 pr-4">Canonical (Google)</th>
                    <th className="py-2 pr-4">Robots</th>
                    <th className="py-2 pr-4">In sitemap</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.map((s, i) => (
                    <tr key={s.url + i} className="border-t border-slate-100 align-top">
                      <td className="py-2.5 pr-4 font-mono text-xs text-[#102B2A] break-all">{String(s.url).replace(/^https?:\/\/[^/]+/, "") || "/"}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase whitespace-nowrap ${bucketCls(s.bucket)}`}>{bucketLabel(s.bucket)}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-xs text-slate-600">{s.coverage_state || s.reason || "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-600 whitespace-nowrap">{s.last_crawl ? fmtDate(s.last_crawl) : "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-600 break-all">{s.canonical_google || s.canonical_user || "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-600">{s.robots_txt_state || "—"}</td>
                      <td className="py-2.5 pr-4 text-xs text-slate-600">{s.in_sitemap === true ? "yes" : s.in_sitemap === false ? "no" : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {(index.sitemap_missing || []).length > 0 && (
            <div className="mt-4 rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3 text-[12px] text-amber-800">
              <span className="font-bold">Sitemap audit:</span> {(index.sitemap_missing || []).length} canonical service/location page(s) are missing from the sitemap: {(index.sitemap_missing || []).slice(0, 8).join(", ")}{(index.sitemap_missing || []).length > 8 ? " …" : ""}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 px-4 py-3.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className={`mt-0.5 text-xl font-extrabold ${tone || "text-[#102B2A]"}`}>{value}</div>
    </div>
  );
}