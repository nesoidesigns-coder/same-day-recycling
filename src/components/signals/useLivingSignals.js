import { useQuery } from "@tanstack/react-query";
import { invoke } from "@/components/si/siShared";

// One hook for every Living Signals display. Returns the normalized feed
// from the livingSignals engine (all records already sanitized and labelled
// server-side). Data is refetched at most every two minutes; displays stay
// stable between refetches.
export default function useLivingSignals({ scope = "national", province = "", city = "", category = "", days = 90 } = {}) {
  return useQuery({
    queryKey: ["living-signals", scope, province, city, category, days],
    queryFn: () => invoke("livingSignals", { scope, province, city, category, days }),
    staleTime: 120_000,
    refetchOnWindowFocus: false,
  });
}