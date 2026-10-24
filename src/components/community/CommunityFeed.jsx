import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, TriangleAlert } from 'lucide-react';
import PostComposer from '@/components/community/PostComposer';
import PostCard from '@/components/community/PostCard';
import PostThread from '@/components/community/PostThread';
import { CHANNELS, PROVINCES } from '@/lib/communityShared';

export default function CommunityFeed({ me, profileName }) {
  void profileName;
  const [channel, setChannel] = useState('all');
  const [province, setProvince] = useState('national');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);
  const queryClient = useQueryClient();

  const posts = useQuery({
    queryKey: ['communityPosts', channel, province],
    queryFn: async () => {
      const q = { status: 'published' };
      if (channel !== 'all') q.channel = channel;
      if (channel === 'provincial' && province !== 'national') q.province = province;
      return (await base44.entities.CommunityPost.filter(q, { sort: '-created_date', limit: 60 })).items || [];
    },
  });

  const replyCounts = useQuery({
    queryKey: ['communityCommentCounts'],
    queryFn: async () => {
      const rows = await base44.entities.CommunityComment.aggregate({ query: { status: 'published' }, groupBy: 'post_id' });
      const map = {};
      for (const r of (rows?.rows || rows || [])) map[r.post_id] = r.count;
      return map;
    },
  });

  const helpfulCounts = useQuery({
    queryKey: ['communityHelpfulCounts'],
    queryFn: async () => {
      const rows = await base44.entities.CommunityReaction.aggregate({ query: { target_type: 'post' }, groupBy: 'target_id' });
      const map = {};
      for (const r of (rows?.rows || rows || [])) map[r.target_id] = r.count;
      return map;
    },
  });

  const myVotes = useQuery({
    queryKey: ['communityMyVotes'],
    queryFn: async () => (await base44.entities.CommunityReaction.filter({ target_type: 'post' }, { limit: 200 })).items || [],
  });

  const visible = useMemo(() => {
    let list = posts.data || [];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((p) => (p.title || '').toLowerCase().includes(s) || (p.body || '').toLowerCase().includes(s));
    }
    if (channel === 'all') {
      return list.sort((a, b) => Number(b.pinned) - Number(a.pinned));
    }
    return list;
  }, [posts.data, search, channel]);

  const trending = useMemo(() => {
    const counts = replyCounts.data || {};
    return [...(posts.data || [])].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0)).slice(0, 3).filter((p) => (counts[p.id] || 0) > 0);
  }, [posts.data, replyCounts.data]);

  const openPost = (posts.data || []).find((p) => p.id === openId);

  const vote = async (post) => {
    const mine = (myVotes.data || []).find((r) => r.target_id === post.id && r.owner_email === me.email);
    if (mine) await base44.entities.CommunityReaction.delete(mine.id);
    else await base44.entities.CommunityReaction.create({ target_type: 'post', target_id: post.id, owner_email: me.email });
    queryClient.invalidateQueries({ queryKey: ['communityHelpfulCounts'] });
    queryClient.invalidateQueries({ queryKey: ['communityMyVotes'] });
  };

  const report = async (post) => {
    await base44.entities.CommunityReport.create({ target_type: 'post', target_id: post.id, reason: 'other', details: 'Reported from the feed.' });
  };

  if (openPost) {
    return <PostThread post={openPost} me={me} profileName={profileName} onBack={() => setOpenId(null)} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Channels">
        <button onClick={() => setChannel('all')} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${channel === 'all' ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}>All channels</button>
        {CHANNELS.map((c) => (
          <button key={c.id} onClick={() => setChannel(c.id)} title={c.desc} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${channel === c.id ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}>{c.label}</button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" placeholder="Search conversations…" aria-label="Search conversations" />
        </div>
        {channel === 'provincial' && (
          <select value={province} onChange={(e) => setProvince(e.target.value)} className="input sm:w-52" aria-label="Filter by region">
            {PROVINCES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        )}
      </div>

      {trending.length > 0 && channel === 'all' && !search && (
        <div className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#187B65]">Trending questions</h3>
          <div className="mt-2 space-y-1.5">
            {trending.map((t) => (
              <button key={t.id} onClick={() => setOpenId(t.id)} className="block w-full text-left text-sm font-semibold text-[#102B2A] hover:text-[#187B65] transition-colors">
                {t.title} <span className="font-normal text-slate-500">· {(replyCounts.data || {})[t.id] || 0} replies</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <PostComposer me={me} profileName={profileName} />

      {posts.isPending && <div className="flex items-center gap-2 py-10 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading discussions…</div>}
      {posts.isError && <p className="flex items-center gap-2 py-8 text-sm text-red-600" role="alert"><TriangleAlert className="w-4 h-4" /> Discussions could not be loaded right now.</p>}
      {posts.data && visible.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-bold text-[#102B2A]">No discussions here yet.</p>
          <p className="mt-1 text-xs text-slate-500">Be the first to start one — real questions and real answers are what make this community useful.</p>
        </div>
      )}
      <div className="space-y-3">
        {visible.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            replyCount={(replyCounts.data || {})[p.id]}
            helpfulCount={(helpfulCounts.data || {})[p.id]}
            mineVoted={(myVotes.data || []).some((r) => r.target_id === p.id && r.owner_email === me.email)}
            onVote={() => vote(p)}
            onOpen={() => setOpenId(p.id)}
            onReport={() => report(p)}
          />
        ))}
      </div>
    </div>
  );
}