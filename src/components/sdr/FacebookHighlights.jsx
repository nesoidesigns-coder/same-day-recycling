import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Facebook, ThumbsUp, MessageCircle, Share2 } from "lucide-react";

export default function FacebookHighlights() {
  const [data, setData] = useState(null);

  useEffect(() => {
    let active = true;
    base44.functions
      .invoke("facebookHighlights", {})
      .then((res) => {
        if (active && res?.data?.posts?.length) setData(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  if (!data) return null;

  return (
    <div className="w-full rounded-3xl border border-slate-100 bg-[#f4f7f5] p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-xl bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center">
            <Facebook className="w-4 h-4" />
          </span>
          <div>
            <p className="text-sm font-bold text-[#0c3b24] leading-tight">Latest posts</p>
            {data.followers > 0 && (
              <p className="text-xs text-slate-500">
                {Number(data.followers).toLocaleString()} followers
              </p>
            )}
          </div>
        </div>
        <span className="rounded-full bg-[#1d9e56]/15 px-2.5 py-1 text-[11px] font-bold text-[#0c3b24]">
          Live
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {data.posts.map((post) => (
          <a
            key={post.id}
            href={`https://www.facebook.com/${post.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-white border border-slate-100 p-4 hover:border-[#1d9e56]/40 transition-colors"
          >
            <p className="text-sm text-slate-700 line-clamp-3 whitespace-pre-line">{post.message}</p>
            <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5 text-[#1d9e56]" /> {post.likes}
              </span>
              <span className="inline-flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5 text-[#1d9e56]" /> {post.comments}
              </span>
              <span className="inline-flex items-center gap-1">
                <Share2 className="w-3.5 h-3.5 text-[#1d9e56]" /> {post.shares}
              </span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}