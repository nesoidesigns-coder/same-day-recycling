import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Radar, TriangleAlert, Bookmark, MessageSquarePlus, Briefcase, Compass, Search } from 'lucide-react';
import DiscoveryCard from '@/components/community/DiscoveryCard';
import DiscoverySearch from '@/components/community/DiscoverySearch';
import { PROVINCES } from '@/lib/communityShared';
import { SERVICE_CATEGORIES, CLASSIFICATIONS } from '@/lib/discoveryShared';
import { trackGA } from '@/lib/communityAnalytics';

const PATHS = [
  { icon: MessageSquarePlus, label: 'I need a service', desc: 'Post a request and discover providers', onClick: 'discussions' },
  { icon: Briefcase, label: 'I provide services', desc: 'Explore opportunities and post listings', onClick: 'opportunities' },
  { icon: Compass, label: "I'm here to explore", desc: 'Read, learn and participate free', onClick: null },
];

export default function DiscoveryFeed({ me, onGoOpportunities, onGoDiscussions }) {
  const [province, setProvince] = useState('all');
  const [category, setCategory] = useState('all');
  const [classification, setClassification] = useState('all');
  const [days, setDays] = useState('30');
  const [savedOnly, setSavedOnly] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    trackGA('community_discovery_view', {});
  }, []);

  const opportunities = useQuery({
    queryKey: ['discoveryOpportunities', province, category, classification, days],
    queryFn: async () => {
      const q = { status: 'open', source_status: 'available' };
      if (province !== 'all') q.province_code = province;
      if (category !== 'all') q.service_category = category;
      if (classification !== 'all') q.classification = classification;
      q.posted_at = { $gte: new Date(Date.now() - Number(days) * 86400000).toISOString() };
      return (await base44.entities.PublicOpportunity.filter(q, { sort: '-posted_at', limit: 60 })).items || [];
    },
  });

  const saved = useQuery({
    queryKey: ['discoverySaved', me?.email],
    enabled: !!me,
    queryFn: async () => (await base44.entities.CommunitySavedOpportunity.filter({ owner_email: me.email }, { limit: 200 })).items || [],
  });

  const savedOpps = useQuery({
    queryKey: ['discoverySavedOpps', (saved.data || []).map((r) => r.opportunity_id).join(',')],
    enabled: !!me && savedOnly && (saved.data || []).length > 0,
    queryFn: async () => (await base44.entities.PublicOpportunity.filter({ id: { $in: (saved.data || []).map((r) => r.opportunity_id) } }, { limit: 200 })).items || [],
  });

  if (searchOpen) return <DiscoverySearch me={me} onExit={() => setSearchOpen(false)} />;

  const savedByOpp = {};
  for (const r of saved.data || []) savedByOpp[r.opportunity_id] = r;
  const rows = savedOnly ? (savedOpps.data || (saved.data || []).length === 0 ? [] : []) : (opportunities.data || []);
  const count = rows.length;

  return (
    <div className="space-y-3 sm:space-y-4" id="discovery">
      {/* Three inclusive paths */}
      <div className="grid sm:grid-cols-3 gap-2">
        {PATHS.map((p) => (
          <button
            key={p.label}
            onClick={() => (p.onClick === 'discussions' ? onGoDiscussions() : p.onClick === 'opportunities' ? onGoOpportunities() : window.scrollTo({ top: 0, behavior: 'smooth' }))}
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-[#187B65]/50 transition-colors"
          >
            <p.icon className="w-4 h-4 text-[#187B65]" />
            <p className="mt-1.5 text-sm font-bold text-[#102B2A]">{p.label}</p>
            <p className="text-[11px] text-slate-500 leading-snug">{p.desc}</p>
          </button>
        ))}
      </div>

      {/* Headline + AI search entry */}
      <div className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-[#102B2A] flex items-center gap-2"><Radar className="w-4 h-4 text-[#187B65]" /> National opportunity discovery</h2>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">Real, publicly posted service requests discovered from authorized public sources across Canada — verified, attributed and linked to the original. Free for everyone.</p>
          </div>
          <div className="flex shrink-0 flex-col gap-1.5">
            <button onClick={() => { trackGA('community_discovery_search_open', {}); setSearchOpen(true); }} className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white hover:bg-[#125C4E] transition-colors"><Search className="w-3.5 h-3.5" /> Ask the AI</button>
            {me && (
              <button onClick={() => setSavedOnly((s) => !s)} className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${savedOnly ? 'border-[#187B65] bg-white text-[#187B65]' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}>
                <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? 'fill-current' : ''}`} /> Saved {(saved.data || []).length || ''}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2">
        <select value={province} onChange={(e) => setProvince(e.target.value)} className="input py-2 text-xs" aria-label="Filter by province">
          <option value="all">All provinces</option>
          {PROVINCES.filter((p) => p.id !== 'national').map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input py-2 text-xs" aria-label="Filter by service category">
          <option value="all">All services</option>
          {SERVICE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={classification} onChange={(e) => setClassification(e.target.value)} className="input py-2 text-xs" aria-label="Filter by opportunity type">
          <option value="all">All opportunity types</option>
          {CLASSIFICATIONS.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={days} onChange={(e) => setDays(e.target.value)} className="input py-2 text-xs" aria-label="Filter by date posted">
          <option value="7">Last 7 days</option>
          <option value="14">Last 14 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {opportunities.isPending || (savedOnly && savedOpps.isPending) ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading verified opportunities…</div>
      ) : opportunities.isError ? (
        <p className="flex items-center gap-2 py-6 text-sm text-red-600" role="alert"><TriangleAlert className="w-4 h-4" /> Opportunities could not be loaded right now.</p>
      ) : count === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center">
          <p className="text-sm font-bold text-[#102B2A]">{savedOnly ? 'No saved opportunities yet.' : 'No verified public requests match these filters yet.'}</p>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {savedOnly
              ? 'Save opportunities from the feed to organize your follow-up here.'
              : 'The discovery engine only shows real public posts it has verified — it never invents demand. New sources are checked daily; try broader filters or check back soon.'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-[11px] font-semibold text-slate-500">{count} verified public post{count === 1 ? '' : 's'} · sorted by date posted</p>
          <div className="space-y-3">
            {rows.map((item) => (
              <DiscoveryCard key={item.id} item={item} me={me} savedRow={savedByOpp[item.id]} />
            ))}
          </div>
        </>
      )}

      <p className="rounded-2xl border border-slate-100 bg-white p-3.5 text-[11px] text-slate-500 leading-relaxed">
        About this feed: only publicly accessible posts from authorized sources are indexed, always with the original title, source, link and date. Discovered posts are a sample of indexed public conversations — they do not represent total Canadian demand for these services. Personal messages, private groups and restricted content are never accessed, and no one here has asked to be contacted by you.
      </p>
    </div>
  );
}