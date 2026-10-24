import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bot, Loader2, RefreshCw, CheckCircle2, AlertTriangle, History, ArrowRight, Globe2, FileText } from "lucide-react";

const ISSUE_LABELS = {
  missing_meta_description: "No meta description",
  description_too_long: "Description too long",
  missing_title: "No title",
  title_too_long: "Title too long",
  missing_canonical: "No canonical",
  no_h1: "No H1",
  thin_content: "Thin content",
  no_structured_data: "No structured data",
  unreachable: "Unreachable",
  fetch_error: "Fetch error",
};

// Crawler-access audit card: shows what a non-JS crawler (Bing without
// rendering, AI assistants) actually receives per page, tracks verified
// improvements between runs, and links confirmed gaps to the SEO Action
// Engine queue.
export default function CrawlAuditPanel() {
  const [runs, setRuns] = useState(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const res = await base44.functions.invoke("crawlAudit", { action: "history" });
      setRuns(res.data.runs || []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const run = async () => {
    setRunning(true);
    setError(null);
    try {
      await base44.functions.invoke("crawlAudit", { action: "run" });
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setRunning(false);
    }
  };

  const latest = runs?.[0] || null;

  return (
    <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-1">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 inline-flex items-center gap-2">
          <Bot className="w-4 h-4 text-[#187B65]" /> Crawler-access audit
        </h2>
        <button onClick={run} disabled={running} className="inline-flex items-center gap-2 rounded-full bg-[#187B65] text-white font-bold px-4 py-2 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-60">
          {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {running ? "Fetching server HTML…" : "Run crawl audit"}
        </button>
      </div>
      <p className="text-[11px] text-slate-500 mb-4">
        Fetches every public page exactly as a crawler that does not execute JavaScript receives it, checks titles,
        descriptions, canonicals, headings, structured data and content depth, and records verified improvements
        between runs. Confirmed metadata gaps go to the SEO Action Engine queue for approval.
      </p>

      {error && <div className="rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 mb-4">{error}</div>}

      {runs === null ? (
        <Loader2 className="w-6 h-6 text-[#187B65] animate-spin mx-auto my-6" />
      ) : runs.length === 0 ? (
        <p className="text-sm text-slate-500 py-4">No crawl audit run yet — run one to see the crawler view of every page.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase ${latest.status === "success" ? "bg-[#187B65]/15 text-[#187B65]" : "bg-amber-100 text-amber-800"}`}>
              {latest.run_date} · {latest.status}
            </span>
            <span className="text-xs text-slate-500">
              {latest.pages?.length || 0} pages · {latest.issue_count || 0} issues
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${latest.robots_ok ? "text-[#187B65]" : "text-amber-700"}`}>
              {latest.robots_ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} robots.txt
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold ${latest.sitemap_ok ? "text-[#187B65]" : "text-amber-700"}`}>
              {latest.sitemap_ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />} sitemap.xml ({latest.sitemap_urls || 0} URLs)
            </span>
          </div>
          {latest.domain_stale && (
            <div className="mb-4 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs text-amber-800">
              <strong>Stale domain detected:</strong> {latest.base_url} serves materially less rendered content than the current deployment on the platform URL. Crawlers indexing the custom domain see the older shell + summary version instead of the full pages. Check domain propagation, then rescan to verify the fix.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-2 pr-4">Page</th>
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Description</th>
                  <th className="py-2 pr-3">Canonical</th>
                  <th className="py-2 pr-3">Words</th>
                  <th className="py-2 pr-3">H1/H2</th>
                  <th className="py-2 pr-3">Schema</th>
                  <th className="py-2">Issues</th>
                </tr>
              </thead>
              <tbody>
                {(latest.pages || []).map((p) => (
                  <tr key={p.path} className="border-t border-slate-100">
                    <td className="py-2.5 pr-4 font-semibold text-[#102B2A] font-mono text-xs">{p.path}</td>
                    <td className="py-2.5 pr-3">{p.ok ? (p.title_length > 0 ? `${p.title_length} ch` : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />) : "—"}</td>
                    <td className="py-2.5 pr-3">{p.ok ? (p.has_description ? `${p.description_length} ch` : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />) : "—"}</td>
                    <td className="py-2.5 pr-3">{p.ok ? (p.has_canonical ? <CheckCircle2 className="w-4 h-4 text-[#187B65]" /> : <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />) : "—"}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{p.ok ? (p.word_count || 0).toLocaleString("en-CA") : "—"}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{p.ok ? `${p.h1_count || 0}/${p.h2_count || 0}` : "—"}</td>
                    <td className="py-2.5 pr-3 tabular-nums">{p.ok ? p.ld_json_blocks || 0 : "—"}</td>
                    <td className="py-2.5">
                      {(p.issues || []).length === 0 ? (
                        <span className="text-[#187B65] text-xs font-semibold">None</span>
                      ) : (
                        <span className="flex flex-wrap gap-1">
                          {p.issues.map((i) => (
                            <span key={i} className="rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                              {ISSUE_LABELS[i] || i}
                            </span>
                          ))}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(latest.improvements || []).length > 0 && (
            <div className="mt-4 rounded-2xl bg-[#eef4f0] border border-[#187B65]/25 px-4 py-3 text-xs">
              <div className="font-bold text-[#187B65] uppercase tracking-wider text-[10px] mb-1.5">Verified improvements since the previous run</div>
              <ul className="space-y-1 text-[#102B2A]">
                {latest.improvements.slice(0, 8).map((im, i) => (
                  <li key={i}><span className="font-semibold font-mono">{im.path}</span> — {(ISSUE_LABELS[im.issue] || im.issue).toLowerCase()} resolved</li>
                ))}
              </ul>
            </div>
          )}

          {latest.recommendations_created > 0 && (
            <div className="mt-3 flex items-center gap-2 text-xs">
              <FileText className="w-3.5 h-3.5 text-[#187B65]" />
              <span className="text-slate-600">{latest.recommendations_created} metadata recommendation(s) queued for your approval in</span>
              <Link to="/admin/seo-action" className="inline-flex items-center gap-1 font-bold text-[#187B65] hover:underline">
                SEO Action Engine <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}

          {runs.length > 1 && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 inline-flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Run history
              </div>
              <div className="flex flex-wrap gap-2">
                {runs.slice(0, 8).map((r) => (
                  <span key={r.id} className="rounded-full bg-slate-50 border border-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-600">
                    {r.run_date} · {r.status} · {r.issue_count} issues
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}