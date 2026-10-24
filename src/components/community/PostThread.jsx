import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ArrowLeft, Loader2, Send, ThumbsUp, Flag, Bot } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { reportContent } from '@/components/community/PostCard';

export default function PostThread({ post, me, profileName, onBack }) {
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [voted, setVoted] = useState(false);
  const [reported, setReported] = useState(false);

  const comments = useQuery({
    queryKey: ['communityComments', post.id],
    queryFn: async () => (await base44.entities.CommunityComment.filter({ post_id: post.id, status: 'published' }, { sort: 'created_date', limit: 100 })).items || [],
  });

  const reaction = useQuery({
    queryKey: ['communityReaction', post.id],
    queryFn: async () => {
      const rows = (await base44.entities.CommunityReaction.filter({ target_type: 'post', target_id: post.id }, { limit: 300 })).items || [];
      return { count: rows.length, mine: rows.some((r) => r.owner_email === me?.email) };
    },
  });

  const toggleHelpful = async () => {
    if (!me) return;
    const rows = (await base44.entities.CommunityReaction.filter({ target_type: 'post', target_id: post.id, owner_email: me.email }, { limit: 1 })).items || [];
    if (rows.length) await base44.entities.CommunityReaction.delete(rows[0].id);
    else await base44.entities.CommunityReaction.create({ target_type: 'post', target_id: post.id, owner_email: me.email });
    queryClient.invalidateQueries({ queryKey: ['communityReaction', post.id] });
    setVoted(true);
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await base44.entities.CommunityComment.create({ post_id: post.id, body: comment, author_name: profileName || 'Member' });
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['communityComments', post.id] });
      queryClient.invalidateQueries({ queryKey: ['communityCommentCounts'] });
    } finally {
      setBusy(false);
    }
  };

  const doReport = async () => {
    await reportContent('post', post.id, 'other', 'Reported from the discussion thread.');
    setReported(true);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <div className="p-4 border-b border-slate-100">
        <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-bold text-[#187B65] hover:underline"><ArrowLeft className="w-3.5 h-3.5" /> Back to feed</button>
        <h2 className="mt-2 text-lg font-bold text-[#102B2A] leading-snug">{post.title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{post.author_name || 'Member'} · {new Date(post.created_date).toLocaleDateString('en-CA')}</p>
        {post.ai_generated && <p className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#102B2A] text-white px-2.5 py-1 text-[10px] font-bold"><Bot className="w-3 h-3" /> Recycling OS Intelligence · AI-generated{post.source_note ? ` · ${post.source_note}` : ''}</p>}
        {post.image_url && (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-100">
            <Image src={post.image_url} alt="" className="max-h-96 w-full" fittingType="fill" />
          </div>
        )}
        <p className="mt-3 text-sm text-slate-700 whitespace-pre-line leading-relaxed">{post.body}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {me ? (
            <>
              <button onClick={toggleHelpful} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${voted || reaction.data?.mine ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 text-slate-600 hover:border-[#187B65] hover:text-[#187B65]'}`}>
                <ThumbsUp className="w-3.5 h-3.5" /> Helpful ({reaction.data?.count ?? 0})
              </button>
              <button onClick={doReport} className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500 hover:border-red-300 hover:text-red-500 transition-colors">
                <Flag className="w-3.5 h-3.5" /> {reported ? 'Reported' : 'Report'}
              </button>
            </>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-500">
              <ThumbsUp className="w-3.5 h-3.5" /> {reaction.data?.count ?? 0} found this helpful
            </span>
          )}
        </div>
      </div>
      <div className="p-4 space-y-3">
        <h3 className="text-sm font-bold text-[#102B2A]">{comments.data?.length || 0} replies</h3>
        {comments.isPending && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Loading replies…</div>}
        {(comments.data || []).map((c) => (
          <div key={c.id} className="rounded-xl bg-slate-50 px-4 py-3">
            <div className="text-xs font-bold text-[#102B2A]">{c.author_name || 'Member'} <span className="font-normal text-slate-400">· {new Date(c.created_date).toLocaleDateString('en-CA')}</span></div>
            <p className="mt-1 text-sm text-slate-600 whitespace-pre-line leading-relaxed">{c.body}</p>
          </div>
        ))}
        {!comments.isPending && (comments.data || []).length === 0 && (
          <p className="text-sm text-slate-500">No replies yet — be the first to help.</p>
        )}
        {me ? (
          <form onSubmit={addComment} className="flex gap-2 pt-2">
            <input value={comment} onChange={(e) => setComment(e.target.value)} maxLength={3000} className="input flex-1" placeholder="Write a helpful reply…" />
            <button type="submit" disabled={busy || !comment.trim()} className="shrink-0 rounded-xl bg-[#187B65] px-4 text-white disabled:opacity-40"><Send className="w-4 h-4" /></button>
          </form>
        ) : (
          <p className="pt-2 text-xs text-slate-500">
            <a href="/register?returnTo=/community" className="font-bold text-[#187B65] hover:underline">Join free</a> to reply to this discussion.
          </p>
        )}
      </div>
    </div>
  );
}