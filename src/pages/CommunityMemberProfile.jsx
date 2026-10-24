import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useSEO } from '@/lib/seo';
import TopBar from '@/components/sdr/TopBar';
import Navbar from '@/components/sdr/Navbar';
import Footer from '@/components/sdr/Footer';
import { channelLabel, memberTypeLabel } from '@/lib/communityShared';
import { Image } from '@/components/ui/image';
import { ArrowLeft, BadgeCheck, MapPin, Globe, MessageSquare, FileText, ThumbsUp, ShieldAlert } from 'lucide-react';

export default function CommunityMemberProfile() {
  const { profileId } = useParams();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => { if (!profileId) setNotFound(true); }, [profileId]);

  const profile = useQuery({
    queryKey: ['communityMemberProfile', profileId],
    enabled: !!profileId,
    queryFn: async () => {
      try {
        return await base44.entities.CommunityProfile.get(profileId);
      } catch {
        setNotFound(true);
        return null;
      }
    },
  });

  const p = profile.data;
  useSEO({
    title: p ? `${p.display_name} | Recycling OS Community` : 'Member profile | Recycling OS Community',
    description: p ? `Community profile for ${p.display_name}${p.business_name ? ` (${p.business_name})` : ''} on Canada's recycling and removal professional community.` : 'Member profile on the Recycling OS Community.',
    path: `/community/member/${profileId}`,
  });

  const posts = useQuery({
    queryKey: ['communityMemberPosts', p?.id],
    enabled: !!p && !p.suspended,
    queryFn: async () => (await base44.entities.CommunityPost.filter({ created_by_id: p.created_by_id, status: 'published' }, { sort: '-created_date', limit: 12 })).items || [],
  });

  const replyCount = useQuery({
    queryKey: ['communityMemberReplies', p?.id],
    enabled: !!p && !p.suspended,
    queryFn: async () => base44.entities.CommunityComment.count({ created_by_id: p.created_by_id, status: 'published' }),
  });

  const helpfulCount = useQuery({
    queryKey: ['communityMemberHelpful', p?.id],
    enabled: !!p && !p.suspended && (posts.data || []).length > 0,
    queryFn: async () => {
      const ids = posts.data.map((post) => post.id);
      return base44.entities.CommunityReaction.count({ target_type: 'post', target_id: { $in: ids } });
    },
  });

  if (profile.isPending) {
    return (
      <div className="bg-white min-h-screen">
        <TopBar /><Navbar />
        <div className="min-h-[60vh] flex items-center justify-center" role="status">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#187B65] rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !p || p.suspended) {
    return (
      <div className="bg-white min-h-screen">
        <TopBar /><Navbar />
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <h1 className="text-xl font-bold text-[#102B2A]">Member profile not available</h1>
          <p className="mt-2 text-sm text-slate-500">This profile doesn't exist or is no longer active.</p>
          <Link to="/community" className="mt-6 inline-block rounded-full bg-[#187B65] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#125C4E] transition-colors">Back to community</Link>
        </div>
        <Footer />
      </div>
    );
  }

  const initial = (p.display_name || 'M').trim().charAt(0).toUpperCase();
  const stats = [
    { icon: FileText, label: 'Discussions started', value: (posts.data || []).length },
    { icon: MessageSquare, label: 'Helpful replies', value: replyCount.data ?? 0 },
    { icon: ThumbsUp, label: 'Helpful marks received', value: helpfulCount.data ?? 0 },
  ];

  return (
    <div className="bg-white min-h-screen">
      <TopBar /><Navbar />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Link to="/community" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65] hover:underline"><ArrowLeft className="w-3.5 h-3.5" /> Back to community</Link>

        {/* Identity card */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="w-14 h-14 shrink-0 rounded-full bg-[#187B65]/10 text-[#187B65] font-bold flex items-center justify-center text-xl">{initial}</span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-[#102B2A]">{p.display_name}</h1>
                {p.verification_status === 'verified' && (
                  <span title={p.verified_details || 'Business credentials verified by Same Day Recycling'} className="inline-flex items-center gap-1 rounded-full bg-[#187B65]/10 text-[#187B65] px-2.5 py-1 text-[10px] font-bold"><BadgeCheck className="w-3.5 h-3.5" /> Verified business</span>
                )}
              </div>
              <p className="mt-0.5 text-sm text-slate-500">{memberTypeLabel(p.member_type)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                {(p.city || p.province_code) && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{[p.city, p.province_code].filter(Boolean).join(', ')}</span>}
                {p.business_name && <span><span className="font-semibold">Business (self-reported):</span> {p.business_name}</span>}
              </div>
              {p.website && /^https?:\/\//.test(p.website) && (
                <a href={p.website} target="_blank" rel="noopener noreferrer nofollow" className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65] hover:underline"><Globe className="w-3.5 h-3.5" /> {p.website.replace(/^https?:\/\//, '').slice(0, 60)}</a>
              )}
            </div>
          </div>
          {p.bio && <p className="mt-4 text-sm text-slate-700 leading-relaxed whitespace-pre-line border-t border-slate-100 pt-4">{p.bio}</p>}
          {p.contribution_score > 0 && (
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-[#187B65]">{p.contribution_score} community contributions recognized</p>
          )}
          {p.verification_status === 'verified' && p.verified_details && (
            <p className="mt-2 text-[11px] text-slate-500"><span className="font-bold">What was verified:</span> {p.verified_details}</p>
          )}
          {p.verification_status === 'none' && p.business_name && (
            <p className="mt-2 text-[11px] text-slate-500 flex items-start gap-1.5"><ShieldAlert className="w-3 h-3 shrink-0 mt-0.5" /> Business name is self-reported and not yet verified by our team.</p>
          )}
        </div>

        {/* Trust stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
              <s.icon className="w-4 h-4 mx-auto text-[#187B65]" />
              <div className="mt-1.5 text-lg font-bold text-[#102B2A]">{s.value}</div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Recent discussions */}
        <div className="mt-6">
          <h2 className="text-sm font-bold text-[#102B2A]">Recent discussions</h2>
          {posts.isPending && (
            <div className="mt-3 flex items-center gap-2 text-sm text-slate-500" role="status">
              <svg className="w-5 h-5 animate-spin text-[#187B65]" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" /><path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="4" strokeLinecap="round" /></svg> Loading discussions…
            </div>
          )}
          {posts.data && posts.data.length === 0 && (
            <p className="mt-3 rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-500">No public discussions yet — say hello in the community to get started.</p>
          )}
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            {(posts.data || []).map((post) => (
              <Link key={post.id} to={`/community?post=${post.id}`} className="block rounded-2xl border border-slate-200 bg-white overflow-hidden hover:border-[#187B65]/50 transition-colors">
                {post.image_url && (
                  <div className="aspect-[16/9] overflow-hidden">
                    <Image src={post.image_url} alt="" className="w-full h-full" fittingType="fill" />
                  </div>
                )}
                <div className="p-4">
                  <span className="rounded-full bg-[#187B65]/10 text-[#187B65] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{channelLabel(post.channel)}</span>
                  <h3 className="mt-2 text-sm font-bold text-[#102B2A] leading-snug">{post.title}</h3>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">{post.body}</p>
                  <p className="mt-2 text-[11px] text-slate-400">{new Date(post.created_date).toLocaleDateString('en-CA')}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <p className="mt-6 text-[11px] text-slate-500 leading-relaxed">
          Profiles show only what members choose to share. Community participation reflects helpful discussions, not customer reviews or service-quality ratings.
        </p>
      </div>
      <Footer />
    </div>
  );
}