import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MessageCircle } from "lucide-react";
import { trackGA } from "@/lib/communityAnalytics";

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

// Compact hero in the unified brand identity: midnight navy panel, emerald
// primary action, soft-mint glow accents. Booking starts immediately (the
// guided postal form sits right above), discovery browsing one tap away.
export default function DiscoveryHero() {
  const live = useQuery({
    queryKey: ["homeLiveCount"],
    queryFn: () => base44.entities.PublicOpportunity.count({ status: "open", classification: { $in: ["active_request", "potential_opportunity"] } }),
  });

  const browse = () => {
    trackGA("home_discovery_browse");
    scrollToId("live-discovery");
  };

  return (
    <section className="max-w-6xl mx-auto px-4 pt-6 pb-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-navy via-[#0E2A3D] to-[#0F3D33] px-5 py-10 sm:px-10 sm:py-14 text-center">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-16 w-72 h-72 rounded-full bg-brand-emerald/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-16 w-72 h-72 rounded-full bg-brand-softmint/15 blur-3xl" />
        <span className="relative inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-bold text-[#CFF5E8]">
          Canada's AI-powered service network
        </span>
        <h1 className="relative mt-4 text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Junk removal, recycling and pickup across Canada
        </h1>
        <p className="relative mt-3 text-[15px] md:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
          Book a verified local pickup in minutes — or browse real public service requests our AI has sourced and verified nationwide.
        </p>
        <div className="relative mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5">
          <button onClick={() => scrollToId("book")} className="min-h-[48px] w-full sm:w-auto rounded-full bg-brand-emerald text-white font-bold px-6 py-3 text-[15px] hover:bg-[#125C4E] transition-colors">
            Book a pickup
          </button>
          <button onClick={browse} className="min-h-[48px] w-full sm:w-auto rounded-full border border-white/25 bg-white/5 text-white font-bold px-6 py-3 text-[15px] hover:border-brand-softmint hover:text-brand-softmint transition-colors">
            Browse live requests
          </button>
          <button onClick={() => window.dispatchEvent(new CustomEvent("rex:open"))} className="min-h-[48px] w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 text-white font-bold px-6 py-3 text-[15px] hover:border-brand-softmint hover:text-brand-softmint transition-colors">
            <MessageCircle className="w-4 h-4" /> Ask Rex
          </button>
        </div>
        <p className="relative mt-4 text-xs font-semibold text-white/60">
          {typeof live.data === "number" ? `${live.data} live public request${live.data === 1 ? "" : "s"} verified · ` : ""}Free to browse · no account needed
        </p>
      </div>
    </section>
  );
}