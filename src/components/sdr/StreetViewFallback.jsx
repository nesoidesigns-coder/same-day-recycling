import { ExternalLink } from "lucide-react";
import usePickupLocation from "@/hooks/usePickupLocation";

// Shown when no openly licensed street photo exists near the pin: send the
// customer to Google Street View at their confirmed coordinates in a new tab.
export default function StreetViewFallback({ lang = "en" }) {
  const pickup = usePickupLocation(), fr = lang === "fr";
  if (!pickup) return null;
  const url = pickup.imagery?.google_maps_url || `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${pickup.lat},${pickup.lng}`;
  return (
    <div className="rounded-xl border border-market-line bg-market-surface p-4" role="status">
      <p className="text-sm">{fr ? "Aucune photo de rue libre n'est disponible à moins de 100 m de votre épingle." : "No openly licensed street photo is available within 100 m of your pin."}</p>
      <p className="mt-1 text-xs text-market-muted">{fr ? "Ouvrez Street View de Google à vos coordonnées confirmées — il s'ouvre dans un nouvel onglet." : "Open Google Street View at your confirmed coordinates — it opens in a new tab."}</p>
      <a href={url} target="_blank" rel="noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-market-accent px-5 text-sm font-bold text-market-bg">
        <ExternalLink className="h-4 w-4" /> {fr ? "Ouvrir Street View" : "Open Street View"}
      </a>
      <p className="mt-2 text-[11px] text-market-muted">{fr ? "Google Street View est un service de Google, utilisé à l'extérieur de l'application." : "Google Street View is a Google service, opened outside this app."}</p>
    </div>
  );
}