import { useState } from "react";
import { Loader2, ExternalLink, ShieldCheck, Wrench, CheckCircle2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { bucketCls, bucketLabel, PRIORITY_BADGE, fmtDate } from "./buckets";

// Indexing Recovery Centre — prioritized, evidence-backed issues. Every card
// separates what Google actually reported (evidence) from what we recommend
// (fix). "Verify" re-runs Google's URL Inspection for that one URL.
export default function IndexingRecoveryCentre({ index, siteUrl }) {
  const [results, setResults] = useState({});
  const [busy, setBusy] = useState(null);
  const items = (index.recovery || []).slice().sort((a, b) => a.priority - b.priority);

  const verify = async (url) => {
    setBusy(url);
    try {
      const res = await base44.functions.invoke("searchAuthority", { action: "inspect", url });
      setResults((r) => ({ ...r, [url]: res }));
    } catch (e) {
      setResults((r) => ({ ...r, [url]: { bucket: "inspection_unavailable", coverage_state: "", reason: e.message } }));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-1 inline-flex items-center gap-2">
        <Wrench className="w-4 h-4 text-[#187B65]" /> Indexing Recovery Centre
      </h2>
      <p className="text-[11px] text-slate-500 mb-4">
        Prioritized issues with Google's own evidence and a recommended fix. "Verify" re-runs Google's URL
        Inspection for that URL; "Request indexing" opens Search Console for a manual indexing request.
        {(index.inspection_sample || []).length > 0 && ` Last inspection sweep: ${fmtDate(index.inspection_sample[0].inspected_at)} (${(index.inspection_sample || []).length} URLs checked).`}
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-slate-600 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
          No indexing recovery items right now — inspected pages are indexed or awaiting Google's crawl without technical blockers.
        </p>
      ) : (
        <div className="space-y-3">
          {items.map((it, i) => {
            const re = results[it.url];
            const shown = re && re.bucket !== "inspection_unavailable" ? re : it.detail || {};
            const badge = PRIORITY_BADGE[it.priority] || PRIORITY_BADGE[3];
            return (
              <div key={it.url + i} className="rounded-2xl border border-slate-100 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badge.cls}`}>{badge.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${bucketCls(it.bucket)}`}>{it.bucket === "page_check" || it.bucket === "sitemap_missing" ? it.issue : bucketLabel(it.bucket)}</span>
                  <span className="font-mono text-[11px] text-[#102B2A] break-all">{String(it.url).replace(/^https?:\/\/[^/]+/, "") || "/"}</span>
                </div>

                <div className="mt-2.5 grid gap-2 text-[12px] leading-relaxed">
                  <div className="rounded-xl bg-[#f4f7f5] px-3 py-2">
                    <span className="font-bold text-[#102B2A]">
                      {it.evidence_kind === "google" ? "Google evidence: " : it.evidence_kind === "page_fetch" ? "Fetch evidence: " : "Evidence: "}
                    </span>
                    <span className="text-slate-600">{it.evidence}</span>
                  </div>
                  <div className="rounded-xl border border-slate-100 px-3 py-2">
                    <span className="font-bold text-[#187B65]">Recommended fix: </span>
                    <span className="text-slate-600">{it.fix}</span>
                  </div>
                </div>

                {shown && (shown.last_crawl || shown.canonical_google || shown.canonical_user || shown.robots_txt_state || shown.indexing_state || shown.page_fetch_state || shown.in_sitemap !== undefined) && (
                  <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-[11px] text-slate-500">
                    {shown.coverage_state && <div><span className="font-semibold text-slate-600">Coverage:</span> {shown.coverage_state}</div>}
                    {shown.indexing_state && <div><span className="font-semibold text-slate-600">Indexing state:</span> {shown.indexing_state}</div>}
                    {shown.last_crawl && <div><span className="font-semibold text-slate-600">Last crawl:</span> {fmtDate(shown.last_crawl)}</div>}
                    {(shown.canonical_google || shown.canonical_user) && <div className="break-all"><span className="font-semibold text-slate-600">Canonical:</span> {shown.canonical_google || shown.canonical_user}</div>}
                    {shown.robots_txt_state && <div><span className="font-semibold text-slate-600">Robots:</span> {shown.robots_txt_state}</div>}
                    {shown.page_fetch_state && <div><span className="font-semibold text-slate-600">Fetch:</span> {shown.page_fetch_state}</div>}
                    {shown.in_sitemap !== undefined && <div><span className="font-semibold text-slate-600">In sitemap:</span> {shown.in_sitemap ? "yes" : "no"}</div>}
                    {shown.inspected_at && <div><span className="font-semibold text-slate-600">Inspected:</span> {fmtDate(shown.inspected_at)}</div>}
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <a
                    href={it.gsc_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] text-white text-xs font-bold px-3.5 py-2 hover:bg-[#125C4E] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Request indexing in Search Console
                  </a>
                  <button
                    onClick={() => verify(it.url)}
                    disabled={busy === it.url}
                    className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 text-xs font-bold px-3.5 py-2 text-[#102B2A] hover:border-[#187B65] transition-colors disabled:opacity-50"
                  >
                    {busy === it.url ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" />}
                    Verify with Google
                  </button>
                  {re && (
                    <span className="text-[11px] text-slate-500">
                      Latest check: <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${bucketCls(re.bucket)}`}>{bucketLabel(re.bucket)}</span>
                      {re.coverage_state && <span> · {re.coverage_state}</span>}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}