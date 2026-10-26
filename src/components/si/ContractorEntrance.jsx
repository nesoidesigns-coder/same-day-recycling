import { Link } from "react-router-dom";
import { ArrowRight, Target, Map as MapIcon, Truck, Users, TrendingUp } from "lucide-react";

const TILES = [
  { icon: Target, title: "Qualified leads", desc: "Requests scored and routed to your territory." },
  { icon: MapIcon, title: "Territory coverage", desc: "Your cities, capacity and acceptance in one view." },
  { icon: Truck, title: "Dispatch activity", desc: "Matching, scheduling and completion tracking." },
  { icon: Users, title: "Customer pipeline", desc: "Every inquiry from first quote to final pickup." },
  { icon: TrendingUp, title: "Revenue intelligence", desc: "Payouts, commissions and job profitability." },
];

// Section — the contractor entrance. Public visitors see a clearly-labelled
// feature preview; real numbers appear only inside authorized accounts.
export default function ContractorEntrance() {
  return (
    <section id="contractors" className="py-12 md:py-16">
      <div className="rounded-[24px] bg-si-ink px-6 py-10 text-white md:px-10 md:py-12">
        <div className="max-w-2xl">
          <span className="font-plex text-xs font-semibold tracking-[0.14em] text-si-mint2">FOR CONTRACTORS · RECYCLING OS</span>
          <h2 className="mt-3 text-[24px] font-bold tracking-tight md:text-[30px]">The Intelligence Behind Every Pickup.</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/70 md:text-base">
            Recycling OS connects service discovery, customer requests, dispatch, pricing, and business operations.
            Two ways in: join the service network to receive real jobs, or license the software to run your own
            territory on it.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {TILES.map((t) => (
            <div key={t.title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <t.icon className="size-5 text-si-mint2" />
              <h3 className="mt-2.5 text-sm font-bold">{t.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/60">{t.desc}</p>
            </div>
          ))}
        </div>
        <p className="mt-3 font-plex text-[10px] tracking-wide text-white/70">
          FEATURE PREVIEW — ILLUSTRATION ONLY. NOT LIVE DATA. AUTHORIZED CONTRACTORS SEE THEIR OWN ACCOUNT NUMBERS AFTER SIGN-IN.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          <Link
            to="/contractors"
            className="inline-flex items-center gap-2 rounded-full bg-si-mint px-6 py-3 text-sm font-bold text-si-ink transition-colors hover:bg-white"
          >
            Join the Service Network <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/software"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-6 py-3 text-sm font-bold text-white transition-colors hover:border-si-mint hover:text-si-mint2"
          >
            Explore Recycling OS Software <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}