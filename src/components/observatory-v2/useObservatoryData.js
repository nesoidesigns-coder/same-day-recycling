import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import useCoverageStatus from '@/hooks/useCoverageStatus';
import { CITIES } from '@/lib/cities';
import { invoke, keyOf, project } from '@/components/observatory-v2/observatoryData';

export default function useObservatoryData({ city, province, category, days }) {
  const coverage = useCoverageStatus();
  const national = useQuery({ queryKey: ['obs-signals', days, category], queryFn: () => invoke('liveIntelligence', { action: 'gauge', days, category }), staleTime: 60000, refetchOnWindowFocus: false });
  const scoped = useQuery({ queryKey: ['obs-local', days, category, province, city], queryFn: () => invoke('liveIntelligence', { action: 'gauge', days, category, province, city }), enabled: Boolean(city || province), staleTime: 60000, refetchOnWindowFocus: false });
  const prices = useQuery({ queryKey: ['obs-prices', city], queryFn: () => invoke('cityPricing', { city }), staleTime: 300000, refetchOnWindowFocus: false });
  const resources = useQuery({ queryKey: ['obs-resources', city], queryFn: () => invoke('recyclingCenters', { action: 'list', city }), enabled: Boolean(city), staleTime: 300000, refetchOnWindowFocus: false });
  const locations = useMemo(() => {
    const registry = new Map(CITIES.map(c => [keyOf(c.name), c]));
    for (const c of coverage.locations) registry.set(keyOf(c.name), { ...registry.get(keyOf(c.name)), ...c });
    return [...registry.values()].filter(c => Number.isFinite(c.lat) && Number.isFinite(c.lng)).map(c => ({ ...c, ...project(c.lng, c.lat), state: coverage.statusFor(c.name), capacity: coverage.capacityFor(c.name), observations: national.data?.cities?.find(r => keyOf(r.city) === keyOf(c.name))?.count ?? null }));
  }, [coverage, national.data]);
  return { coverage, locations, national, signals: city || province ? scoped : national, prices, resources };
}