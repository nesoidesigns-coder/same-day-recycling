import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Radar, TriangleAlert, Search, ChevronDown } from 'lucide-react';
import DiscoveryCard from '@/components/community/DiscoveryCard';
import DiscoverySearch from '@/components/community/DiscoverySearch';
import { PROVINCES, channelLabel } from '@/lib/communityShared';
import { SERVICE_CATEGORIES, CLASSIFICATIONS } from '@/lib/discoveryShared';
import { trackGA } from '@/lib/communityAnalytics';

// Primary community screen: real sourced service requests first, real member
// discussions next. Generic AI educational posts never appear here — they live
// in the Knowledge Library tab. Advanced filters stay in a collapsible panel.
const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'requests', label: 'Service Requests' },
  { id: 'discussions', label: 'Discussions' },
];

export default function DiscoveryFeed({ me, onGoOpportunities, onGoDiscussions }) {
  const [view, setView] = useState('all');
  const [province, setProvince] = useState('all');
  const [category, setCategory] = useState('all');
  const [classification, setClassification] = useState('all');
  const [days, setDays] = useState('30');
  const [savedOnly, setSavedOnly] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    trackGA('community_discovery_view', {});
  }, []);

  const opportunities = useQuery({
    queryKey: ['discoveryOpportunities', province, category, classification, days],
    enabled: view !== 'discussions',
    queryFn: async () => {
      const q = { status: 'open', source_status: 'available' };
      if (province !== 'all') q.province_code = province;
      if (category !== 'all') q.service_category = category;
      if (classification !== 'all') q.classification = classification;
      q.posted_at = { $gte: new Date(Date.now() - Number(days) * 86400000).toISOString() };
      return (await base44.entities.PublicOpportunity.filter(q, { sort: '-posted_at', limit: 60 })).items || [];
    },
  });

  const discussions = useQuery({
    queryKey: ['discoveryDiscussions', province],
    enabled: view !== 'requests',
    queryFn: async () => {
      const q = { status: 'published', ai_generated: { $ne: true } };
      if (province !== 'all') q.province = { $in: [province, 'national'] };
      return (await base44.entities.CommunityPost.filter(q, { sort: '-created_date', limit: 40 })).items || [];
    },
  });

  const saved = useQuery({
    queryKey: ['discoverySaved', me?.email],
    enabled: !!me,
    queryFn: async () => (await base44.entities.CommunitySavedOpportunity.filter({ owner_email: me.email }, { limit: 200 })).items || [],
  });

  const oppRows = useMemo(() => {
    if (savedOnly) {
      const ids = new Set((saved.data || []).map((r) => r.opportunity_id));
      return (opportunities.data || []).filter((o) => ids.has(o.id));
    }
    return opportunities.data || [];
  }, [savedOnly, saved.data, opportunities.data]);

  const discRows = useMemo(() => (discussions.data || []), [discussions.data]);

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    const match = (r) => !s || (r.title || '').toLowerCase().includes(s) || (r.body || r.excerpt || '').toLowerCase().includes(s);
    return { opp: oppRows.filter(match), disc: discRows.filter(match) };
  }, [oppRows, discRows, search]);

  const savedByOpp = {};
  for (const r of saved.data || []) savedByOpp[r.opportunity_id] = r;

  if (searchOpen) return <DiscoverySearch me={me} onExit={() => setSearchOpen(false)} />;

  const loading = (view !== 'discussions' && opportunities.isLoading) || (view !== 'requests' && discussions.isLoading);
  const error = (view !== 'discussions' && opportunities.isError) || (view !== 'requests' && discussions.isError);
  const empty = !loading && !error && visible.opp.length === 0 && visible.disc.length === 0;

  return (
    <div className="space-y-3" id="discovery">
      {/* Search + location: the two controls members use first */}
      <div className="grid sm:grid-cols-[1fr_190px] gap-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9 py-2.5" placeholder="Search requests and discussions…" aria-label="Search the feed" />
        </div>
        <select value={province} onChange={(e) => setProvince(e.target.value)} className="input py-2.5" aria-label="Location">
          <option value="all">All Canada</option>
          {PROVINCES.filter((p) => p.id !== 'national').map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      {/* Three primary filters + AI search entry */}
      <div className="flex gap-2 items-center overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Feed type">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => { setView(f.id); trackGA('community_discovery_filter', { view: f.id }); }}
            role="tab"
            aria-selected={view === f.id}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${view === f.id ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}
          >
            {f.label}
          </button>
        ))}
        <button onClick={() => { trackGA('community_discovery_search_open', {}); setSearchOpen(true); }} className="ml-auto shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#102B2A] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#0a3020] transition-colors">
          <Radar className="w-3.5 h-3.5" /> Ask AI
        </button>
      </div>

      {/* Advanced personalization and filters: collapsible, out of the way */}
      <details className="rounded-2xl border border-slate-200 bg-white">
        <summary className="flex cursor-pointer items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-600 select-none">
          More filters <ChevronDown className="w-3.5 h-3.5" />
        </summary>
        <div className="grid grid-cols-2 gap-2 px-4 pb-4">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input py-2 text-xs" aria-label="Service category (service requests)">
            <option value="all">All services</option>
            {SERVICE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={classification} onChange={(e) => setClassification(e.target.value)} className="input py-2 text-xs" aria-label="Opportunity type (service requests)">
            <option value="all">All opportunity types</option>
            {CLASSIFICATIONS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <select value={days} onChange={(e) => setDays(e.target.value)} className="input py-2 text-xs" aria-label="Date posted (service requests)">
            <option value="7">Last 7 days</option>
            <option value="14">Last 14 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
          {me && (
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 px-1">
              <input type="checkbox" checked={savedOnly} onChange={() => setSavedOnly((s) => !s)} className="accent-[#187B65] w-4 h-4" />
              Saved only ({(saved.data || []).length})
            </label>
          )}
        </div>
      </details>

      {loading && (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading the feed…</div>
      )}
      {error && (
        <p className="flex items-center gap-2 py-6 text-sm text-red-600" role="alert"><TriangleAlert className="w-4 h-4" /> The feed could not be loaded right now.</p>
      )}

      {!loading && !error && (view === 'all' || view === 'requests') && visible.opp.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#187B65]">Sourced service requests</p>
          {visible.opp.map((item) => <DiscoveryCard key={item.id} item={item} me={me} savedRow={savedByOpp[item.id]} />)}
        </div>
      )}

      {!loading && !error && (view === 'all' || view === 'discussions') && visible.disc.length > 0 && (
        <div className="space-y-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Member discussions</p>
          {visible.disc.map((p) => <DiscussionCard key={p.id} post={p} />)}
        </div>
      )}

      {empty && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center">
          <p className="text-sm font-bold text-[#102B2A]">{savedOnly ? 'No saved opportunities yet.' : 'No verified public requests match these filters yet.'}</p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            The discovery engine only shows real public posts it has verified — it never invents demand. New sources are checked daily; try broader filters, or start something:
          </p>
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button onClick={onGoDiscussions} className="w-full sm:w-auto rounded-full border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors">Start a discussion</button>
            <button onClick={onGoOpportunities} className="w-full sm:w-auto rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white hover:bg-[#125C4E] transition-colors">Post on the Opportunity Board</button>
          </div>
        </div>
      )}

      <p className="rounded-2xl border border-slate-100 bg-white p-3.5 text-[11px] text-slate-500 leading-relaxed">
        About this feed: only publicly accessible posts from authorized sources are indexed, always with the original title, source, link and date. Discovered posts are a sample of indexed public conversations — they do not represent total Canadian demand for these services. Personal messages, private groups and restricted content are never accessed, and no one here has asked to be contacted by you. AI educational guides are in the Knowledge Library tab.
      </p>
    </div>
  );
}

// Compact member-discussion card. Opens the full thread.
function DiscussionCard({ post }) {
  return (
    <button
      onClick={() => window.location.assign(`/community?post=${post.id}`)}
      className="block w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-left hover:border-[#187B65]/50 transition-colors"
    >
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <span className="rounded-full bg-[#f4f7f5] px-2 py-0.5 text-[#187B65]">{channelLabel(post.channel)}</span>
        {post.pinned && <span className="text-[#187B65]">Pinned</span>}
      </div>
      <h3 className="mt-1.5 text-sm font-bold text-[#102B2A] leading-snug break-words">{post.title}</h3>
      <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">{post.body}</p>
      <p className="mt-1.5 text-[11px] text-slate-500">{post.author_name || 'Member'} · {new Date(post.created_date).toLocaleDateString('en-CA')}</p>
    </button>
  );
}