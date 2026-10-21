import { useState, useEffect } from "react";
import { Loader2, Search, Lightbulb, BookOpen, CheckCircle2, Eye, EyeOff, ExternalLink, Sparkles, History, Trash2, ChevronDown, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";

export default function ResearchTab() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [history, setHistory] = useState(null);
  const [expandedId, setExpandedId] = useState(null);

  const loadHistory = async () => {
    try {
      const { items } = await base44.entities.ResearchResult.filter({}, { sort: "-created_date", limit: 30 });
      setHistory(items);
    } catch {
      setHistory([]);
    }
  };

  const deleteResearch = async (id) => {
    await base44.entities.ResearchResult.delete(id);
    loadHistory();
  };

  const loadPosts = async () => {
    try {
      const { items } = await base44.entities.ContentPost.filter({}, { sort: "-created_date", limit: 30 });
      setPosts(items);
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => { loadPosts(); loadHistory(); }, []);

  const research = async () => {
    if (!topic.trim()) { setError("Type a topic first"); return; }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.functions.invoke("aiResearch", { topic });
      setResult(res.data);
      loadHistory();
    } catch (e) {
      setError(e?.message || "Research failed");
    }
    setLoading(false);
  };

  const generatePost = async () => {
    setGenerating(true);
    setError("");
    try {
      await base44.functions.invoke("contentGen", { topic });
      await loadPosts();
    } catch (e) {
      setError(e?.message || "Article generation failed");
    }
    setGenerating(false);
  };

  const togglePublish = async (p) => {
    await base44.entities.ContentPost.update(p.id, { status: p.status === "published" ? "draft" : "published" });
    loadPosts();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-100 p-5">
        <h2 className="font-bold text-[#0c3b24] flex items-center gap-2 mb-2">
          <Search className="w-4 h-4 text-[#1d9e56]" /> AI research tool
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Type any topic (disposal rules, competitor pricing, a new service idea, a city bylaw) and the AI researches live web sources into actionable insights.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && research()}
            placeholder="e.g. How do residents in my city dispose of mattresses?"
            className="input flex-1"
          />
          <button
            onClick={research}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[#1d9e56] text-white font-bold px-6 py-3 text-sm hover:bg-[#17a04c] transition-colors disabled:opacity-60 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
            {loading ? "Researching…" : "Research"}
          </button>
        </div>
        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}

        {result && (
          <div className="mt-6 flex flex-col gap-4">
            <div className="rounded-xl bg-[#f4f7f5] p-4 text-sm text-slate-700">{result.summary}</div>
            {result.key_takeaways?.length > 0 && (
              <div>
                <h3 className="font-bold text-[#0c3b24] text-sm mb-2">Key takeaways</h3>
                <ul className="flex flex-col gap-2">
                  {result.key_takeaways.map((t, i) => (
                    <li key={i} className="rounded-xl border border-slate-100 p-3 text-sm text-slate-700 flex gap-2">
                      <Sparkles className="w-4 h-4 text-[#1d9e56] shrink-0 mt-0.5" /> {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {result.opportunities?.length > 0 && (
              <div>
                <h3 className="font-bold text-[#0c3b24] text-sm mb-2">Opportunities for the business</h3>
                <ul className="list-disc pl-5 text-sm text-slate-600 flex flex-col gap-1">
                  {result.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}
            {result.sources?.length > 0 && (
              <div>
                <h3 className="font-bold text-[#0c3b24] text-sm mb-2">Sources</h3>
                <ul className="list-disc pl-5 text-xs text-slate-500 flex flex-col gap-1">
                  {result.sources.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 p-5">
        <h2 className="font-bold text-[#0c3b24] flex items-center gap-2 mb-2">
          <History className="w-4 h-4 text-[#1d9e56]" /> Research history
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Every research report is saved here — from the tool above and from web lookups the AI receptionist does while chatting with visitors.
        </p>

        {history === null && (
          <div className="flex items-center justify-center py-6">
            <div className="w-6 h-6 border-4 border-slate-200 border-t-[#1d9e56] rounded-full animate-spin"></div>
          </div>
        )}
        {history !== null && history.length === 0 && (
          <p className="text-sm text-slate-500">No saved research yet.</p>
        )}
        {history !== null && history.length > 0 && (
          <div className="flex flex-col gap-2">
            {history.map((r) => {
              const open = expandedId === r.id;
              return (
                <div key={r.id} className="rounded-xl bg-[#f4f7f5] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <button onClick={() => setExpandedId(open ? null : r.id)} className="min-w-0 text-left flex-1">
                      <p className="font-semibold text-[#0c3b24] text-sm truncate">{r.topic}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                        {r.origin === "receptionist" && <MessageCircle className="w-3 h-3" />}
                        {r.origin === "receptionist" ? "From AI receptionist" : "From research tool"}
                        &nbsp;· {new Date(r.created_date).toLocaleString()}
                      </p>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => setExpandedId(open ? null : r.id)}
                        className="p-2 text-slate-500 hover:text-[#1d9e56] transition-colors"
                        aria-label="Toggle details"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
                      </button>
                      <button
                        onClick={() => deleteResearch(r.id)}
                        className="p-2 text-slate-400 hover:text-red-600 transition-colors"
                        aria-label="Delete research"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {open && (
                    <div className="mt-3 pt-3 border-t border-slate-200 flex flex-col gap-3 text-sm">
                      <p className="text-slate-700">{r.summary}</p>
                      {r.key_takeaways?.length > 0 && (
                        <div>
                          <h4 className="font-bold text-[#0c3b24] text-xs mb-1">Key takeaways</h4>
                          <ul className="list-disc pl-5 text-slate-600 flex flex-col gap-1">
                            {r.key_takeaways.map((t, i) => <li key={i}>{t}</li>)}
                          </ul>
                        </div>
                      )}
                      {r.opportunities?.length > 0 && (
                        <div>
                          <h4 className="font-bold text-[#0c3b24] text-xs mb-1">Opportunities</h4>
                          <ul className="list-disc pl-5 text-slate-600 flex flex-col gap-1">
                            {r.opportunities.map((o, i) => <li key={i}>{o}</li>)}
                          </ul>
                        </div>
                      )}
                      {r.sources?.length > 0 && (
                        <div>
                          <h4 className="font-bold text-[#0c3b24] text-xs mb-1">Sources</h4>
                          <ul className="list-disc pl-5 text-xs text-slate-500 flex flex-col gap-1">
                            {r.sources.map((s, i) => <li key={i}>{s}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <h2 className="font-bold text-[#0c3b24] flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#1d9e56]" /> AI blog articles
          </h2>
          <button
            onClick={generatePost}
            disabled={generating}
            className="inline-flex items-center gap-2 rounded-full bg-[#0c3b24] text-[#1d9e56] font-bold px-5 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? "Writing article…" : "Generate new article"}
          </button>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          AI-written articles, researched from live web sources, saved as drafts every Monday at 7am. Publish the ones you like — published posts go live on the public blog at /blog.
        </p>

        {posts === null && (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-4 border-slate-200 border-t-[#1d9e56] rounded-full animate-spin"></div>
          </div>
        )}
        {posts !== null && posts.length === 0 && <p className="text-sm text-slate-500">No articles yet — generate the first one above.</p>}
        {posts !== null && posts.length > 0 && (
          <div className="flex flex-col gap-2">
            {posts.map((p) => (
              <div key={p.id} className="rounded-xl bg-[#f4f7f5] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-[#0c3b24] text-sm truncate">{p.title}</p>
                  <p className="text-xs text-slate-500">{p.status === "published" ? "Published" : "Draft"} · {p.generated_date}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.status === "published" && (
                    <Link to={`/blog/${p.slug}`} className="text-xs font-semibold text-[#1d9e56] hover:underline flex items-center gap-1">
                      View <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                  <button
                    onClick={() => togglePublish(p)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-[#0c3b24] hover:border-[#1d9e56] transition-colors"
                  >
                    {p.status === "published" ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {p.status === "published" ? "Unpublish" : "Publish"}
                  </button>
                  <CheckCircle2 className={`w-4 h-4 ${p.status === "published" ? "text-[#1d9e56]" : "text-slate-300"}`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}