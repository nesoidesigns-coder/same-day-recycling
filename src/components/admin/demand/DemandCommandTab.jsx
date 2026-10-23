import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import MarketObservatory from '@/components/demand/MarketObservatory';
import CommandGauges from '@/components/admin/demand/CommandGauges';
import RexRecommendPanel from '@/components/admin/demand/RexRecommendPanel';

export default function DemandCommandTab({ report, onOpenImport }) {
  const query = useQuery({
    queryKey: ['marketObservatory', 'auto'],
    queryFn: async () => (await base44.functions.invoke('demandReport', { view: 'command', filters: { engine: 'google' } })).data,
    staleTime: 60000, refetchInterval: 900000, retry: false,
  });
  return <div>
    <CommandGauges data={query.data} loading={query.isPending} error={query.isError} />
    <MarketObservatory onImport={onOpenImport} showHistory />
    <RexRecommendPanel report={report} />
  </div>;
}