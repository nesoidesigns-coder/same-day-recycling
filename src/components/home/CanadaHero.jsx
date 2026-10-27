import { Image } from "@/components/ui/image";
import { Leaf } from "lucide-react";
import HeroDemandCard from "./HeroDemandCard";
import HeroSearchCard from "./HeroSearchCard";
import { TRUST } from "./ServiceRail";

const BACKDROP =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2000&q=80";

// The opening of the site: the promise, the proof of life across the country,
// and the one card that starts a quote.
export default function CanadaHero({ total, cities, loading }) {
  return (
    <section className="relative overflow-hidden">
      <Image src={BACKDROP} alt="Canadian mountains and forest" className="absolute inset-0 h-full w-full" fittingType="fill" />
      <div className="absolute inset-0 bg-white/78" />

      <div className="relative mx-auto grid max-w-[1280px] items-start gap-10 px-4 pb-32 pt-12 lg:grid-cols-[1.1fr_0.9fr] lg:pt-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-lm-line bg-white px-3.5 py-1.5 text-[12px] font-bold text-lm-ink shadow-sm">
            <Leaf className="h-3.5 w-3.5 text-[hsl(var(--lm-teal))]" />
            Canada&apos;s Same Day Junk Removal
          </span>

          <h1 className="mt-4 font-heading text-[38px] font-extrabold leading-[1.05] tracking-tight text-lm-ink sm:text-[46px] lg:text-[56px]">
            Clear Space Today For a Cleaner Tomorrow
          </h1>
          <p className="mt-3 text-[16px] font-semibold text-lm-muted sm:text-[18px]">
            Fast. Reliable. Eco-Friendly. Canada Wide.
          </p>

          <div className="mt-6 grid max-w-xl grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
            {TRUST.map(({ label, Icon }) => (
              <div key={label} className="flex items-center gap-2">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-[hsl(var(--lm-teal))] shadow-sm">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-[11.5px] font-bold leading-tight text-lm-ink">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <HeroDemandCard total={total} cities={cities} loading={loading} />
      </div>

      <div className="relative z-10 mx-auto -mt-24 max-w-[1280px] px-4 pb-8 lg:-mt-28">
        <HeroSearchCard />
      </div>
    </section>
  );
}