import { Link } from "react-router-dom";
import { ArrowRight, CheckCircle2, HeartHandshake, Mountain, Recycle, Trash2 } from "lucide-react";
import { Image } from "@/components/ui/image";

const IMG = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/";
const CHECKS = [
  "Licensed, insured local operators",
  "Verified before a single job is offered",
  "Rated by the customers they served",
];
const DESTINATIONS = [
  { label: "Donate", Icon: HeartHandshake },
  { label: "Recycle", Icon: Recycle },
  { label: "Responsibly dispose", Icon: Trash2 },
];

// Trust, in two halves: who actually shows up, and where the load ends up.
export default function PartnerStrip() {
  return (
    <section className="mx-auto max-w-[1280px] px-4">
      <div className="grid gap-3 lg:grid-cols-3">
        <div className="overflow-hidden rounded-2xl border border-lm-line bg-white lg:col-span-2">
          <div className="grid gap-0 sm:grid-cols-5">
            <div className="sm:col-span-2">
              <Image
                src={`${IMG}ca1a6a402_generated_image.png`}
                alt="Crew carrying a sofa"
                className="h-40 w-full object-cover sm:h-full"
              />
            </div>
            <div className="p-4 sm:col-span-3">
              <h2 className="font-heading text-[15px] font-extrabold tracking-tight text-lm-ink">Verified local contractors</h2>
              <p className="mt-1 text-[11.5px] leading-snug text-lm-muted">
                Every pickup is handled by a local operator we have vetted — insurance, licensing and vehicle on file.
              </p>
              <ul className="mt-2.5 space-y-1">
                {CHECKS.map((c) => (
                  <li key={c} className="flex items-start gap-1.5 text-[11.5px] text-lm-ink">
                    <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[hsl(var(--ri-emerald))]" /> {c}
                  </li>
                ))}
              </ul>
              <Link
                to="/contractors"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[hsl(var(--lm-teal))] px-3.5 py-2 text-[11.5px] font-bold text-white hover:opacity-90"
              >
                Meet our partners <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-lm-line bg-white">
          <Image
            src={`${IMG}bd7ab5fc1_generated_image.png`}
            alt="Curbside staging before a pickup"
            className="h-24 w-full object-cover"
          />
          <div className="p-4">
            <h2 className="flex items-center gap-1.5 font-heading text-[14px] font-extrabold text-lm-ink">
              <Mountain className="h-3.5 w-3.5 text-[hsl(var(--ri-emerald))]" /> A cleaner Canada
            </h2>
            <p className="mt-1 text-[11.5px] leading-snug text-lm-muted">
              Nothing goes straight to landfill. Every load is sorted, and usable items get a second life first.
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {DESTINATIONS.map(({ label, Icon }) => (
                <span key={label} className="inline-flex items-center gap-1 rounded-full bg-[hsl(var(--ri-mint)/0.5)] px-2 py-1 text-[10px] font-bold text-[hsl(var(--ri-emerald-ink))]">
                  <Icon className="h-3 w-3" /> {label}
                </span>
              ))}
            </div>
            <Link to="/impact-calculator" className="mt-2.5 inline-block text-[11px] font-bold text-[hsl(var(--lm-teal))] hover:underline">
              See the impact
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}