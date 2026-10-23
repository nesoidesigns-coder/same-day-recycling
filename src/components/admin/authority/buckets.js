// Distinct indexing statuses — each maps only to a verdict the URL Inspection
// API itself reported. Nothing is inferred from "unknown".
export const BUCKETS = {
  indexed: { label: 'Indexed', cls: 'bg-[#187B65]/10 text-[#187B65]' },
  discovered_not_indexed: { label: 'Discovered, not indexed', cls: 'bg-amber-50 text-amber-700' },
  crawled_not_indexed: { label: 'Crawled, not indexed', cls: 'bg-amber-50 text-amber-700' },
  blocked_by_robots: { label: 'Blocked by robots', cls: 'bg-red-50 text-red-700' },
  noindex: { label: 'Noindex', cls: 'bg-red-50 text-red-700' },
  canonical_conflict: { label: 'Canonical conflict', cls: 'bg-red-50 text-red-700' },
  alternate_canonical: { label: 'Duplicate (canonical set)', cls: 'bg-slate-100 text-slate-600' },
  unknown_to_google: { label: 'Unknown to Google', cls: 'bg-slate-100 text-slate-600' },
  fetch_error: { label: 'Page fetch error', cls: 'bg-red-50 text-red-700' },
  redirected: { label: 'Redirected', cls: 'bg-slate-100 text-slate-600' },
  inspection_unavailable: { label: 'Inspection unavailable', cls: 'bg-slate-100 text-slate-500' },
  page_check: { label: 'Page quality check', cls: 'bg-blue-50 text-blue-700' },
  sitemap_missing: { label: 'Missing from sitemap', cls: 'bg-amber-50 text-amber-700' },
};

export const bucketCls = (b) => (BUCKETS[b] || BUCKETS.inspection_unavailable).cls;
export const bucketLabel = (b) => (BUCKETS[b] || BUCKETS.inspection_unavailable).label;

export const PRIORITY_BADGE = {
  1: { label: 'P1 · Critical', cls: 'bg-red-50 text-red-700' },
  2: { label: 'P2 · Fix soon', cls: 'bg-amber-50 text-amber-700' },
  3: { label: 'P3 · Monitor', cls: 'bg-slate-100 text-slate-500' },
};

export const fmtDate = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  return isNaN(d) ? v : d.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' });
};