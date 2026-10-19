import { useEffect, useState } from "react";
import { Sparkles, Copy, Check, Send, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { base44 } from "@/api/base44Client";

const FORMAT_BADGE = {
  "blog post": "bg-[#1d9e56]/15 text-[#0c3b24]",
  "site section": "bg-sky-100 text-sky-900",
  "social post": "bg-amber-100 text-amber-900",
};

export default function CoCreatorTab() {
  const [ideas, setIdeas] = useState([]);
  const [ideasLoading, setIdeasLoading] = useState(false);
  const [ideasError, setIdeasError] = useState("");
  const [drafting, setDrafting] = useState(null); // topic currently being drafted
  const [customTopic, setCustomTopic] = useState("");
  const [drafts, setDrafts] = useState([]);
  const [draftsLoading, setDraftsLoading] = useState(true);
  const [publishing, setPublishing] = useState(null);
  const [expanded, setExpanded] = useState({});
  const [copied, setCopied] = useState("");

  const loadDrafts = async () => {
    setDraftsLoading(true);
    const { items } = await base44.entities.CoCreatorDraft.filter({}, { sort: "-created_date", limit: 20 });
    setDrafts(items || []);
    setDraftsLoading(false);
  };

  useEffect(() => {
    loadDrafts();
  }, []);

  const getIdeas = async () => {
    setIdeasLoading(true);
    setIdeasError("");
    try {
      const res = await base44.functions.invoke("coCreator", { action: "ideas" });
      setIdeas(res.data.ideas || []);
    } catch (e) {
      setIdeasError(e?.response?.data?.error || e.message || "Could not load ideas");
    }
    setIdeasLoading(false);
  };

  const draft = async (topic, idea = "") => {
    if (!topic || !topic.trim() || drafting) return;
    setDrafting(topic.trim());
    try {
      const res = await base44.functions.invoke("coCreator", { action: "draft", topic: topic.trim(), idea });
      if (res.data?.draft) {
        setDrafts((d) => [res.data.draft, ...d]);
        setIdeas((list) => list.filter((i) => i.title !== topic));
      }
    } catch (e) {
      alert(e?.response?.data?.error || e.message || "Draft failed");
    }
    setDrafting(null);
  };

  const publish = async (d) => {
    if (publishing) return;
    setPublishing(d.id);
    try {
      await base44.functions.invoke("coCreator", { action: "publish", id: d.id });
      setDrafts((list) => list.map((x) => (x.id === d.id ? { ...x, status: "published" } : x)));
    } catch (e) {
      alert(e?.response?.data?.error || e.message || "Publish failed");
    }
    setPublishing(null);
  };

  const copy = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      setTimeout(() => setCopied(""), 1500);
    } catch {
      // clipboard unavailable
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-100 bg-[#f4f7f5] p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-[#0c3b24] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#1d9e56]" /> Ideas from your customers
            </h2>
            <p className="text-sm text-slate-500">Drawn from receptionist chats, web-wide service hunts and Google keywords.</p>
          </div>
          <button
            onClick={getIdeas}
            disabled={ideasLoading}
            className="rounded-full bg-[#0c3b24] text-[#1d9e56] font-bold px-5 py-2.5 text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {ideasLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : ideas.length ? <RefreshCw className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            {ideas.length ? "New ideas" : "Get ideas"}
          </button>
        </div>
        {ideasError && <p className="text-sm text-red-600 mb-3">{ideasError}</p>}
        {ideas.length > 0 && (
          <div className="grid gap-3 md:grid-cols-2">
            {ideas.map((idea, i) => (
              <div key={i} className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <span className="text-sm font-bold text-[#0c3b24]">{idea.title}</span>
                  <span className={"shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold " + (FORMAT_BADGE[idea.format?.toLowerCase()] || "bg-slate-100 text-slate-700")}>
                    {idea.format}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mb-1">{idea.angle}</p>
                <p className="text-xs text-slate-400 mb-3">{idea.why}</p>
                <button
                  onClick={() => draft(idea.title, idea.angle)}
                  disabled={!!drafting}
                  className="mt-auto self-start rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-4 py-1.5 text-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {drafting === idea.title ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  Draft it
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6">
        <label className="block text-sm font-bold text-[#0c3b24] mb-2">Or pick your own topic</label>
        <div className="flex gap-2">
          <input
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            placeholder="e.g. How to clear out a garage before winter"
            className="input flex-1"
          />
          <button
            onClick={() => draft(customTopic)}
            disabled={!customTopic.trim() || !!drafting}
            className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-5 py-2.5 text-sm disabled:opacity-50 flex items-center gap-2"
          >
            {drafting === customTopic.trim() ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Draft
          </button>
        </div>
      </div>

      <div className="rounded-3xl border border-slate-100 bg-white p-6">
        <h2 className="text-lg font-bold text-[#0c3b24] mb-4">Drafts</h2>
        {draftsLoading ? (
          <div className="flex items-center gap-2 text-sm text-slate-500 py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading drafts…
          </div>
        ) : drafts.length === 0 ? (
          <p className="text-sm text-slate-500 py-6">No drafts yet — get ideas above or enter a topic.</p>
        ) : (
          <div className="space-y-4">
            {drafts.map((d) => {
              const open = expanded[d.id];
              const isPub = d.status === "published";
              return (
                <div key={d.id} className="rounded-2xl border border-slate-100 overflow-hidden">
                  <button onClick={() => setExpanded((e) => ({ ...e, [d.id]: !open }))} className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 transition-colors">
                    <div className="min-w-0">
                      <div className="font-bold text-[#0c3b24] text-sm truncate">{d.blog_title}</div>
                      <div className="text-xs text-slate-400">Topic: {d.topic}</div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={"rounded-full px-2.5 py-0.5 text-[11px] font-bold " + (isPub ? "bg-[#1d9e56]/15 text-[#0c3b24]" : "bg-slate-100 text-slate-600")}>
                        {isPub ? "Published" : "Draft"}
                      </span>
                      {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                    </div>
                  </button>
                  {open && (
                    <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-4">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Homepage section copy</span>
                          <button onClick={() => copy(d.id + "-site", `${d.site_headline}\n${d.site_body}\n${d.site_cta}`)} className="text-xs font-semibold text-[#1d9e56] hover:underline flex items-center gap-1">
                            {copied === d.id + "-site" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy
                          </button>
                        </div>
                        <p className="text-sm font-bold text-[#0c3b24]">{d.site_headline}</p>
                        <p className="text-sm text-slate-600">{d.site_body}</p>
                        <p className="text-xs text-slate-400 mt-1">Button: {d.site_cta}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Facebook caption</span>
                          <button onClick={() => copy(d.id + "-social", d.social_caption)} className="text-xs font-semibold text-[#1d9e56] hover:underline flex items-center gap-1">
                            {copied === d.id + "-social" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} Copy
                          </button>
                        </div>
                        <p className="text-sm text-slate-600 whitespace-pre-line">{d.social_caption}</p>
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold uppercase tracking-wide text-slate-500">Blog article (saved to the blog as a draft)</span>
                          {isPub && d.blog_slug && (
                            <a href={`/blog/${d.blog_slug}`} className="text-xs font-semibold text-[#1d9e56] hover:underline">View on blog</a>
                          )}
                        </div>
                        <div className="max-h-48 overflow-y-auto rounded-xl bg-slate-50 p-3 text-sm text-slate-600 whitespace-pre-line">{d.blog_body || "Full text saved in the blog draft."}</div>
                      </div>
                      {!isPub && (
                        <button onClick={() => publish(d)} disabled={publishing === d.id} className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-5 py-2 text-sm disabled:opacity-50 flex items-center gap-2">
                          {publishing === d.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                          Publish blog post
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}