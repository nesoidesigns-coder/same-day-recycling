import { Sparkles, MapPin } from "lucide-react";
import { networkCopy, networkRexQuestion } from "@/components/sdr/heroNetworkCopy";

// Ask Rex mode: the AI explains what the globe is showing — coverage, open
// posts and pricing — from the same verified records. Selecting a city in
// this mode asks Rex about that municipality directly.
export default function HeroNetworkRex({ node, lang = "en" }) {
  const t = networkCopy(lang);
  const ask = (question) => window.dispatchEvent(new CustomEvent("rex:open", { detail: { question } }));
  return (
    <section className="border-t border-market-line px-4 py-4" aria-label={t.rexTitle} aria-live="polite">
      <h3 className="flex items-center gap-2 text-lg font-bold"><Sparkles className="h-5 w-5 text-[#54D9AE]" aria-hidden="true" /> {t.rexTitle}</h3>
      <p className="mt-1 text-xs text-market-muted">{t.rexIntro}</p>
      {node ? (
        <button onClick={() => ask(networkRexQuestion(node, lang))} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-market-accent px-4 text-sm font-bold text-market-bg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-market-ink">
          <MapPin className="h-4 w-4" aria-hidden="true" /> {t.rexAskCity} {node.name}
        </button>
      ) : (
        <p className="mt-3 text-sm font-semibold text-market-ink">{t.rexSelectHint}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {t.rexChips.map((chip) => (
          <button key={chip} onClick={() => ask(chip)} className="min-h-11 rounded-full border border-market-line px-3 text-xs font-semibold text-market-ink hover:bg-white/5">
            {chip}
          </button>
        ))}
      </div>
    </section>
  );
}