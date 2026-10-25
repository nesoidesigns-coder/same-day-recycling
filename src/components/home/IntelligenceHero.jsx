import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowRight, Phone, MessageCircle, ShieldCheck, Compass } from "lucide-react";
import { LIVE_CATEGORIES } from "@/lib/liveCategories";

// Data-first homepage hero: national service search that leads into local
// intelligence. Booking stays one tap away — never the interface itself.
export default function IntelligenceHero() {
  const [place, setPlace] = useState("");
  const [service, setService] = useState("");
  const navigate = useNavigate();

  const explore = (e) => {
    e.preventDefault();
    const parts = [];
    if (service) parts.push(LIVE_CATEGORIES[service]);
    if (place.trim()) parts.push(place.trim());
    navigate(parts.length ? `/service-finder?q=${encodeURIComponent(parts.join(" "))}` : "/service-finder");
  };

  return (
    <section className="bg-warm-white">
      <div className="max-w-4xl mx-auto px-4 pt-10 pb-12 md:pt-16 md:pb-16 text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-[#187B65]/10 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-[#187B65] uppercase">
          <Compass className="w-3.5 h-3.5" /> Same Day Recycling LIVE
        </span>
        <h1 className="mt-4 text-4xl sm:text-5xl font-bold tracking-tight text-[#102B2A] leading-tight">
          See What's Happening. Find What You Need.
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Explore recycling and removal services, compare local options, understand pricing, and discover service activity across Canada.
        </p>

        <form onSubmit={explore} className="mt-8 rounded-3xl bg-white border border-slate-200 p-4 sm:p-5 shadow-sm text-left max-w-2xl mx-auto">
          <div className="grid sm:grid-cols-2 gap-2">
            <input
              value={place}
              onChange={(e) => setPlace(e.target.value)}
              placeholder="City or postal code"
              aria-label="City or postal code"
              className="input"
              maxLength={60}
            />
            <select value={service} onChange={(e) => setService(e.target.value)} aria-label="Service category" className="input">
              <option value="">Any service</option>
              {Object.entries(LIVE_CATEGORIES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="mt-3 w-full rounded-xl bg-amber-500 text-[#102B2A] font-bold px-6 py-3.5 hover:bg-amber-600 hover:text-white transition-colors inline-flex items-center justify-center gap-2">
            Explore Local Intelligence <ArrowRight className="w-4 h-4" />
          </button>
          <p className="mt-2.5 text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#187B65] shrink-0" />
            Free to explore — no account needed. Coverage is confirmed before booking, never assumed.
          </p>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm">
          <Link to="/live" className="inline-flex items-center gap-2 font-bold text-[#187B65] hover:underline">
            National LIVE Centre <ArrowRight className="w-4 h-4" />
          </Link>
          <Link to="/request-service" className="inline-flex items-center gap-2 font-bold text-[#102B2A] hover:text-[#187B65]">
            Request service
          </Link>
          <a href="tel:+16048491745" className="inline-flex items-center gap-2 font-bold text-[#102B2A] hover:text-[#187B65]">
            <Phone className="w-4 h-4 text-[#187B65]" /> (604) 849-1745
          </a>
          <button onClick={() => window.dispatchEvent(new CustomEvent("rex:open"))} className="inline-flex items-center gap-2 font-bold text-[#187B65] hover:underline">
            <MessageCircle className="w-4 h-4" /> Ask Rex
          </button>
        </div>
      </div>
    </section>
  );
}