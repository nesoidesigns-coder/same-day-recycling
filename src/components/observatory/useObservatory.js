import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

// Observatory data hook — polls the verified feed every 60s and revalidates
// instantly when public opportunity records change (real-time subscription).
// Never manufactures events: everything comes from the observatoryFeed endpoint.
export default function useObservatory() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['observatoryFeed'],
    queryFn: async () => (await base44.functions.invoke('observatoryFeed', {})).data,
    staleTime: 30000,
    refetchInterval: 60000,
    retry: false,
  });

  useEffect(() => {
    // Real-time: any new booking, quote request or public opportunity
    // revalidates the feed immediately, so the demand map and counters
    // update without waiting for the 60s poll.
    const unsubs = [
      base44.entities.PublicOpportunity.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ['observatoryFeed'] });
      }),
      base44.entities.Booking.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ['observatoryFeed'] });
      }),
      base44.entities.QuoteLead.subscribe(() => {
        queryClient.invalidateQueries({ queryKey: ['observatoryFeed'] });
      }),
    ];
    return () => unsubs.forEach((unsub) => unsub());
  }, [queryClient]);

  return query;
}

export const LAYER_META = {
  live: { label: 'LIVE', tone: 'bg-[#187B65]/20 text-[#54D9AE]' },
  recent: { label: 'RECENT', tone: 'bg-amber-400/15 text-amber-300' },
  historical: { label: 'HISTORICAL', tone: 'bg-white/10 text-market-muted' },
  unavailable: { label: 'UNAVAILABLE', tone: 'bg-red-400/10 text-red-300' },
};

export const SOURCE_STATUS_META = {
  connected: { label: 'Connected', dot: 'bg-[#54D9AE]', text: 'text-[#54D9AE]' },
  synchronizing: { label: 'Synchronizing', dot: 'bg-amber-300', text: 'text-amber-300' },
  delayed: { label: 'Delayed', dot: 'bg-amber-300', text: 'text-amber-300' },
  unavailable: { label: 'Unavailable', dot: 'bg-red-400', text: 'text-red-300' },
  historical_data_only: { label: 'Historical data only', dot: 'bg-market-muted', text: 'text-market-muted' },
};

export const fmtTime = (iso) => (iso
  ? new Date(iso).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
  : '—');