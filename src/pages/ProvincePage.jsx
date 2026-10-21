import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MapPin, ArrowRight, Phone, BadgeCheck, Building2, Rocket, CheckCircle2, Hourglass, ClipboardCheck } from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { REGIONS, regionByCode } from "@/lib/regions";
import { COVERAGE, STATUS_LABELS } from "@/lib/coverage";
import { CITIES } from "@/lib/cities";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { base44 } from "@/api/base44Client";
import { useSEO, useStructuredData } from "@/lib/seo";

// Counters and city lists are derived from the coverage source of truth
// (src/lib/coverage.js) and actual directory records — never hardcoded.
// Directory facilities are independent drop-off sites, never shown as
// Same Day Recycling pickup partners.
export default function ProvincePage() {
  const { code } = useParams();
  const region = regionByCode((code || "").toUpperCase());
  const { statusFor, loaded: coverageLoaded } = useCoverageStatus();
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
      const { items } = await base44.entities.Provider.filter(
        { $or: [{ province: region.code }, { province: region.name }] },
        { limit: 200 }
      );
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
  const cities = COVERAGE.filter((c) => c.province === region.code);
  // Live per-city status from the coverage status engine — never hardcoded.
  const cityStatus = (name) => statusFor(name) || (coverageLoaded ? "recruiting" : null);
  const activeCities = cities.filter((c) => cityStatus(c.name) === "same_day");
  const matchingCities = cities.filter((c) => cityStatus(c.name) === "matching");
  const recruitingCities = cities.filter((c) => cityStatus(c.name) === "recruiting");
  const slugFor = (name) => CITIES.find((c) => c.name === name)?.slug || "";

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
          <div className="mt-5 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-[11px] font-bold text-emerald-700">
            <ClipboardCheck className="w-3.5 h-3.5" /> Service Requests Open
          </div>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl">
            Service requests are open across {region.name} — every city, town, rural community and
            remote location. Tell us what needs to go and we'll work to connect you with a qualified
            local service provider.
            {activeCities.length ? (
              <> Confirmed same-day capacity today in <span className="text-white font-semibold">{activeCities.map((c) => c.name).join(", ")}</span>.</>
            ) : null}{" "}
            Same-day fulfillment depends on contractor availability and is confirmed with you before anything is scheduled or charged.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={`/request-service?province=${region.code}`} className="rounded-full bg-[#187B65] text-white font-bold px-6 py-3 hover:bg-[#125C4E] transition-colors flex items-center gap-2">
              Request Service <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/contractors" className="rounded-full border border-[#187B65]/40 text-[#54D9AE] font-bold px-6 py-3 hover:bg-[#187B65]/10 transition-colors">
              Find Local Contractor
            </Link>
            <Link to={`/recycling?loc=${encodeURIComponent(region.name)}`} className="rounded-full border border-[#187B65]/40 text-[#54D9AE] font-bold px-6 py-3 hover:bg-[#187B65]/10 transition-colors">
              View Recycling Directory
            </Link>
            <a href="tel:+16048491745" className="rounded-full border border-white/20 text-slate-200 font-bold px-6 py-3 hover:bg-white/10 transition-colors flex items-center gap-2">
              <Phone className="w-4 h-4" /> Call (604) 849-1745
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-12">
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <Building2 className="w-4 h-4 text-[#187B65]" />
            <div className="text-2xl font-bold text-[#102B2A] mt-2">{providers === null ? "…" : providers.length}</div>
            <div className="text-xs text-slate-500 mt-1">Listed facilities</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <BadgeCheck className="w-4 h-4 text-[#187B65]" />
            <div className="text-2xl font-bold text-[#102B2A] mt-2">{providers === null ? "…" : verified.length}</div>
            <div className="text-xs text-slate-500 mt-1">Verified facilities</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <CheckCircle2 className="w-4 h-4 text-[#187B65]" />
            <div className="text-2xl font-bold text-[#102B2A] mt-2">{activeCities.length}</div>
            <div className="text-xs text-slate-500 mt-1">Same-day availability cities</div>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
            <div className="text-2xl font-bold text-[#102B2A] mt-4">24/7</div>
            <div className="text-xs text-slate-500 mt-1">Reception &amp; booking line</div>
          </div>
        </div>

        {cities.length > 0 && (
          <div className="mb-14">
            <h2 className="text-2xl font-bold text-[#102B2A]">Service status by city in {region.name}</h2>
            <p className="mt-2 text-slate-600 text-sm">
              {activeCities.length} same-day availability · {matchingCities.length} matching · {recruitingCities.length} recruiting. Each card links to that city's real status page.
            </p>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cities.map((city) => {
                const st = cityStatus(city.name);
                const Icon = st === "same_day" ? CheckCircle2 : st === "matching" ? Rocket : Hourglass;
                return (
                  <Link
                    key={city.name}
                    to={`/junk-removal-${slugFor(city.name)}`}
                    className="group rounded-2xl border border-slate-100 bg-white shadow-sm p-6 flex items-center justify-between hover:border-[#187B65] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${st === "same_day" ? "text-[#187B65]" : st === "matching" ? "text-[#102B2A]" : "text-slate-400"}`} />
                      <div>
                        <div className="font-bold text-[#102B2A]">{city.name}</div>
                        <div className="text-xs text-slate-500">{st ? STATUS_LABELS[st] : "Checking live status…"}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#187B65] transition-colors" />
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <h2 className="text-2xl font-bold text-[#102B2A]">Independent recycling facilities in {region.name}</h2>
        <p className="mt-2 text-slate-600">
          These are independent drop-off facilities listed for your convenience — they are not Same Day Recycling pickup partners. Details confirmed from official sources; always confirm materials and fees with the facility before visiting.
        </p>
        {providers === null ? (
          <p className="text-slate-500 mt-8">Loading facilities…</p>
        ) : featured.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-[#f4f7f5] border border-slate-100 p-8 text-slate-600">
            No facilities listed in {region.name} yet. Our team researches locations from official sources before listing them — call us and we'll point you to the right facility.
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
            Browse the facility directory <ArrowRight className="w-4 h-4 text-[#54D9AE]" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}