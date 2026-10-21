import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Phone, ShieldCheck, Network, ArrowRight } from "lucide-react";
import PostalCheck from "./PostalCheck";

const POPULAR = [
  { label: "Electronics", q: "electronics" },
  { label: "Metal", q: "metal" },
  { label: "Furniture", q: "furniture" },
  { label: "Appliances", q: "appliances" },
  { label: "Cardboard", q: "cardboard" },
  { label: "Plastics", q: "plastics" },
  { label: "Construction", q: "construction materials" },
];

export default function HomeHero({ onCity }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");

  const searchDirectory = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (location.trim()) params.set("loc", location.trim());
    navigate(`/recycling${params.toString() ? `?${params}` : ""}`);
  };

  return (
    <section id="top" className="relative bg-[#102B2A] text-white overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#187B65]/20 blur-3xl pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-4 py-12 md:py-20 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/20 px-4 py-1.5 text-xs font-bold tracking-[0.14em] uppercase text-emerald-100/90">
          <Network className="w-3.5 h-3.5 text-[#187B65]" />
          Canada's Intelligent Recycling &amp; Removal Network
        </div>
        <h1 className="mt-5 text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-white">
          Canada's Intelligent Recycling &amp; Removal Network.
        </h1>
        <p className="mt-4 text-base md:text-lg text-emerald-100/85 max-w-2xl mx-auto leading-relaxed">
          One connected platform for recycling, junk removal, commercial cleanouts, and intelligent service coordination across Canada.
        </p>

        {/* Primary: postal-code service discovery */}
        <div className="mt-7 max-w-2xl mx-auto">
          <PostalCheck onCity={onCity} />
        </div>

        {/* Secondary: national directory search */}
        <form onSubmit={searchDirectory} className="mt-6 max-w-2xl mx-auto" aria-label="Search the national recycling directory">
          <div className="grid gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <label htmlFor="hero-material" className="sr-only">What do you need recycled or recovered?</label>
              <input
                id="hero-material"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Material, product, or service (e.g. mattress, paint, e-waste)"
                className="input !bg-white pl-10"
              />
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <label htmlFor="hero-location" className="sr-only">Enter your postal code or city</label>
              <input
                id="hero-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your postal code or city, anywhere in Canada"
                className="input !bg-white pl-10"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#187B65] text-[#102B2A] font-bold text-base uppercase tracking-wide px-6 py-3.5 hover:bg-[#1FA184] transition-colors"
            >
              Find Recycling Services
            </button>
          </div>
        </form>

        {/* Secondary actions */}
        <div className="mt-4 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => document.getElementById("quote")?.scrollIntoView({ behavior: "smooth" })}
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 text-white font-bold px-6 py-3 hover:bg-white/10 transition-colors"
          >
            Get a Quote
          </button>
          <button
            onClick={() => navigate("/software")}
            className="inline-flex items-center gap-2 rounded-full border-2 border-white/30 text-white font-bold px-6 py-3 hover:bg-white/10 transition-colors"
          >
            Explore Business Solutions <ArrowRight className="w-4 h-4 text-[#54D9AE]" />
          </button>
        </div>

        <div className="mt-7">
          <div className="text-xs font-bold tracking-[0.15em] text-emerald-100/60 uppercase mb-3 mt-6">Or search the full directory</div>
          <div className="text-xs font-bold tracking-[0.15em] text-emerald-100/60 uppercase mb-3 mt-6">Popular materials</div>
          <div className="flex flex-wrap justify-center gap-2">
            {POPULAR.map((c) => (
              <button
                key={c.q}
                onClick={() => navigate(`/recycling?q=${encodeURIComponent(c.q)}`)}
                className="rounded-full bg-white/10 border border-white/20 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs font-semibold text-emerald-100/75">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" /> Verified providers only</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#187B65]" /> Coverage shown only where confirmed</span>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-sm text-emerald-100/75">
          <span>One Country. One Network. A Smarter Way to Recycle.</span>
          <a href="tel:+16048491745" className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[#187B65] transition-colors">
            <Phone className="w-4 h-4 text-[#187B65]" /> (604) 849-1745
          </a>
        </div>
      </div>
    </section>
  );
}