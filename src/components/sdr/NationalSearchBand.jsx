import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Sparkles } from "lucide-react";

export default function NationalSearchBand() {
  const [query, setQuery] = useState("");
  const [loc, setLoc] = useState("");
  const navigate = useNavigate();

  const go = (e) => {
    e.preventDefault();
    navigate(`/recycling?q=${encodeURIComponent(query)}&loc=${encodeURIComponent(loc)}`);
  };

  return (
    <section className="bg-[#0c3b24] text-white">
      <div className="max-w-7xl mx-auto px-4 py-10">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Find recycling near you — anywhere in Canada</h2>
        <p className="text-emerald-100/70 mt-2 text-sm max-w-2xl">Search by material, product, or service, then by postal code, city, or province to compare local drop-off and collection options.</p>
        <form onSubmit={go} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-4xl">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What do you need to recycle? (e.g. paint, mattress, e-waste)" className="input !bg-white" aria-label="Material, product, or recycling service" />
          </div>
          <div className="relative sm:w-64">
            <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Postal code, city, or province" className="input !bg-white" aria-label="Location" />
          </div>
          <button type="submit" className="rounded-xl bg-[#1d9e56] text-[#0c3b24] font-bold px-6 py-3 hover:bg-[#17a04c] transition-colors">Search</button>
          <button type="button" onClick={() => navigate("/recycling-assistant")} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-400/40 text-emerald-100 font-bold px-5 py-3 text-sm hover:bg-emerald-900/40 transition-colors">
            <Sparkles className="w-4 h-4" /> Ask the Assistant
          </button>
        </form>
      </div>
    </section>
  );
}