import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, ArrowRight } from "lucide-react";
import { CITIES } from "@/lib/cities";

export default function CitySelector() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const results = CITIES.filter((c) => c.name.toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <section className="bg-[#f4f7f5]">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Find your city</div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0c3b24]">We serve your city.</h2>
          <p className="mt-3 text-slate-600">Pick your city to see local service, pricing and same-day availability.</p>
          <div className="relative mt-6 max-w-md mx-auto">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search your city…"
              className="input pl-11"
              aria-label="Search your city"
            />
          </div>
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-w-4xl mx-auto">
          {results.map((city) => (
            <button
              key={city.slug}
              onClick={() => navigate(`/junk-removal-${city.slug}`)}
              className="group flex items-center justify-between gap-2 rounded-2xl bg-white border border-slate-100 px-4 py-3.5 text-left hover:border-[#1d9e56] hover:shadow-sm transition-all"
            >
              <span className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[#1d9e56] shrink-0" />
                <span className="font-bold text-[#0c3b24] truncate">{city.name}</span>
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#1d9e56] transition-colors shrink-0" />
            </button>
          ))}
        </div>
        {results.length === 0 && (
          <p className="text-center text-slate-500 mt-6">No match — call us at (604) 849-1745 and we'll check your area.</p>
        )}
      </div>
    </section>
  );
}