import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import Navbar from '@/components/sdr/Navbar';
import Footer from '@/components/sdr/Footer';
import { Megaphone, UserPlus, LogIn, Sparkles, Recycle } from 'lucide-react';
import CommunityFeed from '@/components/community/CommunityFeed';
import CommunitySpotlight from '@/components/community/CommunitySpotlight';
import SuggestedQuestions from '@/components/community/SuggestedQuestions';
import LocalOpportunitiesStrip from '@/components/community/LocalOpportunitiesStrip';
import OpportunityBoard from '@/components/community/OpportunityBoard';
import MemberDirectory from '@/components/community/MemberDirectory';
import DiscoveryFeed from '@/components/community/DiscoveryFeed';
import { trackGA } from '@/lib/communityAnalytics';
import LibraryTab from '@/components/community/LibraryTab';
import MyProfile from '@/components/community/MyProfile';
import AiAssistant from '@/components/community/AiAssistant';

const TABS = [
  { id: 'discover', label: 'Discover' },
  { id: 'feed', label: 'Discussions' },
  { id: 'opportunities', label: 'Opportunity Board' },
  { id: 'directory', label: 'Members' },
  { id: 'library', label: 'Knowledge Library' },
  { id: 'profile', label: 'My Profile' },
];

const GUIDELINES = [
  'Be helpful and professional — share real experience, ask real questions.',
  'No spam, harassment, misleading claims or fraudulent postings.',
  'Never post customer addresses or private contact details. Opportunities contact methods only.',
  'Business names are self-reported until business verification is approved by our team.',
  'Community participation is separate from customer reviews and service quality ratings.',
  'Report anything that breaks the rules — moderators review every report.',
];

