import { Suspense, lazy } from "react";
import { Loader2, MapPin } from "lucide-react";
import PickupCoverageNotice from "@/components/sdr/PickupCoverageNotice";
import PickupLocationActions from "@/components/sdr/PickupLocationActions";
import usePickupLocation from "@/hooks/usePickupLocation";
import usePickupImagery from "@/hooks/usePickupImagery";
import { pickupLocationActions } from "@/lib/pickupLocationStore";
const PickupLocationMap = lazy(() => import("@/components/sdr/PickupLocationMap"));

export default function PickupLocationPanel({ lang = "en" }) {
  const pickup = usePickupLocation(), fr = lang === "fr";
  usePickupImagery();
  if (!pickup) return null;
  return <section id="pickup-location-details" className="relative border-t border-market-line px-4 pb-4 pt-3" aria-label={fr ? "Votre lieu de ramassage" : "Your pickup location"}>
    <div className="flex items-start gap-2"><MapPin className="mt-1 h-5 w-5 shrink-0 text-market-accent" /><div className="min-w-0">
      <h3 className="text-base font-bold">{fr ? "Votre lieu de ramassage" : "Your pickup location"}</h3>
      <p className="mt-1 break-words text-sm">{pickup.formattedAddress}</p>
      <p className="mt-1 text-xs text-market-muted">{pickup.confidence === "address" ? (fr ? "Adresse trouvée dans OpenStreetMap. Vérifiez l'épingle." : "Address matched in OpenStreetMap. Check the pickup pin.") : (fr ? "Correspondance approximative : confirmez le bâtiment sur la carte." : "Approximate street match: confirm the building on the map.")}</p>
      <p className="mt-1 font-mono text-xs text-market-muted">{pickup.lat.toFixed(6)}, {pickup.lng.toFixed(6)}</p>
    </div></div>
    <PickupCoverageNotice city={pickup.city} lang={lang} dark />
    {pickup.adjusted && <p className="mt-1 text-xs text-market-accent">{fr ? "Épingle déplacée. Confirmez la nouvelle entrée de chargement." : "Pin moved. Confirm the new loading entrance."}</p>}
    <div className="mt-3"><Suspense fallback={<div className="flex h-64 items-center justify-center" role="status"><Loader2 className="h-5 w-5 animate-spin" /></div>}><PickupLocationMap lang={lang} /></Suspense></div>
    <PickupLocationActions lang={lang} />
    {!pickup.instant && <button type="button" onClick={pickupLocationActions.skipAnimation} className="mt-2 min-h-11 text-xs text-market-muted underline">{fr ? "Passer l'animation du globe" : "Skip globe animation"}</button>}
  </section>;
}