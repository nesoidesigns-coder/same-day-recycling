import { useNavigate } from "react-router-dom";
import { Phone, ShieldCheck, Network, ArrowRight } from "lucide-react";
import ServiceDiscovery from "./ServiceDiscovery";

export default function HomeHero({ onCity }) {
  const navigate = useNavigate();

  return (
    <section id="top" className="relative bg-[#102B2A] text-white overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#187B65]/20 blur-3xl pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-4 pt-6 pb-10 md:py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-3.5 py-1.5 text-[10px] sm:text-xs font-bold tracking-[0.14em] uppercase text-emerald-100/90">
          <Network className="w-3.5 h-3.5 text-[#187B65]" />
          Canada's Intelligent Recycling &amp; Removal Network
        </div>
        <h1 className="mt-4 text-[1.65rem] leading-tight sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white">
          Recycling &amp; Junk Removal Requests Across Canada
        </h1>
        <p className="mt-3 text-[15px] md:text-lg text-emerald-100/85 max-w-2xl mx-auto leading-relaxed">
          Tell us what needs to go. We'll work to connect you with a qualified local service provider — in every province and territory.
        </p>

        {/* Primary: unified postal/city → coverage → material → provider discovery */}
        <div className="mt-6 max-w-2xl mx-auto">
          <ServiceDiscovery onCity={onCity} />
        </div>

        {/* Primary + secondary national actions */}
        <div className="mt-5 flex flex-wrap justify-center gap-2.5">
          <button
            onClick={() => navigate("/request-service")}
            className="inline-flex items-center min-h-[48px] rounded-full bg-[#187B65] text-white font-bold px-7 py-2.5 text-sm shadow-lg shadow-[#187B65]/30 hover:bg-[#125C4E] transition-colors"
          >
            Request Service <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate("/recycling")}
            className="inline-flex items-center min-h-[48px] rounded-full border-2 border-white/30 text-white font-bold px-5 py-2.5 text-sm hover:bg-white/10 transition-colors"
          >
            Browse Recycling Directory
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-emerald-100/75">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" /> Requests open in every province &amp; territory</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" /> Same-day fulfillment depends on contractor availability &amp; confirmation</span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-sm text-emerald-100/75">
          <span>One Country. One Network. A Smarter Way to Recycle.</span>
          <a href="tel:+16048491745" className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[#187B65] transition-colors">
            <Phone className="w-4 h-4 text-[#187B65]" /> (604) 849-1745
          </a>
        </div>
      </div>
    </section>
  );
}