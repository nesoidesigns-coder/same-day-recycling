import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Phone, ShieldCheck, Clock, Tag } from "lucide-react";

const POPULAR = [
  { label: "Electronics", q: "electronics" },
  { label: "Metal", q: "metal" },
  { label: "Furniture", q: "furniture" },
  { label: "Appliances", q: "appliances" },
  { label: "Cardboard", q: "cardboard" },
  { label: "Plastics", q: "plastics" },
  { label: "Construction", q: "construction materials" },
];

export default function HomeHero() {
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
    <section id="top" className="relative bg-[#0c3b24] text-white overflow-hidden">
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-[#1d9e56]/20 blur-3xl pointer-events-none" />
      <div className="relative max-w-5xl mx-auto px-4 py-10 md:py-16 text-center">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-white">
          Canada's Smarter Way to Recycle.
        </h1>
        <p className="mt-3 text-base md:text-lg text-emerald-100/85 max-w-2xl mx-auto leading-relaxed">
          Find recycling options, compare removal services, and give unwanted materials a better destination.
        </p>

        {/* Primary: search */}
        <form onSubmit={searchDirectory} className="mt-6 max-w-2xl mx-auto" aria-label="Search the recycling directory">
          <div className="grid gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <label htmlFor="hero-material" className="sr-only">What do you need removed or recycled?</label>
              <input
                id="hero-material"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you need removed or recycled?"
                className="input !bg-white pl-10"
              />
            </div>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <label htmlFor="hero-location" className="sr-only">Enter your city or postal code</label>
              <input
                id="hero-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Enter your city or postal code"
                className="input !bg-white pl-10"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-xl bg-[#1d9e56] text-[#0c3b24] font-bold text-base px-6 py-3.5 hover:bg-[#25b96b] transition-colors"
            >
              Find Recycling Options
            </button>
          </div>
        </form>

        {/* Secondary / tertiary actions */}
        <div className="mt-4 flex flex-col sm:flex-row justify-center gap-3">
          <a href="#book" className="rounded-full bg-white text-[#0c3b24] font-bold px-6 py-3 hover:bg-emerald-50 transition-colors">
            Request a Pickup
          </a>
          <a href="#services" className="rounded-full border-2 border-white/30 text-white font-bold px-6 py-3 hover:bg-white/10 transition-colors">
            Explore Services
          </a>
        </div>

        <div className="mt-7">
          <div className="text-xs font-bold tracking-[0.15em] text-emerald-100/60 uppercase mb-3">Popular materials</div>
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
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-[#1d9e56]" /> Verified directory listings only</span>
          <span className="inline-flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#1d9e56]" /> Same-day pickup — book before noon</span>
          <span className="inline-flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-[#1d9e56]" /> Upfront pricing</span>
        </div>

        <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-2 text-sm text-emerald-100/75">
          <span>Serving Metro Vancouver and the BC Interior</span>
          <a href="tel:+16048491745" className="inline-flex items-center gap-1.5 font-semibold text-white hover:text-[#1d9e56] transition-colors">
            <Phone className="w-4 h-4 text-[#1d9e56]" /> (604) 849-1745
          </a>
        </div>
      </div>
    </section>
  );
}