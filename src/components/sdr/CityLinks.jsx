import { Link } from "react-router-dom";
import { MapPin, ArrowRight, Sofa } from "lucide-react";
import { CITIES } from "@/lib/cities";

// Internal-link hub for the homepage. City pages are deep in the sitemap and
// were previously unreachable from the homepage — a key relevance signal for
// local search. Anchors carry the keyword the city page targets.
export default function CityLinks() {
  const vancouver = CITIES.find((c) => c.name === "Vancouver") || CITIES[0];
  const others = CITIES.filter((c) => c.name !== vancouver.name);

  return (
    <section id="city-directory" className="bg-[#f4f7f5] py-10 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mb-10">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Service directory</div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">
            Junk Removal by City
          </h2>
          <p className="mt-3 text-slate-600 text-lg">
            Dedicated local pages with published pricing, pickup rules and booking for every
            community we serve. Request a junk, furniture, appliance or mattress pickup in your city.
          </p>
        </div>

        {/* Featured: the deepest local content lives on the primary city page */}
        <div className="rounded-3xl bg-white border border-[#187B65]/25 shadow-sm p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-2">
                <MapPin className="w-4 h-4" /> Featured market
              </div>
              <h3 className="text-2xl font-bold text-[#102B2A] tracking-tight">
                <Link to="/junk-removal-vancouver" className="hover:text-[#187B65] transition-colors">
                  Junk Removal in Vancouver, BC
                </Link>
              </h3>
              <p className="mt-2 text-slate-600 max-w-xl">
                Vancouver's full local page: published truck-load pricing, same-day availability
                rules, recycling centres and dedicated{" "}
                <Link to="/furniture-removal" className="font-bold text-[#187B65] hover:underline">
                  furniture removal in Vancouver
                </Link>{" "}
                — couches, mattresses, appliances and whole-home cleanouts.
              </p>
            </div>
            <Link
              to="/junk-removal-vancouver"
              className="shrink-0 inline-flex items-center gap-2 rounded-full bg-[#187B65] text-white font-bold px-6 py-3 text-sm hover:bg-[#125C4E] transition-colors"
            >
              Vancouver city page <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {others.map((c) => (
            <Link
              key={c.slug}
              to={`/junk-removal-${c.slug}`}
              className="group flex items-center justify-between rounded-2xl bg-white border border-slate-100 px-5 py-4 hover:border-[#187B65] transition-colors"
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <MapPin className="w-4 h-4 text-[#187B65] shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-[#102B2A] truncate group-hover:text-[#187B65] transition-colors">
                    Junk Removal in {c.name}, {c.province}
                  </span>
                  <span className="block text-xs text-slate-400">Local pricing &amp; booking</span>
                </span>
              </span>
              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#187B65] shrink-0 transition-colors" />
            </Link>
          ))}
        </div>

        {/* Service-level deep pages sit one click from every city mention */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to="/furniture-removal" className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#102B2A] hover:border-[#187B65] hover:text-[#187B65] transition-colors">
            <Sofa className="w-4 h-4 text-[#187B65]" /> Furniture Removal
          </Link>
          <Link to="/appliance-removal" className="rounded-full bg-white border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#102B2A] hover:border-[#187B65] hover:text-[#187B65] transition-colors">
            Appliance Removal
          </Link>
          <Link to="/electronics-recycling" className="rounded-full bg-white border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#102B2A] hover:border-[#187B65] hover:text-[#187B65] transition-colors">
            Electronics Recycling
          </Link>
          <Link to="/commercial-recycling" className="rounded-full bg-white border border-slate-200 px-5 py-2.5 text-sm font-bold text-[#102B2A] hover:border-[#187B65] hover:text-[#187B65] transition-colors">
            Commercial Recycling
          </Link>
        </div>
      </div>
    </section>
  );
}