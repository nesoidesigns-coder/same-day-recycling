import { useState } from 'react';
import { base44 } from '@/api/base44Client';

// On-demand fetch of real Google Trends samples (Canada, rolling 5-year
// window) into the market observation store. Relative interest only.
export default function TrendsFetch({ onSynced }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const run = async () => {
    setBusy(true); setError(''); setResult(null);
    try {
      const res = await base44.functions.invoke('industryTrendsSync', {});
      setResult(res.data);
      await onSynced?.();
    } catch (e) {
      setError(e?.response?.data?.error || e.message || 'The Trends fetch failed.');
    }
    setBusy(false);
  };

  return (
    <section className="rounded-3xl border border-market-line bg-market-surface p-5">
      <h3 className="font-bold text-market-ink">Google Trends (online fetch)</h3>
      <p className="mt-1 text-xs leading-relaxed text-market-muted">
        Fetches real Google Trends samples for Canada across ten removal and recycling terms,
        rolling 5-year weekly window, no credentials required. Stored as relative interest (0-100
        per keyword group's window) — never search volumes, and never mixed with monthly volume
        estimates. Monthly volume history still requires the Keyword Planner connection.
      </p>
      <button onClick={run} disabled={busy}
        className="mt-3 rounded-full bg-market-accent px-5 py-2 text-sm font-bold text-[#051511] disabled:opacity-50">
        {busy ? 'Fetching Trends samples…' : 'Fetch Google Trends now'}
      </button>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {result && !error && (
        <div className="mt-3 rounded-xl border border-market-line bg-market-bg p-3 text-xs leading-relaxed text-market-muted">
          <p className="font-bold text-market-ink">{result.status === 'success' ? 'Fetched and stored.' : result.status === 'partial' ? 'Partially fetched.' : 'Fetch failed; nothing stored.'}</p>
          <p>{result.coverage_note}</p>
          {result.groups?.map((g) => (
            <p key={g.comparison_group} className="mt-1">{g.keywords.join(' + ')} — {g.records} monthly samples, {g.window}.</p>
          ))}
        </div>
      )}
    </section>
  );
}