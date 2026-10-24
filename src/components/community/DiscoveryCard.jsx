import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Truck, Armchair, WashingMachine, Laptop, Recycle, Trash2, PackageOpen, HardHat,
  Hammer, BedDouble, Leaf, Building2, Waves, Wrench, Package, Zap, CircleDot,
  ExternalLink, Bookmark, BookmarkCheck, MapPin, Globe, Loader2, ShieldCheck,
} from 'lucide-react';
import { classificationMeta, serviceCategoryLabel } from '@/lib/discoveryShared';
import { provinceLabel } from '@/lib/communityShared';
import { trackGA } from '@/lib/communityAnalytics';

const CATEGORY_ICONS = {
  junk_removal: Truck,
  furniture_removal: Armchair,
  appliance_removal: WashingMachine,
  electronics: Laptop,
  recycling: Recycle,
  waste_disposal: Trash2,
  estate_cleanout: PackageOpen,
  construction_debris: HardHat,
  demolition_cleanup: Hammer,
  mattress_disposal: BedDouble,
  yard_waste_removal: Leaf,
  commercial_waste: Building2,
  hot_tub_removal: Waves,
  scrap_metal: Wrench,
  bin_rentals: Package,
  same_day_pickup: Zap,
  other: CircleDot,
};

export default function DiscoveryCard({ item, savedRow, me }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(savedRow?.business_notes || '');
  const cls = classificationMeta(item.classification);
  const CatIcon = CATEGORY_ICONS[item.service_category] || CircleDot;
  const date = item.posted_at ? new Date(item.posted_at).toLocaleDateString('en-CA') : '';
  const verifiedDate = item.last_verified_at ? new Date(item.last_verified_at).toLocaleDateString('en-CA') : '';

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['discoverySaved'] });

  // GA4: which discovered opportunities attract attention.
  const openOriginal = () => trackGA('community_opportunity_open', {
    service_category: item.service_category,
    province: item.province_code || '',
    classification: item.classification,
  });

  const save = async () => {
    setBusy(true);
    try {
      await base44.entities.CommunitySavedOpportunity.create({ opportunity_id: item.id, owner_email: me.email });
      invalidate();
    } finally { setBusy(false); }
  };

  const unsave = async () => {
    setBusy(true);
    try {
      await base44.entities.CommunitySavedOpportunity.delete(savedRow.id);
      invalidate();
    } finally { setBusy(false); }
  };

  const track = async (tracking_status) => {
    await base44.entities.CommunitySavedOpportunity.update(savedRow.id, { tracking_status });
    invalidate();
  };

  const saveNotes = async () => {
    setBusy(true);
    try {
      await base44.entities.CommunitySavedOpportunity.update(savedRow.id, { business_notes: notes.slice(0, 1000) });
      invalidate();
    } finally { setBusy(false); }
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-4 hover:border-[#187B65]/40 transition-colors">
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
        <span className={`rounded-full px-2 py-0.5 ${cls.tone}`}>{cls.label}</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 text-slate-600 px-2 py-0.5"><CatIcon className="w-3 h-3" />{serviceCategoryLabel(item.service_category)}</span>
      </div>
      <a href={item.source_url} onClick={openOriginal} target="_blank" rel="noopener noreferrer nofollow" className="block mt-2">
        <h3 className="font-bold text-[#102B2A] leading-snug line-clamp-2">{item.title}</h3>
      </a>
      {item.excerpt && <p className="mt-1 text-xs text-slate-600 leading-relaxed line-clamp-2">{item.excerpt}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        {(item.city || item.province_code) && (
          <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" />{[item.city, provinceLabel(item.province_code)].filter((v, i, a) => v && a.indexOf(v) === i).join(', ')}</span>
        )}
        <span className="inline-flex items-center gap-1 min-w-0"><Globe className="w-3 h-3 shrink-0" /><span className="truncate">{item.source_label || 'Public source'}</span></span>
        {date && <span>{date}</span>}
        {item.relevance_score > 0 && <span className="font-bold text-[#187B65]">AI relevance {item.relevance_score}%</span>}
        {verifiedDate && <span className="inline-flex items-center gap-1" title={`Last verified ${verifiedDate}`}><ShieldCheck className="w-3 h-3 text-[#187B65]" /> Verified</span>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a href={item.source_url} onClick={openOriginal} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#125C4E] transition-colors"><ExternalLink className="w-3 h-3" /> Open original</a>
        {me ? (
          savedRow ? (
            <button onClick={unsave} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-[#187B65] px-3.5 py-1.5 text-xs font-bold text-[#187B65] hover:bg-[#187B65] hover:text-white transition-colors"><BookmarkCheck className="w-3 h-3" /> Saved</button>
          ) : (
            <button onClick={save} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors"><Bookmark className="w-3 h-3" /> Save</button>
          )
        ) : (
          <a href="/register?returnTo=/community" className="text-xs font-bold text-[#187B65] hover:underline">Join free to save and track</a>
        )}
      </div>
      {savedRow && (
        <div className="mt-3 rounded-xl bg-[#f4f7f5] border border-slate-100 p-3 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 shrink-0">Follow-up</span>
            <select value={savedRow.tracking_status || 'saved'} onChange={(e) => track(e.target.value)} className="input py-1.5 text-xs flex-1" aria-label="Follow-up status">
              <option value="saved">Saved</option>
              <option value="reviewed">Reviewed</option>
              <option value="follow_up">Follow up planned</option>
              <option value="irrelevant">Irrelevant</option>
            </select>
          </div>
          <div className="flex gap-2">
            <input value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={1000} className="input py-1.5 text-xs flex-1" placeholder="Private business notes (only you see these)" aria-label="Private business notes" />
            <button onClick={saveNotes} disabled={busy} className="shrink-0 rounded-xl bg-[#102B2A] px-3 text-xs font-bold text-white disabled:opacity-50">Save</button>
          </div>
          <p className="text-[10px] text-slate-500 leading-relaxed">Outreach is your responsibility: respect the source platform's rules, user consent and Canadian anti-spam requirements.</p>
        </div>
      )}
    </article>
  );
}