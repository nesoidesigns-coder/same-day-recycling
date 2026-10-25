import { ArrowRight, Sparkles } from "lucide-react";
import usePickupLocation from "@/hooks/usePickupLocation";
import { pickupLocationActions, pickupRexContext } from "@/lib/pickupLocationStore";
import PickupJobPreparation from "@/components/sdr/PickupJobPreparation";

export default function PickupLocationActions({ lang = "en" }) {
  const pickup = usePickupLocation();
  const fr = lang === "fr";
  const askRex = () => window.dispatchEvent(new CustomEvent("rex:open", { detail: { question: `${pickupRexContext()} ${fr ? "Réponds en français. Où se trouvent les objets, à l'intérieur ou à l'extérieur ?" : "Begin job preparation by asking me whether the items are inside or outside."}` } }));
  const continuePickup = () => {
    pickupLocationActions.confirmPin();
    window.dispatchEvent(new CustomEvent("pickup:continue"));
  };
  return <div className="mt-3 space-y-2">
    <p className="text-xs text-market-muted">{fr ? "Confirmez l'épingle, ou déplacez-la vers l'entrée de chargement. Rex : les objets sont-ils à l'intérieur ou à l'extérieur ?" : "Confirm the pin, or move it to your loading entrance. Rex: are the items inside or outside?"}</p>
    <button type="button" onClick={continuePickup} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-market-accent px-4 py-3 text-sm font-bold text-market-bg"><ArrowRight className="h-4 w-4" />{fr ? "Confirmer et continuer aux détails" : "Confirm pin & continue to pickup details"}</button>
    <button type="button" onClick={askRex} className="flex min-h-11 items-center gap-2 rounded-full border border-market-line px-4 text-sm font-bold text-market-ink"><Sparkles className="h-4 w-4" />{fr ? "Préparer le travail avec Rex" : "Prepare my job with Rex"}</button>
    <PickupJobPreparation lang={lang} />
    {pickup?.pinConfirmed && <p role="status" className="text-xs text-market-accent">{fr ? "Épingle confirmée et conservée dans cette session." : "Pickup pin confirmed and retained in this booking session."}</p>}
  </div>;
}