import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { opportunityTypeLabel } from '@/lib/communityShared';
import { Briefcase, ArrowRight } from 'lucide-react';

export default function LocalOpportunitiesStrip({ onOpen }) {
  const opportunities = useQuery({
    queryKey: ['communityLocalOpportunities'],
    queryFn: async () => (await base44.entities.CommunityOpportunity.filter({ status: 'open' }, { sort: '-created_date', limit: 3 })).items || [],
  });

  const list = opportunities.data || [];
  if (opportunities.isPending || list.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#187B65]"><Briefcase className="w-3.5 h-3.5" /> Local opportunities</h3>
        <p className="mt-2 text-sm text-slate-500">No open opportunities right now. Members post real work here — nothing is generated.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#187B65]"><Briefcase className="w-3.5 h-3.5" /> Local opportunities</h3>
      <div className="mt-2 space-y-2">
        {list.map((o) => (
          <button key={o.id} onClick={() => onOpen(o)} className="block w-full rounded-xl bg-slate-50 px-3 py-2.5 text-left hover:bg-[#f4f7f5] transition-colors">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#187B65]">{opportunityTypeLabel(o.type)}</span>
            <span className="block text-sm font-semibold text-[#102B2A] leading-snug">{o.title}</span>
            {o.city && <span className="text-[11px] text-slate-500">{o.city}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}