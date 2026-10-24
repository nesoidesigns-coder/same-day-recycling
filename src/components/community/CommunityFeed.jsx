import { useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, TriangleAlert, Share2, Check } from 'lucide-react';
import PostComposer from '@/components/community/PostComposer';
import PostCard from '@/components/community/PostCard';
import PostThread from '@/components/community/PostThread';
import InterestBar from '@/components/community/InterestBar';
import { CHANNELS, PROVINCES, INTERESTS } from '@/lib/communityShared';

const readPrefs = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};

export default function CommunityFeed({ me, profileName }) {
  const [channel, setChannel] = useState('all');
  const [search, setSearch] = useState('');
  const [interests, setInterests] = useState(() => readPrefs('communityInterests', []));
  const [region, setRegion] = useState(() => readPrefs('communityRegion', 'national'));
  const [savedOnly, setSavedOnly] = useState(false);
  const savedKey = `communitySaved:${me?.email || 'guest'}`;
  const [saved, setSaved] = useState(() => new Set(readPrefs(savedKey, [])));
  const [copiedId, setCopiedId] = useState(null);
  const [openId, setOpenId] = useState(() => new URLSearchParams(window.location.search).get('post'));
  const queryClient = useQueryClient();

  const toggleInterest = (id) => {
    const next = interests.includes(id) ? interests.filter((i) => i !== id) : [...interests, id];
    setInterests(next);
    localStorage.setItem('communityInterests', JSON.stringify(next));
  };

  const toggleSaved = (id) => {
    const next = new Set(saved);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSaved(next);
    localStorage.setItem(savedKey, JSON.stringify([...next]));
  };

  const share = async (post) => {
    const url = `${window.location.origin}/community?post=${post.id}`;
    try {
      if (navigator.share) await navigator.share({ title: post.title, url });
      else { await navigator.clipboard.writeText(url); setCopiedId(post.id); setTimeout(() => setCopiedId(null), 2000); }
    } catch { /* user cancelled */ }
  };

  const posts = useQuery({
    queryKey: ['communityPosts', channel, region],
    queryFn: async () => {
      const q = { status: 'published' };
      if (channel !== 'all') q.channel = channel;
      if (channel === 'provincial' && region !== 'national') q.province = region;
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
    enabled: !!me,
    queryFn: async () => (await base44.entities.CommunityReaction.filter({ target_type: 'post' }, { limit: 200 })).items || [],
  });

  const interestChannels = INTERESTS.filter((i) => interests.includes(i.id)).flatMap((i) => i.channels);

  const visible = useMemo(() => {
    let list = posts.data || [];
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((p) => (p.title || '').toLowerCase().includes(s) || (p.body || '').toLowerCase().includes(s));
    }
    if (savedOnly) list = list.filter((p) => saved.has(p.id));
    if (channel === 'all') {
      if (interestChannels.length) list = list.filter((p) => interestChannels.includes(p.channel));
      if (region !== 'national') list = list.filter((p) => p.province === region || p.province === 'national');
      return [...list].sort((a, b) => Number(b.pinned) - Number(a.pinned));
    }
    return list;
  }, [posts.data, search, channel, savedOnly, saved, region, interests]);

  const trending = useMemo(() => {
    const counts = replyCounts.data || {};
    return [...(posts.data || [])].sort((a, b) => (counts[b.id] || 0) - (counts[a.id] || 0)).slice(0, 3).filter((p) => (counts[p.id] || 0) > 0);
  }, [posts.data, replyCounts.data]);

  const openPost = (posts.data || []).find((p) => p.id === openId);

  const openThread = (id) => {
    setOpenId(id);
    window.history.replaceState(null, '', `/community?post=${id}`);
  };
  const closeThread = () => {
    setOpenId(null);
    window.history.replaceState(null, '', '/community');
  };

  const vote = async (post) => {
    if (!me) return;
    const mine = (myVotes.data || []).find((r) => r.target_id === post.id && r.owner_email === me.email);
    if (mine) await base44.entities.CommunityReaction.delete(mine.id);
    else await base44.entities.CommunityReaction.create({ target_type: 'post', target_id: post.id, owner_email: me.email });
    queryClient.invalidateQueries({ queryKey: ['communityHelpfulCounts'] });
    queryClient.invalidateQueries({ queryKey: ['communityMyVotes'] });
  };

  const report = async (post) => {
    if (!me) return;
    await base44.entities.CommunityReport.create({ target_type: 'post', target_id: post.id, reason: 'other', details: 'Reported from the feed.' });
  };

  if (openPost) {
    return <PostThread post={openPost} me={me} profileName={profileName} onBack={closeThread} />;
  }

  return (
    <div className="space-y-4" id="community-feed">
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Channels">
        <button onClick={() => setChannel('all')} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${channel === 'all' ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}>All channels</button>
        {CHANNELS.map((c) => (
          <button key={c.id} onClick={() => setChannel(c.id)} title={c.desc} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition-colors ${channel === c.id ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}>{c.label}</button>
        ))}
      </div>

      <InterestBar
        interests={interests}
        onToggleInterest={toggleInterest}
        region={region}
        onRegion={setRegion}
        savedOnly={savedOnly}
        onToggleSaved={() => setSavedOnly((s) => !s)}
        savedCount={saved.size}
      />

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" placeholder="Search conversations…" aria-label="Search conversations" />
        </div>
        {channel === 'provincial' && (
          <select value={provinceValue(region)} onChange={(e) => setRegion(e.target.value)} className="input sm:w-52" aria-label="Filter by region">
            {PROVINCES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        )}
      </div>

      {trending.length > 0 && channel === 'all' && !search && !savedOnly && (
        <div className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#187B65]">Trending questions</h3>
          <div className="mt-2 space-y-1.5">
            {trending.map((t) => (
              <button key={t.id} onClick={() => openThread(t.id)} className="block w-full text-left text-sm font-semibold text-[#102B2A] hover:text-[#187B65] transition-colors">
                {t.title} <span className="font-normal text-slate-500">· {(replyCounts.data || {})[t.id] || 0} replies</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {me
        ? <div id="composer-anchor"><PostComposer me={me} profileName={profileName} /></div>
        : (
          <div className="rounded-2xl border border-[#187B65]/30 bg-[#f4f7f5] p-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold text-[#102B2A]">Reading as a guest. Join free to start discussions, reply and vote.</p>
            <a href="/register?returnTo=/community" className="rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white hover:bg-[#125C4E] transition-colors">Create free profile</a>
          </div>
        )}

      {posts.isPending && <div className="flex items-center gap-2 py-10 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading discussions…</div>}
      {posts.isError && <p className="flex items-center gap-2 py-8 text-sm text-red-600" role="alert"><TriangleAlert className="w-4 h-4" /> Discussions could not be loaded right now.</p>}
      {posts.data && visible.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          {savedOnly
            ? <><p className="text-sm font-bold text-[#102B2A]">Nothing saved yet.</p><p className="mt-1 text-xs text-slate-500">Bookmark posts you want to come back to — they stay on this device.</p></>
            : <><p className="text-sm font-bold text-[#102B2A]">No discussions match your filters yet.</p><p className="mt-1 text-xs text-slate-500">Try clearing interests or being the first to start one.</p></>}
        </div>
      )}
      <div className="space-y-3">
        {visible.map((p) => (
          <PostCard
            key={p.id}
            post={p}
            replyCount={(replyCounts.data || {})[p.id]}
            helpfulCount={(helpfulCounts.data || {})[p.id]}
            mineVoted={(myVotes.data || []).some((r) => r.target_id === p.id && r.owner_email === me?.email)}
            saved={saved.has(p.id)}
            copied={copiedId === p.id}
            onBookmark={() => toggleSaved(p.id)}
            onShare={() => share(p)}
            onVote={me ? () => vote(p) : undefined}
            onOpen={() => openThread(p.id)}
            onReport={me ? () => report(p) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

const provinceValue = (region) => (PROVINCES.some((p) => p.id === region) ? region : 'national');