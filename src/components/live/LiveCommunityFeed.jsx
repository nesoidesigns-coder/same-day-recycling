import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Loader2, MessageCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Live public community request feed for the LIVE Centre: the latest
// published community posts. Only public fields ever render — no names,
// contact details or private conversations.
export default function LiveCommunityFeed() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.entities.CommunityPost.filter({ status: "published" }, { sort: "-created_date", limit: 6 })
      .then((res) => alive && setPosts(Array.isArray(res) ? res : res?.items || []))
      .catch(() => alive && setError(true));
    return () => { alive = false; };
  }, []);

  if (error) {
    return <p className="text-sm text-cine-muted">The community feed is unavailable right now. You can still visit the community directly.</p>;
  }
  if (!posts) {
    return (
      <div className="flex items-center gap-2 text-sm text-cine-muted">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading community activity…
      </div>
    );
  }
  if (!posts.length) {
    return (
      <p className="rounded-xl bg-cine-bg/50 border border-cine-line/40 px-4 py-3 text-sm text-cine-muted">
        Collecting community activity — no published posts yet. Be the first to start a conversation.
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-2.5">
        {posts.slice(0, 5).map((p) => (
          <li key={p.id} className="rounded-xl bg-cine-bg/60 border border-cine-line/40 px-4 py-3">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-sm font-bold text-cine-ink">{p.title}</span>
              <span className="font-plex text-[10px] font-bold uppercase tracking-[0.16em] text-cine-muted">{p.province === "national" ? "National" : p.province} · {String(p.created_date || "").slice(0, 10)}</span>
            </div>
            {p.body && <p className="mt-1 text-xs text-cine-muted leading-relaxed">{p.body.slice(0, 160)}{p.body.length > 160 ? "…" : ""}</p>}
          </li>
        ))}
      </ul>
      <Link to="/community" className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-cine-cyan hover:underline">
        <MessageCircle className="w-4 h-4" /> Ask your own question or submit a request <ArrowRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}