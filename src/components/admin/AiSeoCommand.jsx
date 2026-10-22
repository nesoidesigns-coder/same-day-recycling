import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Wand2, Loader2, MapPin, PenLine, CheckCircle2, Clock } from "lucide-react";

const slugToCity = (s) =>
  (s || "").split(/[-/]/).filter(Boolean).slice(-1)[0]
    .replace(/\.(html?|ca)$/i, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function AiSeoCommand() {
  const [plan, setPlan] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [applying, setApplying] = useState("");
  const [applied, setApplied] = useState([]);
  const [drafting, setDrafting] = useState("");
  const [metaBusy, setMetaBusy] = useState(false);
  const [metaPages, setMetaPages] = useState(null);
  const [metaError, setMetaError] = useState("");

  const generateServiceMetas = async () => {
    setMetaBusy(true); setMetaError(""); setMetaPages(null);
    try {
      const res = await base44.functions.invoke("serviceMetaGenerate", {});
      setMetaPages(res.data?.pages || []);
    } catch (e) {
      setMetaError(e?.response?.data?.error || e.message || "Generation failed.");
    }
    setMetaBusy(false);
  };

  const analyze = async () => {
    setBusy(true); setError(""); setApplied([]); setPlan(null);
    try {
      const kw = await base44.functions.invoke("searchConsoleKeywords", {});
      const keywords = kw?.data?.keywords || [];
      if (!keywords.length) throw new Error("No Search Console query data yet — connect it or wait for the first impressions.");
      const res = await base44.functions.invoke("seoInsights", { keywords: keywords.slice(0, 100) });
      setPlan(res.data || null);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Analysis failed.");
    }
    setBusy(false);
  };

  const applyToCity = async (rec) => {
    const city = slugToCity(rec.page);
    setApplying(rec.page);
    try {
      const existing = await base44.entities.CitySeo.filter({ city });
      const row = {
        city,
        seo_title: rec.title_suggestion,
        seo_description: rec.meta_suggestion,
        keywords: (rec.focus_keywords || []).join(", "),
        updated_date: new Date().toISOString().slice(0, 10),
      };
      if (existing.length) {
        await base44.entities.CitySeo.update(existing[0].id, row);
      } else {
        await base44.entities.CitySeo.create({ ...row, hero_intro: "" });
      }
      setApplied((a) => [...a, rec.page]);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not apply that fix.");
    }
    setApplying("");
  };

  const draftContent = async (rec) => {
    setDrafting(rec.page);
    try {
      await base44.functions.invoke("coCreator", {
        action: "draft",
        topic: `SEO content for ${rec.page}: target keywords ${(rec.focus_keywords || []).join(", ")}. ${rec.content_ideas?.[0] || ""}`,
      });
      setError("");
      setApplied((a) => [...a, "draft:" + rec.page]);
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not draft content.");
    }
    setDrafting("");
  };

  const isCityPage = (rec) => /city|[-_](bc|ab|on|qc|sk|mb|ns|nb)/i.test(rec.page || "") && slugToCity(rec.page);

  return (
    <div className="mt-8 holo-panel-deep rounded-2xl border border-[#54D9AE]/15 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Wand2 className="w-5 h-5 text-[#54D9AE]" /> AI SEO Command</h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={generateServiceMetas}
            disabled={metaBusy}
            className="self-start inline-flex items-center gap-2 rounded-full border border-[#54D9AE]/50 text-[#54D9AE] font-bold px-5 py-2.5 text-sm hover:bg-[#187B65]/20 transition-colors disabled:opacity-50"
          >
            {metaBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenLine className="w-4 h-4" />}
            {metaBusy ? "Writing metas…" : "Generate service-page metas"}
          </button>
          <button
            onClick={analyze}
            disabled={busy}
            className="self-start inline-flex items-center gap-2 rounded-full bg-[#187B65] text-white font-bold px-5 py-2.5 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {busy ? "Analyzing…" : plan ? "Re-analyze" : "Analyze & propose fixes"}
          </button>
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-400">Turns live Google query data into per-page title, meta and content fixes — city-page fixes apply to the live site in one tap. Service-page metas go live automatically.</p>

      {metaError && <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{metaError}</div>}
      {metaBusy && <div className="mt-4 flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin text-[#54D9AE]" /> Writing local-SEO titles and descriptions for every service page…</div>}
      {metaPages && !metaBusy && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#54D9AE]"><CheckCircle2 className="w-3.5 h-3.5" /> {metaPages.length} service pages updated — live now.</div>
          {metaPages.map((m) => (
            <div key={m.path} className="rounded-xl bg-black/20 border border-white/5 p-4">
              <div className="text-xs font-bold text-[#54D9AE]">{m.path}</div>
              <div className="mt-2 text-xs text-slate-300"><span className="font-bold text-white">Title:</span> {m.title} <span className="text-slate-500">({m.title.length} chars)</span></div>
              <div className="mt-1 text-xs text-slate-300"><span className="font-bold text-white">Meta:</span> {m.description} <span className="text-slate-500">({m.description.length} chars)</span></div>
              {m.focus_keywords && <div className="mt-2 text-[10px] text-slate-500">{m.focus_keywords}</div>}
            </div>
          ))}
        </div>
      )}
      {error && <div className="mt-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">{error}</div>}
      {busy && <div className="mt-4 flex items-center gap-2 text-sm text-slate-400"><Loader2 className="w-4 h-4 animate-spin text-[#54D9AE]" /> Pulling Search Console queries and drafting page fixes…</div>}

      {plan && !busy && (
        <div className="mt-5 space-y-3">
          {plan.notes && <p className="text-sm text-slate-300">{plan.notes}</p>}
          {(plan.page_recommendations || []).length === 0 && (
            <p className="text-sm text-slate-400">No page-level recommendations this window.</p>
          )}
          {(plan.page_recommendations || []).map((rec, i) => {
            const city = slugToCity(rec.page);
            const isApplied = applied.includes(rec.page);
            return (
              <div key={i} className="rounded-xl bg-black/20 border border-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-bold text-white flex items-center gap-1.5 min-w-0">
                    {isCityPage(rec) ? <MapPin className="w-3.5 h-3.5 text-[#54D9AE] shrink-0" /> : <Clock className="w-3.5 h-3.5 text-amber-300 shrink-0" />}
                    <span className="truncate">{rec.page}</span>
                  </div>
                  <div className="flex gap-2">
                    {isCityPage(rec) && (
                      <button onClick={() => applyToCity(rec)} disabled={applying === rec.page || isApplied} className="rounded-full bg-[#187B65] text-white font-bold px-3 py-1.5 text-xs disabled:opacity-50">
                        {applying === rec.page ? "Applying…" : isApplied ? "Applied" : `Apply to ${city} page`}
                      </button>
                    )}
                    <button onClick={() => draftContent(rec)} disabled={drafting === rec.page} className="rounded-full border border-[#54D9AE]/40 text-[#54D9AE] font-bold px-3 py-1.5 text-xs disabled:opacity-50">
                      {drafting === rec.page ? "Drafting…" : <><PenLine className="w-3.5 h-3.5 inline mr-1" />Draft content</>}
                    </button>
                  </div>
                </div>
                {rec.focus_keywords?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {rec.focus_keywords.map((k) => <span key={k} className="rounded-full bg-[#54D9AE]/10 border border-[#54D9AE]/30 px-2 py-0.5 text-[10px] font-bold text-[#54D9AE]">{k}</span>)}
                  </div>
                )}
                {rec.title_suggestion && <div className="mt-2 text-xs text-slate-300"><span className="font-bold text-white">Title:</span> {rec.title_suggestion} <span className="text-slate-500">({rec.title_suggestion.length} chars)</span></div>}
                {rec.meta_suggestion && <div className="mt-1 text-xs text-slate-300"><span className="font-bold text-white">Meta:</span> {rec.meta_suggestion} <span className="text-slate-500">({rec.meta_suggestion.length} chars)</span></div>}
                {rec.content_ideas?.length > 0 && (
                  <ul className="mt-2 list-disc list-inside space-y-0.5 text-xs text-slate-400">{rec.content_ideas.map((c) => <li key={c}>{c}</li>)}</ul>
                )}
              </div>
            );
          })}
          {applied.some((a) => a.startsWith("draft:")) && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#54D9AE]"><CheckCircle2 className="w-3.5 h-3.5" /> Content draft saved — review and publish it in the AI Co-Creator tab of the Marketing Hub.</div>
          )}
        </div>
      )}

      {!plan && !busy && !error && (
        <p className="mt-4 text-sm text-slate-400">The full fix list from the last analysis appears here — title and meta suggestions with one-tap apply to city pages.</p>
      )}
    </div>
  );
}