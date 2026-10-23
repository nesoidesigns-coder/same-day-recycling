import { CATEGORY_LABELS, PROVINCES } from '@/lib/demandShared';
const selectClass = 'w-full min-w-0 rounded-xl border border-market-line bg-market-surface p-3 text-sm text-market-ink focus:outline-none focus:ring-2 focus:ring-market-accent';
export default function MarketFilters({ data, filters, onChange }) {
  const set = (key, value) => onChange({...filters,[key]:value,...(key === 'province' ? {city:''} : {})});
  const cities = (data.geography?.cities || []).filter((c) => !filters.province || c.province_code === filters.province);
  return (
    <div className="grid grid-cols-1 gap-3 rounded-2xl border border-market-line bg-market-bg p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="space-y-1 text-xs text-market-muted">Geographic scope<select className={selectClass} value={filters.province} onChange={(e) => set('province',e.target.value)}><option value="">All Canada</option>{PROVINCES.map(([c,n]) => <option value={c} key={c}>{n}</option>)}</select></label>
      <label className="space-y-1 text-xs text-market-muted">City<select className={selectClass} value={filters.city} onChange={(e) => set('city',e.target.value)}><option value="">All cities / selected region</option>{cities.map((c) => <option key={`${c.key}-${c.province_code}`} value={c.key}>{c.key}{c.province_code ? `, ${c.province_code}` : ''}</option>)}</select></label>
      <label className="space-y-1 text-xs text-market-muted">Service<select className={selectClass} value={filters.category} onChange={(e) => set('category',e.target.value)}><option value="all">All tracked services</option>{Object.entries(CATEGORY_LABELS).map(([c,n]) => <option key={c} value={c}>{n}</option>)}</select></label>
      <label className="space-y-1 text-xs text-market-muted">History from<input type="month" className={selectClass} value={filters.periodFrom} max={filters.periodTo || undefined} onChange={(e) => set('periodFrom',e.target.value)} /></label>
      <label className="space-y-1 text-xs text-market-muted">Through reporting month<input type="month" className={selectClass} value={filters.periodTo} min={filters.periodFrom || undefined} onChange={(e) => set('periodTo',e.target.value)} /></label>
      <button className="text-left text-xs font-bold text-market-accent" onClick={() => onChange({province:'',city:'',category:'all',periodFrom:'',periodTo:''})}>Reset to Canada</button>
    </div>
  );
}