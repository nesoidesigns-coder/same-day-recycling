import { useState, useEffect } from "react";
import { Loader2, ThumbsUp, RefreshCw, Eye, MousePointerClick } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";

export default function EngagementSection() {
  const [posts, setPosts] = useState(null);
  const [line, setLine] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    try {
      const page = await base44.entities.FacebookEngagement.filter({}, { sort: "-views", limit: 10 });
      setPosts(page.items || []);
    } catch {
      setPosts([]);
    }
  };

  useEffect(() => { load(); }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("facebookInsights", { action: "engagement" });
      setLine(res.data?.engagement_line || "");
      await load();
    } catch {}
    setLoading(false);
  };

  return (
    <div className="rounded-2xl border border-slate-100 p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3">
        <h2 className="font-bold text-[#0c3b24] flex items-center gap-2">
          <ThumbsUp className="w-4 h-4 text-[#1d9e56]" /> Post engagement tracker
        </h2>
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading} className="border-slate-200 text-[#0c3b24]">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />} Refresh
        </Button>
      </div>
      <p className="text-sm text-slate-500 mb-3">
        The AI pulls live views, engagement and follower data from your page daily (also included in the daily digest email) so you know which posts work. Meta does not let apps read comments, so tracking is post-level.
      </p>
      {line && <p className="text-sm font-semibold text-[#0c3b24] mb-3">{line}</p>}
      {posts === null && (
        <div className="flex items-center justify-center py-6">
          <div className="w-6 h-6 border-4 border-slate-200 border-t-[#1d9e56] rounded-full animate-spin"></div>
        </div>
      )}
      {posts !== null && posts.length === 0 && (
        <p className="text-sm text-slate-500">No posts tracked yet. Click Refresh to pull your latest posts.</p>
      )}
      {posts !== null && posts.length > 0 && (
        <div className="flex flex-col gap-2">
          {posts.map((p) => (
            <div key={p.id} className="rounded-xl bg-[#f4f7f5] px-4 py-3 flex items-center justify-between gap-3">
              <p className="text-sm text-slate-700 truncate">{p.post_excerpt}</p>
              <span className="flex items-center gap-3 shrink-0">
                <span className="flex items-center gap-1.5 text-sm font-bold text-[#0c3b24]">
                  <Eye className="w-4 h-4 text-[#1d9e56]" /> {Number(p.views || 0).toLocaleString()}
                </span>
                <span className="flex items-center gap-1.5 text-sm font-bold text-[#0c3b24]">
                  <MousePointerClick className="w-4 h-4 text-[#1d9e56]" /> {Number(p.clicks || 0).toLocaleString()}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}