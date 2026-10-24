import { X, Sparkles } from "lucide-react";
import HeroMapCityTooltip from "@/components/sdr/HeroMapCityTooltip";

export default function HeroNetworkSelection({ node, onClose }) {
  const useCity = () => {
    window.dispatchEvent(new CustomEvent("pickup:location", { detail: { city: node.name, province: node.city.province } }));
    document.getElementById("book")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <section className="relative border-t border-market-line px-4 pb-4 pt-2" aria-label={`${node.name} network details`} aria-live="polite">
      <button onClick={onClose} aria-label="Close city details" className="absolute right-2 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-full text-market-ink hover:bg-market-bg"><X className="h-5 w-5" /></button>
      <HeroMapCityTooltip node={node} availability={node.availability} />
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={useCity} className="min-h-11 rounded-full bg-brand-emerald px-4 text-sm font-bold text-market-ink">Use {node.name} for my request</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent("rex:open", { detail: { question: `I am exploring ${node.name}, ${node.city.province}. Please help with services, an estimate and additional-item approval. This map shows ${node.contractors} verified contractor records and availability state ${node.availability || "unknown"}, not a confirmed appointment. Verify current data before making claims.` } }))} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-market-line px-4 text-sm font-bold text-market-ink"><Sparkles className="h-4 w-4" /> Ask Rex</button>
      </div>
    </section>
  );
}