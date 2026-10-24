import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import TopBar from '@/components/sdr/TopBar';
import Navbar from '@/components/sdr/Navbar';
import Footer from '@/components/sdr/Footer';
import { Users, Sparkles, Megaphone } from 'lucide-react';
import CommunityFeed from '@/components/community/CommunityFeed';
import OpportunityBoard from '@/components/community/OpportunityBoard';
import MemberDirectory from '@/components/community/MemberDirectory';
import LibraryTab from '@/components/community/LibraryTab';
import MyProfile from '@/components/community/MyProfile';
import AiAssistant from '@/components/community/AiAssistant';

const TABS = [
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
    title: 'Recycling Business Community | Same Day Recycling',
    description: "Canada's free professional community for junk removal operators, recycling businesses and contractors: discussions, business education, an opportunity board and member networking.",
    path: '/community',
  });

  const [me, setMe] = useState(null);
  const [checked, setChecked] = useState(false);
  const [tab, setTab] = useState('feed');
  const [aiOpen, setAiOpen] = useState(false);

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
    enabled: !!me,
    queryFn: async () => (await base44.entities.CommunityPost.filter({ channel: 'announcements', status: 'published' }, { sort: '-created_date', limit: 1 })).items || [],
  });

  if (!checked) {
    return <div className="min-h-[70vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-slate-200 border-t-[#187B65] rounded-full animate-spin" /></div>;
  }

  if (!me) {
    return (
      <div className="bg-white min-h-screen">
        <TopBar />
        <Navbar />
        <section className="bg-[#102B2A] text-white">
          <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
            <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Free to join</div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Canada's recycling business community</h1>
            <p className="mt-5 text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
              A professional network for junk removal operators, recycling businesses, independent contractors and property service professionals. Learn, connect and find opportunities — community membership is free, and business software subscriptions stay entirely optional.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <a href="/register?returnTo=/community" className="rounded-full bg-[#187B65] text-white font-bold px-7 py-3.5 text-sm hover:bg-[#125C4E] transition-colors">Create your free profile</a>
              <a href="/login?returnTo=/community" className="rounded-full border border-slate-500 text-slate-200 font-bold px-7 py-3.5 text-sm hover:border-[#187B65] hover:text-white transition-colors">Log in with an existing account</a>
            </div>
          </div>
        </section>
        <section className="max-w-4xl mx-auto px-4 py-14 grid sm:grid-cols-2 gap-4">
          {[
            ['Discussion channels', 'General discussion, contractor exchange, AI Business Master Academy, recycling exchange, equipment and provincial networks.'],
            ['Opportunity board', 'Overflow jobs, subcontracting and partnerships posted by verified contractors.'],
            ['Knowledge library', 'Practical educational resources for running a Canadian hauling business.'],
            ['AI Business Master', 'A community knowledge assistant for business questions — clearly labeled, never your private data.'],
          ].map(([t, d]) => (
            <div key={t} className="rounded-2xl border border-slate-200 bg-[#f4f7f5] p-5">
              <h2 className="font-bold text-[#102B2A]">{t}</h2>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{d}</p>
            </div>
          ))}
        </section>
        <Footer />
      </div>
    );
  }

  const announcement = (announcements.data || [])[0];

  return (
    <div className="bg-white min-h-screen">
      <TopBar />
      <Navbar />
      <section className="bg-[#102B2A] text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-2 flex items-center gap-2"><Users className="w-4 h-4" /> Recycling Business Network</div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Community</h1>
          <p className="mt-3 text-slate-300 max-w-2xl text-sm leading-relaxed">
            Connect with Canadian recycling and junk removal professionals. Free membership, real conversations, optional software.
          </p>
          {announcement && (
            <div className="mt-5 rounded-2xl border border-[#187B65]/40 bg-[#187B65]/10 px-4 py-3 max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#187B65]"><Megaphone className="w-3.5 h-3.5" /> Announcement</div>
              <button onClick={() => setTab('feed')} className="mt-1 block w-full text-left text-sm font-bold text-white hover:underline">{announcement.title}</button>
            </div>
          )}
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 mb-6" role="tablist" aria-label="Community sections">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} role="tab" aria-selected={tab === t.id} className={`shrink-0 rounded-full border px-4 py-2.5 text-sm font-bold transition-colors ${tab === t.id ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}>{t.label}</button>
          ))}
        </div>

        {tab === 'feed' && <CommunityFeed me={me} profileName={null} />}
        {tab === 'opportunities' && <OpportunityBoard me={me} />}
        {tab === 'directory' && <MemberDirectory />}
        {tab === 'library' && <LibraryTab />}
        {tab === 'profile' && <MyProfile me={me} />}

        <details className="mt-10 rounded-2xl border border-slate-200 bg-[#f4f7f5] p-5">
          <summary className="cursor-pointer text-sm font-bold text-[#102B2A]">Community guidelines</summary>
          <ul className="mt-3 space-y-2 text-sm text-slate-600 list-disc pl-5">
            {GUIDELINES.map((g) => <li key={g}>{g}</li>)}
          </ul>
        </details>
      </div>

      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#187B65] px-5 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-[#125C4E] transition-colors"
        aria-label="Open AI Business Master community assistant"
      >
        <Sparkles className="w-4 h-4" /> Ask the AI
      </button>
      <AiAssistant open={aiOpen} onClose={() => setAiOpen(false)} />
      <Footer />
    </div>
  );
}