export default function Community() {
  useSEO({
    title: 'Recycling OS Community | Same Day Recycling',
    description: "Canada's free service opportunity network: AI discovery of real, verified public service requests across Canada, plus member discussions, an opportunity board and knowledge for contractors, businesses and residents.",
    path: '/community',
  });

  const [me, setMe] = useState(null);
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState(() => (new URLSearchParams(window.location.search).get('post') ? 'feed' : 'discover'));
  const [aiOpen, setAiOpen] = useState(false);

  // GA4: which community areas get the most traffic.
  useEffect(() => {
    trackGA('community_tab_view', { tab });
  }, [tab]);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me();
        setMe(user);
      } catch {
        setMe(null);
      } finally {
        setChecked(true);
      }
    })();
  }, []);

  const announcements = useQuery({
    queryKey: ['communityAnnouncements'],
    queryFn: async () => (await base44.entities.CommunityPost.filter({ channel: 'announcements', status: 'published' }, { sort: '-created_date', limit: 1 })).items || [],
  });

  if (!checked) {
    return <div className="min-h-[70vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#187B65] rounded-full animate-spin" /></div>;
  }

  const announcement = (announcements.data || [])[0];
  const guest = !me;

  const onAskAI = () => {
    if (guest) window.location.assign('/register?returnTo=/community');
    else setAiOpen(true);
  };
  const onShareSomething = () => {
    if (guest) window.location.assign('/register?returnTo=/community');
    else {
      setTab('feed');
      setTimeout(() => document.getElementById('composer-anchor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
    }
  };
  const openPostDirect = (post) => window.location.assign(`/community?post=${post.id}`);

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      {/* Compact branded header: content starts one screen-fraction down */}
      <header className="border-b border-slate-100 bg-white/90">
        <div className="max-w-5xl mx-auto px-4 pt-3 pb-2.5">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 shrink-0 rounded-xl bg-[#187B65] text-white flex items-center justify-center">
                <Recycle className="w-5 h-5" />
              </span>
              <div className="min-w-0">
                <h1 className="text-lg font-bold text-[#102B2A] leading-tight">Recycling OS Community</h1>
                <p className="text-[11px] text-slate-500 leading-snug">Canada's free national network for discovering real service requests — and real conversations</p>
              </div>
            </div>
            {guest ? (
              <div className="flex shrink-0 gap-1.5">
                <a href="/register?returnTo=/community" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full bg-[#187B65] px-3.5 py-2 text-[11px] font-bold text-white hover:bg-[#125C4E] transition-colors"><UserPlus className="w-3 h-3" /> Join free</a>
                <a href="/login?returnTo=/community" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-2 text-[11px] font-bold text-slate-600 hover:border-[#187B65] transition-colors"><LogIn className="w-3 h-3" /> Log in</a>
              </div>
            ) : (
              <button onClick={onAskAI} className="shrink-0 self-start inline-flex items-center gap-1.5 rounded-full bg-[#187B65] px-3.5 py-2 text-[11px] font-bold text-white hover:bg-[#125C4E] transition-colors">
                <Sparkles className="w-3 h-3" /> Ask the AI
              </button>
            )}
          </div>
          {announcement && (
            <button onClick={() => { setTab('feed'); }} className="mt-2.5 flex w-full items-center gap-2 rounded-xl border border-[#187B65]/30 bg-[#f4f7f5] px-3 py-2 text-left">
              <Megaphone className="w-3.5 h-3.5 shrink-0 text-[#187B65]" />
              <span className="truncate text-xs font-bold text-[#102B2A]">{announcement.title}</span>
            </button>
          )}
        </div>
      </header>

      {guest && (
        <div className="bg-[#f4f7f5] border-b border-slate-200">
          <p className="max-w-5xl mx-auto px-4 py-1.5 text-[11px] font-semibold text-[#102B2A]">
            You're browsing as a guest — every discussion, opportunity and resource is open to read. Posting, replies and votes need a free profile.
          </p>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-3 sm:py-5">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-3 sm:mb-5" role="tablist" aria-label="Community sections">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} role="tab" aria-selected={tab === t.id} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-bold transition-colors ${tab === t.id ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}>{t.label}</button>
          ))}
        </div>

        {tab === 'discover' && <DiscoveryFeed me={me} onGoOpportunities={() => setTab('opportunities')} onGoDiscussions={() => setTab('feed')} />}
        {tab === 'feed' && (
          <div className="grid lg:grid-cols-[1fr_300px] gap-6 items-start">
            <CommunityFeed me={me} profileName={null} onGoOpportunities={() => setTab('opportunities')} />
            <aside className="space-y-4">
              <CommunitySpotlight onOpen={openPostDirect} />
              <SuggestedQuestions onOpen={openPostDirect} />
              <LocalOpportunitiesStrip onOpen={() => setTab('opportunities')} />
              <button onClick={onShareSomething} className="w-full rounded-2xl border border-dashed border-[#187B65]/40 bg-[#f4f7f5] px-4 py-3 text-sm font-bold text-[#187B65] hover:bg-[#eef4f1] transition-colors">
                Share your experience with the community
              </button>
            </aside>
          </div>
        )}
        {tab === 'opportunities' && <OpportunityBoard me={me} />}
        {tab === 'directory' && <MemberDirectory />}
        {tab === 'library' && <LibraryTab />}
        {tab === 'profile' && (guest
          ? (
            <div className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-8 text-center">
              <h2 className="text-lg font-bold text-[#102B2A]">Your community profile</h2>
              <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">Profiles are for members. Create a free account to set your display name, member type, location and business details.</p>
              <a href="/register?returnTo=/community" className="mt-5 inline-block rounded-full bg-[#187B65] text-white font-bold px-6 py-3 text-sm hover:bg-[#125C4E] transition-colors">Create your free profile</a>
            </div>
          )
          : <MyProfile me={me} />)}

        <details className="mt-10 rounded-2xl border border-slate-200 bg-[#f4f7f5] p-5">
          <summary className="cursor-pointer text-sm font-bold text-[#102B2A]">Community guidelines</summary>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
            {GUIDELINES.map((g) => <li key={g}>{g}</li>)}
          </ul>
        </details>
      </div>

      <AiAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
      <Footer />
    </div>
  );
}