import { useState } from "react";
import { MapPinned, X } from "lucide-react";

// Google Earth-style chain, step 2: true Street View of the selected city,
// embedded from Google's public Street View embed (pan/zoom inside the frame).
export default function HeroStreetView({ node, lang = "en" }) {
  const [open, setOpen] = useState(false);
  const t = {
    button: lang === "fr" ? "Voir Street View" : "See Street View",
    close: lang === "fr" ? "Fermer Street View" : "Close Street View",
    heading: lang === "fr" ? "Vue au niveau de la rue" : "Street-level view",
    credit: lang === "fr" ? "Imagerie de rue © Google" : "Street imagery © Google",
    hint: lang === "fr" ? "Faites glisser pour regarder autour · Pincez pour zoomer" : "Drag to look around · Pinch to zoom",
  };
  const src = `https://maps.google.com/maps?q=&layer=c&cbll=${node.lat},${node.lng}&cbp=12,0,0,0,0&output=svembed`;
  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-market-line px-4 text-sm font-bold text-market-ink">
        <MapPinned className="h-4 w-4" /> {t.button}
      </button>
    );
  }
  return (
    <div className="rounded-2xl border border-market-line bg-market-bg p-2" role="region" aria-label={`${t.heading} · ${node.name}`}>
      <div className="mb-2 flex items-center justify-between px-1">
        <span className="text-xs font-semibold uppercase tracking-wide text-market-muted">{t.heading}</span>
        <button onClick={() => setOpen(false)} aria-label={t.close} className="flex h-9 w-9 items-center justify-center rounded-full text-market-ink hover:bg-market-surface"><X className="h-4 w-4" /></button>
      </div>
      <div className="overflow-hidden rounded-xl border border-market-line" style={{ aspectRatio: "16 / 9" }}>
        <iframe
          title={`${t.heading} · ${node.name}`}
          src={src}
          loading="lazy"
          className="h-full w-full border-0"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <p className="mt-2 px-1 text-xs text-market-muted">{t.hint} · {t.credit}</p>
    </div>
  );
}