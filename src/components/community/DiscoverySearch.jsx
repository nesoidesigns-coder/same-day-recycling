import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, ArrowLeft, Radar, Search } from 'lucide-react';
import DiscoveryCard from '@/components/community/DiscoveryCard';
import { trackGA } from '@/lib/communityAnalytics';

const EXAMPLES = [
  'Find public furniture removal requests in Vancouver',
  'Show recent appliance pickup requests in Calgary',
  'Find posts asking about mattress disposal',
];

export default function DiscoverySearch({ me, onExit }) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState(null);
  const [filters, setFilters] = useState(null);
  const [error, setError] = useState('');

  const run = async (e) => {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    trackGA('community_discovery_search', {});
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('demandDiscovery', { action: 'search', q: query });
      setResults(res.data?.results || []);
      setFilters(res.data?.filters_used || null);
    } catch (err) {
      setError(err?.response?.data?.error || 'Search could not be completed right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onExit} className="inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65] hover:underline"><ArrowLeft className="w-3.5 h-3.5" /> Back to discovery feed</button>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <h3 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><Radar className="w-4 h-4 text-[#187B65]" /> AI discovery search</h3>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">Ask in plain language. Answers come only from verified public posts already discovered — every result links to its original source. When nothing was found, you'll be told plainly.</p>
        <form onSubmit={run} className="mt-3 flex gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} className="input flex-1" placeholder="e.g. Find furniture removal requests in Vancouver" aria-label="Search public opportunities" />
          <button type="submit" disabled={busy || !q.trim()} className="shrink-0 rounded-xl bg-[#187B65] px-4 text-sm font-bold text-white disabled:opacity-40 flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Search
          </button>
        </form>
        {results === null && !busy && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {EXAMPLES.map((x) => (
              <button key={x} onClick={() => setQ(x)} className="rounded-full border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors">{x}</button>
            ))}
          </div>
        )}
      </div>

      {busy && <div className="flex items-center gap-2 py-6 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Searching verified public posts…</div>}
      {error && <p className="flex items-center gap-2 text-sm text-red-600" role="alert"><Radar className="w-4 h-4" /> {error}</p>}

      {results !== null && !busy && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">{results.length === 0 ? 'No verified public posts matched that question yet.' : `${results.length} verified public post${results.length === 1 ? '' : 's'} found.`}</p>
          {filters && (filters.keywords?.length || filters.province || filters.category) && (
            <div className="flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {(filters.keywords || []).map((k) => <span key={k} className="rounded-full bg-slate-100 px-2 py-0.5">{k}</span>)}
              {filters.province && <span className="rounded-full bg-slate-100 px-2 py-0.5">{filters.province}</span>}
              {filters.category && <span className="rounded-full bg-slate-100 px-2 py-0.5">{filters.category.replace(/_/g, ' ')}</span>}
            </div>
          )}
          {results.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-sm font-bold text-[#102B2A]">Nothing found yet</p>
              <p className="mt-1 text-xs text-slate-500">The discovery engine only reports real public posts it has verified — it never invents demand. Try a broader question, a longer time window, or check back as new sources are discovered daily.</p>
            </div>
          )}
          <div className="space-y-3">
            {results.map((item) => <DiscoveryCard key={item.id} item={item} me={me} />)}
          </div>
        </div>
      )}
    </div>
  );
}