import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Search, BadgeCheck, MapPin, ShieldAlert } from 'lucide-react';
import { MEMBER_TYPES, memberTypeLabel } from '@/lib/communityShared';

export default function MemberDirectory() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');

  const members = useQuery({
    queryKey: ['communityDirectory'],
    queryFn: async () => (await base44.entities.CommunityProfile.filter({ suspended: false }, { sort: '-contribution_score', limit: 200 })).items || [],
  });

  const visible = useMemo(() => {
    let list = members.data || [];
    if (type !== 'all') list = list.filter((m) => m.member_type === type);
    if (search.trim()) {
      const s = search.toLowerCase();
      list = list.filter((m) => [m.display_name, m.business_name, m.city].some((v) => String(v || '').toLowerCase().includes(s)));
    }
    return list;
  }, [members.data, search, type]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-[#102B2A]">Member directory</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">
          Profiles show what members choose to share. Business names are self-reported; the Verified badge appears only after Same Day Recycling reviews submitted credentials. Community participation is separate from customer reviews and service quality.
        </p>
        <div className="mt-3 flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-9" placeholder="Search members…" aria-label="Search members" />
          </div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="input sm:w-56" aria-label="Filter by member type">
            <option value="all">All member types</option>
            {MEMBER_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
          </select>
        </div>
      </div>

      {members.isPending && <div className="flex items-center gap-2 py-10 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading members…</div>}
      {members.data && visible.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-bold text-[#102B2A]">No members match yet.</p>
        </div>
      )}
      <div className="grid sm:grid-cols-2 gap-3">
        {visible.map((m) => (
          <div key={m.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="text-sm font-bold text-[#102B2A]">{m.display_name}</div>
                <div className="text-xs text-slate-500">{memberTypeLabel(m.member_type)}</div>
              </div>
              {m.verification_status === 'verified' && (
                <span title={m.verified_details || 'Business credentials verified by Same Day Recycling'} className="shrink-0">
                  <BadgeCheck className="w-5 h-5 text-[#187B65]" />
                </span>
              )}
            </div>
            {m.business_name && <p className="mt-1.5 text-xs text-slate-600"><span className="font-semibold">Business (self-reported):</span> {m.business_name}</p>}
            {(m.city || m.province_code) && <p className="mt-1 text-xs text-slate-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{[m.city, m.province_code].filter(Boolean).join(', ')}</p>}
            {m.bio && <p className="mt-2 text-xs text-slate-600 line-clamp-3">{m.bio}</p>}
            {m.contribution_score > 0 && <p className="mt-2 text-[10px] font-bold uppercase tracking-wider text-[#187B65]">{m.contribution_score} community contributions</p>}
          </div>
        ))}
      </div>
      <p className="flex items-start gap-1.5 text-[11px] text-slate-500"><ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Report any member behaving inappropriately from their posts. Moderators review all reports.</p>
    </div>
  );
}