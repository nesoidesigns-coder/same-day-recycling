import { useSyncExternalStore } from "react";
import { getPickupLocation, subscribePickupLocation } from "@/lib/pickupLocationStore";

export default function usePickupLocation() {
  return useSyncExternalStore(subscribePickupLocation, getPickupLocation, () => null);
}