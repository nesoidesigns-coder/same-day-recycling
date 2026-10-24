import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Calculator, CalendarCheck, MessageCircle, Sparkles, Radar, ShieldCheck } from "lucide-react";
import { trackGA } from "@/lib/communityAnalytics";

const scrollToId = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

// Aurora Glass hero for the AI discovery network: the live public-request
// feed is the primary action; estimate, booking and Rex stay one tap away.
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
    <section className="relative max-w-6xl mx-auto px-4 pt-9 pb-10 md:pt-14 md:pb-14 text-center">
      <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-[10px] sm:text-xs font-bold tracking-[0.14em] uppercase text-[#187B65] shadow-sm">
        <Sparkles className="w-3.5 h-3.5" />
        AI-discovered · verified public requests
      </div>
      <h1 className="mt-4 text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-[#102B2A] leading-[1.05]">
        Canada's live service-request <span className="aurora-grad-text">network</span>
      </h1>
      <p className="mt-4 text-[15px] md:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
        Recycling OS scans public posts across Canada and surfaces real junk removal, recycling, furniture and appliance pickup requests — sourced, dated and linked to the original. Free to browse, no account needed.
      </p>

      <div className="mt-7 flex flex-col sm:flex-row items-center justify-center gap-3">
        <button onClick={browse} className="inline-flex items-center justify-center gap-2 min-h-[52px] rounded-full bg-[#187B65] text-white font-bold px-7 py-3.5 text-[15px] shadow-md shadow-[#187B65]/25 hover:bg-[#125C4E] transition-colors">
          <Radar className="w-5 h-5 shrink-0" /> Browse live requests
        </button>
        <button onClick={() => scrollToId("estimate")} className="inline-flex items-center justify-center gap-2 min-h-[52px] rounded-full bg-[#102B2A] text-white font-bold px-7 py-3.5 text-[15px] hover:bg-[#0a3020] transition-colors">
          <Calculator className="w-5 h-5 shrink-0" /> Instant Estimate
        </button>
        <button onClick={() => window.dispatchEvent(new CustomEvent("rex:open"))} className="inline-flex items-center justify-center gap-2 min-h-[52px] rounded-full glass text-[#102B2A] font-bold px-7 py-3.5 text-[15px] hover:text-[#187B65] transition-colors">
          <MessageCircle className="w-5 h-5 shrink-0" /> Ask Rex
        </button>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-2.5">
        <span className="glass rounded-full px-3.5 py-1.5 text-xs font-bold text-[#102B2A] inline-flex items-center gap-1.5">
          <Radar className="w-3.5 h-3.5 text-[#187B65]" />
          {typeof live.data === "number" ? `${live.data} live request${live.data === 1 ? "" : "s"}` : "Live requests"}
        </span>
        <span className="glass rounded-full px-3.5 py-1.5 text-xs font-bold text-[#102B2A] inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" /> Sourced &amp; verified
        </span>
        <span className="glass rounded-full px-3.5 py-1.5 text-xs font-bold text-[#102B2A] inline-flex items-center gap-1.5">
          <CalendarCheck className="w-3.5 h-3.5 text-[#187B65]" /> Free · no account needed
        </span>
      </div>
    </section>
  );
}