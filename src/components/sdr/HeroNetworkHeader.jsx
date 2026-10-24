import { networkCopy } from "@/components/sdr/heroNetworkCopy";

export default function HeroNetworkHeader({ lang = "en" }) {
  const t = networkCopy(lang);
  return (
    <header className="flex items-center justify-between gap-3 px-4 pb-1.5 pt-3 sm:px-5 sm:pb-2 sm:pt-4">
      <h2 className="font-heading text-base font-bold tracking-tight text-market-ink sm:text-xl">{t.title}</h2>
      <p className="hidden max-w-xs text-xs leading-relaxed text-market-muted sm:block">{t.intro}</p>
    </header>
  );
}