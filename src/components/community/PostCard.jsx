import { MessageSquare, ThumbsUp, Flag, BadgeCheck, MapPin, Megaphone } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { channelLabel, provinceLabel } from '@/lib/communityShared';

export default function PostCard({ post, replyCount, helpfulCount, mineVoted, onVote, onOpen, onReport, onAiAnswer }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#187B65]/40 transition-colors">
      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
        <span className="rounded-full bg-[#187B65]/10 text-[#187B65] px-2 py-0.5">{channelLabel(post.channel)}</span>
        {post.province && post.province !== 'national' && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5"><MapPin className="w-3 h-3" />{provinceLabel(post.province)}</span>
        )}
        {post.channel === 'announcements' && <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 flex items-center gap-1"><Megaphone className="w-3 h-3" />Official</span>}
      </div>
      <button onClick={onOpen} className="mt-2 block w-full text-left">
        <h3 className="text-base font-bold text-[#102B2A] leading-snug">{post.title}</h3>
        <p className="mt-1.5 text-sm text-slate-600 leading-relaxed line-clamp-3">{post.body}</p>
      </button>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="font-semibold text-slate-600">{post.author_name || 'Member'} · {new Date(post.created_date).toLocaleDateString('en-CA')}</span>
        <div className="flex items-center gap-1">
          {onVote && (
            <button
              onClick={onVote}
              aria-pressed={mineVoted}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-bold transition-colors ${mineVoted ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 text-slate-600 hover:border-[#187B65] hover:text-[#187B65]'}`}
            >
              <ThumbsUp className="w-3.5 h-3.5" /> {post.channel === 'ideas_feedback' ? `Vote${helpfulCount ? ` (${helpfulCount})` : ''}` : (helpfulCount || 0)}
            </button>
          )}
          <button onClick={onOpen} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors">
            <MessageSquare className="w-3.5 h-3.5" /> {replyCount || 0}
          </button>
          {onAiAnswer && <button onClick={onAiAnswer} className="rounded-full border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors" title="AI Business Master summary">AI</button>}
          {onReport && <button onClick={onReport} className="rounded-full p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Log in to report to moderators"><Flag className="w-3.5 h-3.5" /></button>}
        </div>
      </div>
    </article>
  );
}

export const VerifiedBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-full bg-[#187B65]/10 text-[#187B65] px-2 py-0.5 text-[10px] font-bold">
    <BadgeCheck className="w-3 h-3" /> Verified
  </span>
);

export const reportContent = async (targetType, targetId, reason, details) => {
  await base44.entities.CommunityReport.create({ target_type: targetType, target_id: targetId, reason, details: details || '' });
};