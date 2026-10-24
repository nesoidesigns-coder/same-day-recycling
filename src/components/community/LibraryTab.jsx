import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, BookOpen, ChevronDown } from 'lucide-react';
import { RESOURCE_CATEGORIES, resourceCategoryLabel } from '@/lib/communityShared';

export default function LibraryTab() {
  const [openId, setOpenId] = useState(null);
  const [cat, setCat] = useState('all');

  const resources = useQuery({
    queryKey: ['communityResources'],
    queryFn: async () => (await base44.entities.CommunityResource.filter({ status: 'published' }, { sort: '-created_date', limit: 100 })).items || [],
  });

  // AI-generated educational guides live here (secondary tab), never in the
  // main discovery feed.
  const aiGuides = useQuery({
    queryKey: ['communityAiGuides'],
    queryFn: async () => (await base44.entities.CommunityPost.filter({ status: 'published', ai_generated: true }, { sort: '-created_date', limit: 30 })).items || [],
  });

  const grouped = useMemo(() => {
    const map = {};
    for (const r of resources.data || []) {
      if (cat !== 'all' && r.category !== cat) continue;
      (map[r.category] = map[r.category] || []).push(r);
    }
    return map;
  }, [resources.data, cat]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><BookOpen className="w-4 h-4 text-[#187B65]" /> Community knowledge library</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          Organized educational resources for Canadian recycling and junk-removal businesses. Topics touching legal, tax, safety or regulation are reviewed by a human before publication. Educational only, not professional advice.
        </p>
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          <button onClick={() => setCat('all')} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${cat === 'all' ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}>All topics</button>
          {RESOURCE_CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-bold ${cat === c.id ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}>{c.label}</button>
          ))}
        </div>
      </div>

      {resources.isPending && <div className="flex items-center gap-2 py-10 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading library…</div>}
      {resources.data && Object.keys(grouped).length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-bold text-[#102B2A]">No published resources in this topic yet.</p>
          <p className="mt-1 text-xs text-slate-500">Ask the AI assistant in the meantime, or start a discussion in the AI Business Master Academy.</p>
        </div>
      )}
      {Object.entries(grouped).map(([c, list]) => (
        <div key={c}>
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#187B65] mb-2">{resourceCategoryLabel(c)}</h4>
          <div className="space-y-2">
            {list.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <button onClick={() => setOpenId(openId === r.id ? null : r.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
                  <div>
                    <div className="text-sm font-bold text-[#102B2A]">{r.title}</div>
                    <div className="text-[11px] text-slate-500">{r.author_label} · {new Date(r.created_date).toLocaleDateString('en-CA')}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openId === r.id ? 'rotate-180' : ''}`} />
                </button>
                {openId === r.id && <div className="px-4 pb-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed border-t border-slate-100 pt-3">{r.body}</div>}
              </div>
            ))}
          </div>
        </div>
      ))}

      {(aiGuides.data || []).length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#187B65] mb-2">AI Business Master guides</h4>
          <div className="space-y-2">
            {aiGuides.data.map((g) => (
              <div key={g.id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
                <button onClick={() => setOpenId(openId === g.id ? null : g.id)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-[#102B2A] break-words">{g.title}</div>
                    <div className="text-[11px] text-slate-500">Recycling OS Intelligence · {new Date(g.created_date).toLocaleDateString('en-CA')}</div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${openId === g.id ? 'rotate-180' : ''}`} />
                </button>
                {openId === g.id && <div className="px-4 pb-4 text-sm text-slate-700 whitespace-pre-line leading-relaxed border-t border-slate-100 pt-3">{g.body}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}