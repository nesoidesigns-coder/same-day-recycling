import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import HistoricalAccessRequirements from '@/components/demand/HistoricalAccessRequirements';
import KeywordLibraryEditor from '@/components/demand/KeywordLibraryEditor';

// Google Ads Keyword Planner connection + collection plan.
// Nothing here invents a volume: it reports which credential fields are
// present, what the collector would request, and where. Real figures appear
// only after the API returns them into DemandObservation.
export default function KeywordPlannerAccess({ onSynced }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  const run = async (checkOnly) => {
    setBusy(true); setMessage('');
    try {
      const { data } = await base44.functions.invoke('keywordVolume', { checkOnly });
      if (checkOnly) setStatus(data);
      else {
        setMessage(data.error || `${data.records_upserted || 0} observations retrieved. ${data.coverage_note || ''}`);
        await onSynced?.();
      }
    } catch (e) {
      setMessage(e?.response?.data?.error || 'Provider check could not run. The historical-data connection remains pending, not connected; the required authorization fields are listed above.');
    } finally { setBusy(false); }
  };

  const geo = status?.geographies;
  const library = status?.keyword_library || [];

  return <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
    <h3 className="font-bold">Google historical search data: authorization pending verification</h3>
    <HistoricalAccessRequirements />

    <div className="mt-3 flex flex-wrap gap-3">
      <button onClick={() => run(true)} disabled={busy} className="rounded-xl border border-border px-4 py-2 text-sm disabled:opacity-50">{busy ? 'Working…' : 'Check optional API configuration'}</button>
      <button onClick={() => run(false)} disabled={busy || !status?.connected} className="rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50">Retrieve industry keyword estimates</button>
    </div>

    {status && <p className="mt-3 text-xs text-muted-foreground">
      {status.connected
        ? 'Credential fields supplied, but API authorization and historical retrieval remain unverified until a retrieval run succeeds.'
        : `Historical retrieval unavailable. Missing: ${(status.missing || []).join(', ')}. Independent licensed history imports remain available.`}
      {status.cadence && <> Cadence: {status.cadence}.</>}
    </p>}
    {message && <p role="status" className="mt-3 text-xs text-muted-foreground">{message}</p>}

    {(library.length > 0 || geo) && <div className="mt-5 grid gap-4 md:grid-cols-2">
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Tracked keyword library ({library.length})</div>
        <p className="mt-1 text-[11px] text-muted-foreground">The collector requests these expressions; Keyword Planner returns the variants and volumes. A keyword in this list has no volume until the source returns one.</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {library.map((k) => <span key={k} className="rounded-full border border-border px-2 py-0.5 text-[11px]">{k}</span>)}
        </div>
      </div>
      <div>
        <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Location targeting</div>
        {geo ? <>
          <p className="mt-1 text-[11px] text-muted-foreground">Resolved from Google geo target constants at run time; a geography the source cannot resolve is reported as unresolved, never estimated.</p>
          <dl className="mt-2 space-y-1 text-xs">
            <div><dt className="inline font-semibold">National: </dt><dd className="inline">{geo.national?.join(', ')}</dd></div>
            <div><dt className="inline font-semibold">Provinces/territories: </dt><dd className="inline">{geo.provinces?.length} ({geo.provinces?.map((p) => p.code).join(', ')})</dd></div>
            <div><dt className="inline font-semibold">Cities: </dt><dd className="inline">{geo.cities?.length} ({geo.cities?.join(', ')})</dd></div>
          </dl>
        </> : <p className="mt-2 text-xs text-muted-foreground">Run the configuration check to list the targeted geographies.</p>}
      </div>
    </div>}

    <KeywordLibraryEditor onSaved={() => run(true)} />
  </section>;
}