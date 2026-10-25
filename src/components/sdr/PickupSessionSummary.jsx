import { MapPin } from "lucide-react";
import usePickupLocation from "@/hooks/usePickupLocation";
import { pickupLocationActions } from "@/lib/pickupLocationStore";

export default function PickupSessionSummary({ lang = "en", editable = false }) {
  const pickup = usePickupLocation(), fr = lang === "fr";
  if (!pickup) return null;
  return <div className="mb-3 rounded-xl border border-market-line bg-market-bg p-3">
    <div className="flex items-start gap-2"><MapPin className="mt-1 h-4 w-4 shrink-0 text-market-accent" /><div className="min-w-0"><p className="text-sm font-bold">{pickup.formattedAddress}</p><p className="mt-1 text-xs text-market-muted">{pickup.pinConfirmed ? (fr ? "Épingle confirmée pour cette demande." : "Confirmed pickup pin retained for this request.") : (fr ? "Confirmez l'épingle sur la carte avant de continuer." : "Confirm the pickup pin on the map before continuing.")}</p></div></div>
    {editable && <label className="mt-2 block text-xs font-semibold">{fr ? "Unité / appartement (facultatif)" : "Unit / apartment (optional)"}<input value={pickup.unit} onChange={(e) => pickupLocationActions.updateUnit(e.target.value)} maxLength={40} autoComplete="address-line2" className="mt-1 min-h-11 w-full rounded-lg border border-input bg-background px-3 text-base text-foreground" /></label>}
    <button type="button" onClick={() => document.getElementById("pickup-location-details")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })} className="mt-2 min-h-11 text-xs font-bold text-market-accent underline">{fr ? "Vérifier ou ajuster l'épingle" : "Review or adjust pickup pin"}</button>
  </div>;
}