import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { invoke, buildActivitySegments, buildCoverageSegments, totalActivity } from "./siShared";

// One data hook for the Service Intelligence homepage. Each query maps 1:1 to
// a verified source; nothing is derived, blended or extrapolated here.
export default function useServiceIntelligence({ days = 90, city = "" }) {
  const coverage = useCoverageStatus();

  const activity = useQuery({
    queryKey: ["si-activity", days],
    queryFn: () => invoke("liveIntelligence", { action: "gauge", days }),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const prices = useQuery({
    queryKey: ["si-prices", city],
    queryFn: () => invoke("cityPricing", { city }),
    enabled: true,
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  const resources = useQuery({
    queryKey: ["si-resources", city],
    queryFn: () => invoke("recyclingCenters", { action: "list", city }),
    enabled: Boolean(city),
    staleTime: 300_000,
    refetchOnWindowFocus: false,
  });

  const activitySegments = useMemo(() => buildActivitySegments(activity.data), [activity.data]);
  const activityTotal = useMemo(() => totalActivity(activitySegments), [activitySegments]);
  const coverageSegments = useMemo(() => buildCoverageSegments(coverage), [coverage]);

  return { coverage, activity, activitySegments, activityTotal, coverageSegments, prices, resources };
}