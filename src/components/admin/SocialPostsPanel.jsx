import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Share2, Loader2, Copy, Check, Sparkles } from "lucide-react";

export default function SocialPostsPanel() {
  const [posts, setPosts] = useState(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState("");
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    try {
      const page = await base44.entities.SocialPostDraft.list({ sort: "-created_date", limit: 24 });
      setPosts(page.items || []);
    } catch {
      setPosts([]);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const generate = async () => {
    setBusy(true); setMessage("");
    try {
      const { data } = await base44.functions.invoke("socialPosts", { action: "generate" });
      setMessage(data?.already ? "This week's posts are already drafted." : "Three fresh posts drafted for this week.");
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e.message || "Could not generate posts.");
    }
    setBusy(false);
  };

  const copy = async (p) => {
    const text = p.caption + (p.hashtags ? "\n\n" + p.hashtags : "");
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(p.id);
    setTimeout(() => setCopied(""), 2000);
  };

  const share = async (p) => {
    const text = p.caption + (p.hashtags ? "\n\n" + p.hashtags : "");
    if (navigator.share) {
      try { await navigator.share({ title: p.title, text }); } catch {}
    } else {
      await copy(p);
    }
  };

  const markShared = async (p) => {
    await base44.entities.SocialPostDraft.update(p.id, { status: p.status === "shared" ? "draft" : "shared" });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center"><Share2 className="w-4 h-4" /></span>
            <div>
              <h3 className="font-bold text-[#102B2A]">Weekly AI social posts</h3>
              <p className="text-xs text-slate-500">Three promotional drafts every Monday, ready to copy and share</p>
            </div>
          </div>
          <button onClick={generate} disabled={busy} className="rounded-full bg-[#102B2A] text-[#187B65] font-bold px-5 py-2 text-sm disabled:opacity-50">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Sparkles className="w-4 h-4 inline mr-1" />Generate this week</>}
          </button>
        </div>
        {message && <div className="mt-3 rounded-xl border border-[#187B65]/30 bg-[#f4f7f5] px-3 py-2 text-xs font-semibold text-[#187B65]">{message}</div>}
      </div>

      {posts === null && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Loading drafts…</div>}

      {posts?.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">
          No drafts yet — hit "Generate this week" and the AI writes your first three posts.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        {(posts || []).map((p) => (
          <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-xs font-bold text-[#187B65] uppercase tracking-wider">{p.angle || "Promo"} · week of {p.week_of}</div>
                <div className="text-sm font-bold text-[#102B2A]">{p.title}</div>
              </div>
              <button onClick={() => markShared(p)} className={"shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold " + (p.status === "shared" ? "bg-[#187B65] text-white" : "bg-slate-100 text-slate-500")}>
                {p.status === "shared" ? "Shared" : "Mark shared"}
              </button>
            </div>
            <p className="mt-2 text-sm text-slate-600 whitespace-pre-line flex-1">{p.caption}</p>
            {p.hashtags && <p className="mt-2 text-xs font-semibold text-[#187B65]">{p.hashtags}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => copy(p)} className="flex-1 rounded-full border border-slate-200 font-bold px-3 py-2 text-xs text-[#102B2A] hover:border-[#187B65] transition-colors">
                {copied === p.id ? <><Check className="w-3.5 h-3.5 inline mr-1" />Copied</> : <><Copy className="w-3.5 h-3.5 inline mr-1" />Copy caption</>}
              </button>
              <button onClick={() => share(p)} className="rounded-full bg-[#187B65] text-white font-bold px-3 py-2 text-xs">
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}