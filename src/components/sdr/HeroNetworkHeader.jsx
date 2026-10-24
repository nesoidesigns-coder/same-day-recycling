import { networkCopy } from "@/components/sdr/heroNetworkCopy";

export default function HeroNetworkHeader({ lang = "en" }) {
  const t = networkCopy(lang);
  return (
    <header className="px-4 pb-2 pt-4 sm:px-5">
      <h2 className="font-heading text-lg font-bold tracking-tight text-market-ink sm:text-xl">{t.title}</h2>
      <p className="mt-1 text-xs leading-relaxed text-market-muted">{t.intro}</p>
    </header>
  );
}