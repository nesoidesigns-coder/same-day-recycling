import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import ProviderOptions from '@/components/demand/ProviderOptions';
import KeywordPlannerAccess from '@/components/demand/KeywordPlannerAccess';
import MarketSourceAudit from '@/components/demand/MarketSourceAudit';

export default function DemandHealthTab({ onOpenImport, onRefresh }) {
  const [logs,setLogs]=useState([]), [error,setError]=useState('');
  const load=async () => {const page=await base44.entities.DemandSyncLog.filter({source:{$in:['import','google_ads_keyword_planner','google_trends']}},{sort:'-created_date',limit:30});setLogs(page.items || []);};
  useEffect(() => {load().catch(() => setError('Source history could not be loaded.'));},[]);
  return <div className="space-y-5">
    <MarketSourceAudit/>
    <div className="rounded-3xl bg-market-bg p-5"><ProviderOptions onImport={onOpenImport}/></div>
    <KeywordPlannerAccess onSynced={async () => {await load();await onRefresh?.();}}/>
    <section><h3 className="font-bold">Market-source refresh history</h3><p className="mt-1 text-xs text-muted-foreground">Market data only. Company Search Console, Analytics and operations refresh separately under Private Performance. An imported dataset is not an API connection.</p>
      {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
      {!logs.length ? <p className="py-6 text-sm text-muted-foreground">No market-source refreshes recorded.</p> : <div className="mt-4 overflow-auto"><table className="w-full min-w-[600px] text-left text-xs"><thead><tr>{['Refresh time','Source','Status','Coverage / cadence'].map((h) => <th className="p-3" key={h}>{h}</th>)}</tr></thead><tbody>{logs.map((r) => <tr key={r.id} className="border-t border-border"><td className="p-3">{new Date(r.finished_at || r.created_date).toLocaleString('en-CA')}</td><td className="p-3">{r.source}</td><td className="p-3">{r.status}</td><td className="p-3">{r.coverage_note || r.error}<span className="mt-1 block text-muted-foreground">{r.next_update_cadence}</span></td></tr>)}</tbody></table></div>}
    </section>
  </div>;
}