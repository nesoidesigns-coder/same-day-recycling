import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

// Homepage step 10 — the final booking action, in the Living Intelligence
// visual system. Amber marks the conversion action; contact stays secondary.
export default function FinalServiceCta() {
  return (
    <section className="rounded-[24px] bg-ri-forest px-6 py-10 text-center sm:px-10 sm:py-14">
      <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
        Ready to reclaim your space?
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base">
        Describe what needs to go — get clear pricing, a verified local crew, and a recycling receipt for every job.
      </p>
      <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <Link
          to="/request-service"
          className="inline-flex items-center gap-2 rounded-full bg-ri-amber px-7 py-3.5 text-sm font-bold text-ri-charcoal transition-all hover:brightness-95"
        >
          Get My Pickup Estimate <ArrowRight className="h-4 w-4" />
        </Link>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-full border border-white/30 px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-white/10"
        >
          Contact Our Team
        </Link>
      </div>
    </section>
  );
}