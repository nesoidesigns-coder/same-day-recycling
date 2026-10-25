import { Suspense, lazy } from "react";
import { CheckCircle2, Loader2, Sparkles, X } from "lucide-react";
import PickupCoverageNotice from "@/components/sdr/PickupCoverageNotice";

const PickupLocationMap = lazy(() => import("@/components/sdr/PickupLocationMap"));

// Pickup-location confirmation for the address-responsive booking experience:
// the verified address, the adjustable pickup pin on a detailed local map,
// the real coverage status and Rex job preparation. Shown only to the
// customer in their own booking view — the exact address is never published
// on any public surface.
export default function PickupLocationPanel({ pickup, onClose, onSkip, lang = "en" }) {
  const fr = lang === "fr";
  const rexQuestion = fr
    ? `Je prépare un ramassage à ${pickup.address}, ${pickup.city}, ${pickup.province_name}. Aidez-moi à préparer le mandat : les objets sont-ils à l'intérieur ou à l'extérieur ? Y a-t-il des escaliers ? Un ascenseur est-il disponible ? Où le camion peut-il se garer ? Y a-t-il une zone de chargement ? Y a-t-il des objets volumineux ou lourds ? Le client peut-il envoyer des photos ?`
    : `I am preparing a pickup at ${pickup.address}, ${pickup.city}, ${pickup.province_name}. Help me build the job brief: are the items inside or outside? Are there stairs? Is elevator access available? Where can the truck park? Is there a loading area? Are there large or heavy items? Can the customer upload photographs?`;
  const onMove = (lat, lng) => {
    window.dispatchEvent(new CustomEvent("pickup:adjust", { detail: { lat, lng } }));
  };
  return (
    <section className="relative border-t border-market-line px-4 pb-4 pt-3" aria-label={fr ? "Confirmation du lieu de ramassage" : "Pickup location confirmation"} aria-live="polite">
      <button onClick={onClose} aria-label={fr ? "Fermer les détails du lieu" : "Close location details"} className="absolute right-2 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full text-market-ink hover:bg-market-bg"><X className="h-5 w-5" /></button>
      <div className="flex items-start gap-2 pr-10">
        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-[#54D9AE]" />
        <div className="min-w-0">
          <h3 className="text-base font-bold leading-snug">{fr ? "Lieu de ramassage confirmé" : "Pickup location confirmed"}</h3>
          <p className="mt-0.5 break-words text-sm text-market-muted">
            {pickup.address}{pickup.unit ? `, ${fr ? "unité" : "unit"} ${pickup.unit}` : ""}
            {pickup.city ? ` · ${pickup.city}` : ""}{pickup.province_name ? `, ${pickup.province_name}` : ""}
          </p>
        </div>
      </div>
      <PickupCoverageNotice city={pickup.city} lang={lang} dark />
      {pickup.adjusted && (
        <p className="mt-1 text-xs font-semibold text-[#54D9AE]">{fr ? "Épingle ajustée à l'entrée de chargement — enregistrée avec la demande." : "Pin adjusted to your loading entrance — saved with the request."}</p>
      )}
      <div className="mt-3">
        <Suspense fallback={<div className="flex h-64 items-center justify-center rounded-xl border border-market-line bg-market-bg" role="status"><Loader2 className="h-5 w-5 animate-spin text-market-muted" /></div>}>
          <PickupLocationMap lat={pickup.lat} lng={pickup.lng} onMove={onMove} lang={lang} />
        </Suspense>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={() => window.dispatchEvent(new CustomEvent("rex:open", { detail: { question: rexQuestion } }))} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-market-accent px-4 text-sm font-bold text-market-bg">
          <Sparkles className="h-4 w-4" /> {fr ? "Demander à Rex de préparer le travail" : "Ask Rex to prepare my job"}
        </button>
        {onSkip && !pickup.instant && (
          <button onClick={onSkip} className="min-h-11 rounded-full border border-market-line px-4 text-sm font-bold text-market-ink">{fr ? "Passer l'animation" : "Skip animation"}</button>
        )}
      </div>
    </section>
  );
}