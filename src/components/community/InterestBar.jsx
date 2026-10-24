import { useEffect } from 'react';
import { Bookmark, MapPin, SlidersHorizontal } from 'lucide-react';
import { INTERESTS, PROVINCES } from '@/lib/communityShared';

// Interest + location personalization bar. Preferences persist in the
// member's browser; they shape the feed, never restrict public content.
export default function InterestBar({ interests, onToggleInterest, region, onRegion, savedOnly, onToggleSaved, savedCount }) {
  useEffect(() => {
    localStorage.setItem('communityRegion', region);
  }, [region]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#187B65]">
        <SlidersHorizontal className="w-3.5 h-3.5" /> Personalize your feed
      </div>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {INTERESTS.map((i) => {
          const active = interests.includes(i.id);
          return (
            <button
              key={i.id}
              onClick={() => onToggleInterest(i.id)}
              aria-pressed={active}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${active ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-[#f4f7f5] text-slate-600 hover:border-[#187B65] hover:text-[#187B65]'}`}
            >
              {i.label}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <MapPin className="w-3.5 h-3.5 text-[#187B65]" />
          <span className="sr-only">Region</span>
          <select value={region} onChange={(e) => onRegion(e.target.value)} className="rounded-full border border-slate-200 bg-[#f4f7f5] px-3 py-1.5 text-xs font-bold text-slate-600 focus:border-[#187B65] focus:outline-none">
            {PROVINCES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
        <button
          onClick={onToggleSaved}
          aria-pressed={savedOnly}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${savedOnly ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-[#f4f7f5] text-slate-600 hover:border-[#187B65] hover:text-[#187B65]'}`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${savedOnly ? 'fill-current' : ''}`} /> Saved{savedCount ? ` (${savedCount})` : ''}
        </button>
      </div>
    </div>
  );
}