import { Image } from "@/components/ui/image";
import { Recycle } from "lucide-react";

const TRUCK =
  "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/c1f71b714_generated_image.png";

const STEPS = [
  { title: "Get an Estimate", body: "Enter your postal code and select your service." },
  { title: "Choose a Time", body: "Pick a same-day pickup time." },
  { title: "We Pick It Up", body: "Our verified local crew arrives on time." },
  { title: "Responsible Disposal", body: "We donate and recycle whenever possible." },
];

// How a pickup runs, beside the truck that runs it.
export default function CanadaHowItWorks() {
  return (
    <section id="how-it-works" className="mx-auto max-w-[1280px] px-4 py-14">
      <div className="grid items-start gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <p className="font-plex text-[10.5px] font-bold uppercase tracking-[0.2em] text-[hsl(var(--lm-teal))]">
            Same Day Recycling
          </p>
          <h2 className="mt-2 font-heading text-[30px] font-extrabold leading-tight tracking-tight text-lm-ink sm:text-[36px]">
            How It Works
          </h2>
          <p className="mt-2 text-[14.5px] text-lm-muted">
            Get a quote, book, and we handle the rest. It&apos;s that simple.
          </p>

          <div className="relative mt-6 overflow-hidden rounded-2xl border border-lm-line bg-white">
            <Image src={TRUCK} alt="Same Day Recycling truck on a Canadian street" className="h-[240px] w-full" fittingType="fill" />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-3 rounded-xl bg-white/95 px-3 py-2.5 backdrop-blur">
              <span className="flex items-center gap-2 text-[12px] font-bold text-lm-ink">
                <Recycle className="h-4 w-4 text-[hsl(var(--lm-teal))]" />
                Items donated first when possible
              </span>
              <span className="flex items-center gap-1">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full ${i === 0 ? "w-4 bg-[hsl(var(--lm-teal))]" : "w-1.5 bg-lm-line"}`}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>

        <ol className="grid gap-4 sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-2xl border border-lm-line bg-white p-4">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[hsl(var(--lm-teal))]/10 font-heading text-[13px] font-extrabold text-[hsl(var(--lm-teal))]">
                {i + 1}
              </span>
              <h3 className="mt-3 text-[14px] font-bold text-lm-ink">{s.title}</h3>
              <p className="mt-1 text-[12.5px] leading-snug text-lm-muted">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}