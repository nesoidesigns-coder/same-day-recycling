import { X, Sparkles } from "lucide-react";
import HeroMapCityTooltip from "@/components/sdr/HeroMapCityTooltip";
import { networkCopy } from "@/components/sdr/heroNetworkCopy";

export default function HeroNetworkSelection({ node, onClose, lang = "en" }) {
  const t = networkCopy(lang);
  const question = lang === "fr"
    ? `Je m'intéresse à ${node.name}, ${node.city.province}. Réponds en français. Aide-moi à comprendre les services, les estimations et l'approbation des ajouts. Vérifie les données actuelles; cette sélection ne confirme aucune disponibilité ni aucun rendez-vous.`
    : `I am exploring ${node.name}, ${node.city.province}. Please respond in English and explain services, estimates and additional-item approval. Verify current records; this selection does not confirm availability or an appointment.`;
  const useCity = () => {
    window.dispatchEvent(new CustomEvent("pickup:location", { detail: { city: node.name, province: node.city.province } }));
    document.getElementById("book")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <section className="relative border-t border-market-line px-4 pb-4 pt-2" aria-label={`${node.name} · ${t.details}`} aria-live="polite">
      <button onClick={onClose} aria-label={t.close} className="absolute right-2 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full text-market-ink hover:bg-market-bg"><X className="h-5 w-5" /></button>
      <HeroMapCityTooltip node={node} availability={node.availability} lang={lang} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={useCity} className="min-h-11 rounded-full bg-market-accent px-4 text-sm font-bold text-market-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-market-ink">{t.useCity}</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent("rex:open", { detail: { question } }))} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-market-line px-4 text-sm font-bold text-market-ink"><Sparkles className="h-4 w-4" /> {t.askRex}</button>
      </div>
    </section>
  );
}