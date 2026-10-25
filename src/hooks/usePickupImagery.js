import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import usePickupLocation from "@/hooks/usePickupLocation";
import { pickupLocationActions } from "@/lib/pickupLocationStore";

export default function usePickupImagery() {
  const pickup = usePickupLocation();
  const lat = pickup?.lat, lng = pickup?.lng, id = pickup?.selectionId;
  const query = useQuery({ queryKey: ["pickupStreetImagery", lat, lng], enabled: !!id,
    queryFn: async () => (await base44.functions.invoke("streetImagery", { lat, lng })).data,
    staleTime: 300000, retry: false });
  useEffect(() => {
    if (id) pickupLocationActions.setImagery(id, lat, lng, query.isError ? { status: "provider_error" } : query.data || { status: "checking" });
  }, [id, lat, lng, query.data, query.isError]);
  return query;
}