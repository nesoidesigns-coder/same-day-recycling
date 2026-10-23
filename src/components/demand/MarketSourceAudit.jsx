import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function MarketSourceAudit() {
  const query = useQuery({queryKey:['marketObservatory','','all',''],queryFn:async () => (await base44.functions.invoke('demandReport',{view:'command',filters:{engine:'google'}})).data,staleTime:60000});
  const report = query.data;
  return <section className="rounded-2xl border border-border bg-card p-5 text-card-foreground">
    <h3 className="font-bold">Historical market data audit</h3>
    {query.isPending && <p role="status" className="mt-2 text-sm text-muted-foreground">Reading stored market observations…</p>}
    {query.isError && <p role="alert" className="mt-2 text-sm text-destructive">The market-data audit could not be loaded.</p>}
    {report && <>
      <p className="mt-2 text-sm">Stored source observations: <strong>{report.data_status.stored_observations.toLocaleString('en-CA')}</strong></p>
      <p className="mt-2 text-sm text-muted-foreground">{report.data_status.note}</p>
      <p className="mt-2 text-xs text-muted-foreground">Historical coverage: {report.history_coverage.first_period || 'not backfilled'}{report.history_coverage.last_period ? ` to ${report.history_coverage.last_period}` : ''}. Website launch date, visits, campaign clicks and bookings are not market-data inputs.</p>
      <p className="mt-2 text-xs text-muted-foreground">Source observations do not prove a current API connection. Authorization is verified only by a successful provider request; a provider error is not an absence of Canadian search history.</p>
    </>}
  </section>;
}