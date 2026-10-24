import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { channelLabel, provinceLabel } from '@/lib/communityShared';
import { Image } from '@/components/ui/image';
import { MessageSquare, ThumbsUp, Flag, BadgeCheck, MapPin, Megaphone, Bookmark, Share2, Check, Bot } from 'lucide-react';

export default function PostCard({ post, replyCount, helpfulCount, mineVoted, saved, copied, onBookmark, onShare, onVote, onOpen, onReport, onAiAnswer }) {
  const initial = (post.author_name || 'M').trim().charAt(0).toUpperCase();

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-[#187B65]/40 transition-colors">
      {/* Image-led: photos run edge-to-edge and lead the card */}
      <button onClick={onOpen} className="block w-full text-left">
        {post.image_url && (
          <div className="aspect-[16/9] w-full overflow-hidden">
            <Image src={post.image_url} alt="" className="w-full h-full" fittingType="fill" />
          </div>
        )}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
            <span className="rounded-full bg-[#187B65]/10 text-[#187B65] px-2 py-0.5">{channelLabel(post.channel)}</span>
            {post.province && post.province !== 'national' && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5"><MapPin className="w-3 h-3" />{provinceLabel(post.province)}</span>
            )}
            {post.channel === 'announcements' && <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 flex items-center gap-1"><Megaphone className="w-3 h-3" />Official</span>}
            {post.ai_generated && <span className="rounded-full bg-[#102B2A] text-white px-2 py-0.5 flex items-center gap-1"><Bot className="w-3 h-3" />AI-generated</span>}
          </div>
          <h3 className={`font-bold text-[#102B2A] leading-snug ${post.image_url ? 'mt-3 text-lg' : 'mt-2 text-lg'}`}>{post.title}</h3>
          <p className="mt-1 text-sm text-slate-600 leading-relaxed line-clamp-2">{post.body}</p>
        </div>
      </button>

      {/* Author + conversation actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 pb-3.5 text-xs text-slate-500">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 shrink-0 rounded-full bg-[#187B65]/10 text-[#187B65] font-bold flex items-center justify-center text-xs">{initial}</span>
          <span className="truncate font-semibold text-slate-600">{post.author_name || 'Member'}</span>
          <span className="hidden sm:inline text-slate-400">· {new Date(post.created_date).toLocaleDateString('en-CA')}</span>
        </div>
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
          <button onClick={onBookmark} aria-pressed={saved} title={saved ? 'Remove bookmark' : 'Save for later'} className={`rounded-full p-1.5 transition-colors ${saved ? 'text-[#187B65]' : 'text-slate-400 hover:text-[#187B65]'}`}>
            <Bookmark className={`w-3.5 h-3.5 ${saved ? 'fill-current' : ''}`} />
          </button>
          <button onClick={onShare} title="Share this discussion" className="rounded-full p-1.5 text-slate-400 hover:text-[#187B65] transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-[#187B65]" /> : <Share2 className="w-3.5 h-3.5" />}
          </button>
          {onAiAnswer && <button onClick={onAiAnswer} className="rounded-full border border-slate-200 px-3 py-1.5 font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors" title="AI Business Master summary">AI</button>}
          {onReport && <button onClick={onReport} className="rounded-full p-1.5 text-slate-400 hover:text-red-500 transition-colors" title="Report to moderators"><Flag className="w-3.5 h-3.5" /></button>}
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