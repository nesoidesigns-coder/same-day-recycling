import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, ArrowRight, Phone, BadgeCheck, Building2 } from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { REGIONS, regionByCode } from "@/lib/regions";
import { base44 } from "@/api/base44Client";
import { useSEO, useStructuredData } from "@/lib/seo";

const CITIES_BY_PROVINCE = {
  AB: ["Calgary", "Edmonton"],
  MB: ["Winnipeg"],
  ON: ["Toronto", "Ottawa", "Hamilton", "Mississauga"],
  QC: ["Montreal", "Quebec City"],
  NS: ["Halifax"],
};

export default function ProvincePage() {
  const { code } = useParams();
  const region = regionByCode((code || "").toUpperCase());
  const [providers, setProviders] = useState(null);

  useSEO({
    title: region ? `${region.name} Recycling Listings & Coverage | Same Day Recycling` : "Region Not Found | Same Day Recycling",
    description: region ? `Browse recycling listings and coverage information for ${region.name}. Listings appear where confirmed; check pickup availability before booking.` : "This region was not found. Browse the coverage page for available regions.",
    path: `/region/${region?.code || code}`,
    robots: region ? "index, follow" : "noindex, follow",
  });

  useStructuredData("region-breadcrumb", region ? {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://samedayrecycling.ca/" },
      { "@type": "ListItem", position: 2, name: "Coverage", item: "https://samedayrecycling.ca/coverage" },
      { "@type": "ListItem", position: 3, name: region.name, item: `https://samedayrecycling.ca/region/${region.code}` },
    ],
  } : null);

  useEffect(() => {
    if (!region) return;
    (async () => {
      const { items } = await base44.entities.Provider.filter({ province: region.name }, { limit: 200 });
      setProviders(items);
    })();
  }, [region?.code]);

  if (!region) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-4 py-24 text-center">
          <h1 className="text-3xl font-bold text-[#102B2A]">Region not found</h1>
          <p className="text-slate-500 mt-3">Browse our national coverage instead.</p>
          <Link to="/coverage" className="mt-6 inline-block rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 hover:bg-[#125C4E]">
            View coverage
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const verified = (providers || []).filter((p) => p.verification === "verified");
  const featured = verified.slice(0, 6);
  const cities = CITIES_BY_PROVINCE[region.code] || [];

  return (
    <div className="bg-white min-h-screen">
      <Navbar />

      <section className="bg-[#102B2A] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <div className="text-xs font-bold tracking-[0.2em] text-[#54D9AE] uppercase mb-3">
            {region.type === "province" ? "Province" : "Territory"} · Canada
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Recycling Services in {region.name}
          </h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl">
            Verified recycling providers, same-day removal partners and booking tools across {region.name}.
            {cities.length ? ` Same-day pickup is booking live in ${cities.join(", ")}.` : " Partner applications are open across the region."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="tel:+16048491745" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 hover:bg-[#125C4E] transition-colors flex items-center gap-2">
              <Phone className="w-4 h-4" /> Call (604) 849-1745
            </a>
            <Link to="/#book" className="rounded-full border border-[#187B65]/40 text-[#54D9AE] font-bold px-6 py-3 hover:bg-[#187B65]/10 transition-colors">
              Book a pickup
            </Link>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <Building2 className="w-4 h-4 text-[#187B65]" />
            <div className="text-2xl font-bold text-[#102B2A] mt-2">{providers === null ? "…" : providers.length}</div>
            <div className="text-xs text-slate-500 mt-1">Listed providers</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <BadgeCheck className="w-4 h-4 text-[#187B65]" />
            <div className="text-2xl font-bold text-[#102B2A] mt-2">{providers === null ? "…" : verified.length}</div>
            <div className="text-xs text-slate-500 mt-1">Verified locations</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <MapPin className="w-4 h-4 text-[#187B65]" />
            <div className="text-2xl font-bold text-[#102B2A] mt-2">{cities.length}</div>
            <div className="text-xs text-slate-500 mt-1">Same-day booking cities</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <div className="text-2xl font-bold text-[#102B2A] mt-4">24/7</div>
            <div className="text-xs text-slate-500 mt-1">Reception &amp; booking line</div>
          </div>
        </div>

        {cities.length > 0 && (
          <div className="mb-14">
            <h2 className="text-2xl font-bold text-[#102B2A]">Same-day service in {region.name}</h2>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map((city) => (
                <Link
                  key={city}
                  to="/#book"
                  className="group rounded-2xl border border-slate-100 bg-white shadow-sm p-6 flex items-center justify-between hover:border-[#187B65] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#187B65]" />
                    <div className="font-bold text-[#102B2A]">{city}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#187B65] transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-[#102B2A]">Verified recycling providers in {region.name}</h2>
        <p className="mt-2 text-slate-600">Details confirmed from official sources. Always confirm materials and fees with the facility before visiting.</p>
        {providers === null ? (
          <p className="text-slate-500 mt-8">Loading providers…</p>
        ) : featured.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-[#f4f7f5] border border-slate-100 p-8 text-slate-600">
            No verified providers listed in {region.name} yet. Our team is confirming locations — call us and we'll point you to the right facility.
          </div>
        ) : (
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {featured.map((p) => (
              <Link
                key={p.id}
                to={`/provider/${p.id}`}
                className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5 hover:border-[#187B65] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#102B2A]">{p.name}</span>
                  {p.verification === "verified" && <BadgeCheck className="w-4 h-4 text-[#187B65]" />}
                </div>
                <div className="text-xs text-slate-500 mt-1.5">{[p.address, p.city].filter(Boolean).join(", ") || region.name}</div>
                {p.accepted_categories?.length > 0 && (
                  <div className="text-xs text-slate-500 mt-2 line-clamp-2">Accepts: {p.accepted_categories.slice(0, 5).join(", ")}</div>
                )}
              </Link>
            ))}
          </div>
        )}

        <div className="mt-14 text-center">
          <Link to="/recycling" className="inline-flex items-center gap-2 rounded-full bg-[#102B2A] text-white font-bold px-7 py-3 hover:bg-[#0a3020] transition-colors">
            Browse the national directory <ArrowRight className="w-4 h-4 text-[#54D9AE]" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}