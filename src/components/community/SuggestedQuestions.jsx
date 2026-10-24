import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Bot } from 'lucide-react';

export default function SuggestedQuestions({ onOpen }) {
  const questions = useQuery({
    queryKey: ['communitySuggestedQuestions'],
    queryFn: async () => (await base44.entities.CommunityPost.filter({ ai_generated: true, ai_kind: 'question', status: 'published' }, { sort: '-created_date', limit: 3 })).items || [],
  });

  const list = questions.data || [];
  if (questions.isPending || list.length === 0) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#187B65]"><Bot className="w-3.5 h-3.5" /> Suggested questions</h3>
      <div className="mt-2 space-y-2">
        {list.map((q) => (
          <button key={q.id} onClick={() => onOpen(q)} className="block w-full rounded-xl bg-slate-50 px-3 py-2.5 text-left hover:bg-[#f4f7f5] transition-colors">
            <span className="block text-sm font-semibold text-[#102B2A] leading-snug">{q.title}</span>
            <span className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500"><MessageSquare className="w-3 h-3" /> Join the discussion</span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-[10px] text-slate-400">Official AI prompts · answers come from real members</p>
    </div>
  );
}