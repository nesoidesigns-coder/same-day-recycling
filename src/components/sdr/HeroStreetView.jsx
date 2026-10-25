import { useState } from "react";
import { Loader2 } from "lucide-react";
import usePickupLocation from "@/hooks/usePickupLocation";

// Open only a provider-verified photograph, never a guessed city-center embed.
export default function HeroStreetView({ lang = "en" }) {
  const pickup = usePickupLocation(), fr = lang === "fr";
  const [loaded, setLoaded] = useState(false), [failed, setFailed] = useState(false);
  const imagery = pickup?.imagery;
  if (imagery?.status !== "available") return null;
  return <div className="rounded-xl border border-market-line bg-market-bg p-2">
    <div className="relative h-72 overflow-hidden rounded-lg">
      {!loaded && !failed && <div className="absolute inset-0 flex items-center justify-center" role="status"><Loader2 className="h-5 w-5 animate-spin" /></div>}
      {!failed && <iframe title={`${fr ? "Photographie de rue près de" : "Street photograph near"} ${pickup.formattedAddress}`} src={imagery.viewer_url} className="relative h-full w-full border-0" allowFullScreen loading="lazy" referrerPolicy="no-referrer" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />}
      {failed && <p role="status" className="p-4 text-sm">{fr ? "Le panorama n'a pas pu être chargé. Utilisez la carte ou le satellite." : "The street scene could not load. Use Map or Satellite instead."}</p>}
    </div>
    <p className="mt-2 text-xs text-market-muted">{imagery.credit} · {imagery.license} · {imagery.captured_at?.slice(0, 10)} · {imagery.distance_m} m {fr ? "de l'épingle. Photo à proximité, pas une confirmation de l'accès à la propriété." : "from your pin. Nearby photography, not confirmation of property access."}</p>
    <a href={imagery.viewer_url} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-11 items-center text-xs text-market-accent underline">{fr ? "Ouvrir la photo Panoramax" : "Open this Panoramax photograph"}</a>
  </div>;
}