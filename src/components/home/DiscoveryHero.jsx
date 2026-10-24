import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { MessageCircle } from "lucide-react";
import { trackGA } from "@/lib/communityAnalytics";

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

// Compact hero: booking starts immediately (the guided postal form sits right
// above), discovery browsing one tap away. No decorative layers.
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
    <section className="max-w-6xl mx-auto px-4 pt-6 pb-8 text-center">
      <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#102B2A] leading-tight">
        Junk removal, recycling and pickup across Canada
      </h1>
      <p className="mt-3 text-[15px] md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Book a verified local pickup in minutes — or browse real public service requests our AI has sourced and verified nationwide.
      </p>
      <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5">
        <button onClick={() => scrollToId("book")} className="min-h-[48px] w-full sm:w-auto rounded-full bg-[#187B65] text-white font-bold px-6 py-3 text-[15px] hover:bg-[#125C4E] transition-colors">
          Book a pickup
        </button>
        <button onClick={browse} className="min-h-[48px] w-full sm:w-auto rounded-full border border-slate-300 text-[#102B2A] font-bold px-6 py-3 text-[15px] hover:border-[#187B65] hover:text-[#187B65] transition-colors">
          Browse live requests
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent("rex:open"))} className="min-h-[48px] w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 text-[#102B2A] font-bold px-6 py-3 text-[15px] hover:border-[#187B65] hover:text-[#187B65] transition-colors">
          <MessageCircle className="w-4 h-4" /> Ask Rex
        </button>
      </div>
      <p className="mt-4 text-xs font-semibold text-slate-500">
        {typeof live.data === "number" ? `${live.data} live public request${live.data === 1 ? "" : "s"} verified · ` : ""}Free to browse · no account needed
      </p>
    </section>
  );
}