import { useState } from 'react';
import { base44 } from '@/api/base44Client';

export default function KeywordPlannerAccess({ onSynced }) {
  const [status,setStatus]=useState(null), [busy,setBusy]=useState(false), [message,setMessage]=useState('');
  const run=async (checkOnly) => {
    setBusy(true);setMessage('');
    try {const {data}=await base44.functions.invoke('keywordVolume',{checkOnly});if(checkOnly) setStatus(data);else {setMessage(data.error || `${data.records_upserted || 0} observations retrieved. ${data.coverage_note || ''}`);await onSynced?.();}}
    catch(e) {setMessage(e?.response?.data?.error || 'Optional Keyword Planner connection is not configured or could not be checked. Use a licensed provider export instead.');}
    finally {setBusy(false);}
  };
  return <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
    <h3 className="font-bold">Optional Keyword Planner API</h3>
    <p className="mt-2 text-xs text-muted-foreground">This is one market source, not a required advertising integration. Credentials configured does not mean API access has been verified. No campaign performance is read here.</p>
    <div className="mt-3 flex flex-wrap gap-3"><button onClick={() => run(true)} disabled={busy} className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-50">{busy ? 'Working…' : 'Check optional API configuration'}</button><button onClick={() => run(false)} disabled={busy || !status?.connected} className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Retrieve industry keyword estimates</button></div>
    {status && <p className="mt-3 text-xs text-muted-foreground">{status.connected ? 'Credentials configured; retrieval verifies access.' : `Not configured: ${(status.missing || []).join(', ')}. Independent dataset imports remain available.`}</p>}
    {message && <p role="status" className="mt-3 text-xs text-muted-foreground">{message}</p>}
  </section>;
}