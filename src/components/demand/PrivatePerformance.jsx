import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { CurrentCapturePanel } from '@/components/admin/demand/SitePerformancePanel';

export default function PrivatePerformance({ report, onRefresh }) {
  const [busy,setBusy]=useState(false),[error,setError]=useState('');
  const refresh=async () => {setBusy(true);setError('');try {await base44.functions.invoke('demandSync',{});await onRefresh();} catch(e) {setError(e?.response?.data?.error || 'Could not refresh private analytics.');} finally {setBusy(false);}};
  return <section className="rounded-3xl bg-market-bg p-5 text-market-ink">
    <h2 className="text-lg font-extrabold">Private Recycling OS performance</h2>
    <p className="mt-2 text-sm text-market-muted">Measured company website activity and operational records. These figures are excluded from the public observatory and are never used as estimates of Canadian demand.</p>
    <button disabled={busy} onClick={refresh} className="mt-4 rounded-xl border border-market-line px-4 py-2 text-sm font-bold disabled:opacity-50">{busy ? 'Refreshing private analytics…' : 'Refresh private analytics'}</button>
    {error && <p role="alert" className="mt-3 text-xs text-market-muted">{error}</p>}
    <CurrentCapturePanel data={report}/>
  </section>;
}