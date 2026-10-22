import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search, MapPin, CheckCircle2, Clock, UserSearch, ArrowRight,
  Truck, Armchair, Refrigerator, Tv, Building2, Timer, Recycle, Wrench, Key, Phone,
} from "lucide-react";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { useServiceMeta } from "@/components/seo/useServiceMeta";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import PostalCheck, { PROVINCE_NAMES } from "@/components/sdr/PostalCheck";
import { CITIES } from "@/lib/cities";
import { REGIONS } from "@/lib/regions";
import { useSEO, useStructuredData } from "@/lib/seo";

const CATEGORIES = [
  { name: "Junk Removal", desc: "General junk, garage & estate cleanouts, renovation debris", to: "/#services", icon: Truck },
  { name: "Furniture Removal", desc: "Sofas, mattresses, dressers, office furniture", to: "/furniture-removal", icon: Armchair },
  { name: "Appliance Pickup", desc: "Fridges, washers, stoves — recycled as scrap metal", to: "/appliance-removal", icon: Refrigerator },
  { name: "Electronics Recycling", desc: "TVs, computers, printers and office e-waste", to: "/electronics-recycling", icon: Tv },
  { name: "Commercial & Office", desc: "Office cleanouts, fit-out debris, recurring programs", to: "/commercial-recycling", icon: Building2 },
  { name: "Same-Day Pickup", desc: "Request a same-day window, subject to contractor acceptance", to: "/same-day-pickup", icon: Timer },
  { name: "Recycling Directory", desc: "Verified drop-off centers across every province", to: "/recycling", icon: Recycle },
  { name: "Free Metal Pickup", desc: "Scrap metal collected free where partners are live", to: "/free-metal-pickup", icon: Wrench },
  { name: "Property Management", desc: "Recurring cleanouts for strata & rentals", to: "/property-managers", icon: Key },
];

const chipFor = (statusFor, loaded, city, error) => {
  const s = loaded ? statusFor(city) : null;
  if (s === "same_day") return { label: "Provider Available", cls: "bg-[#187B65]/10 text-[#187B65] border-[#187B65]/30", icon: CheckCircle2 };
  if (s === "matching") return { label: "Requests Open — Contractor Matching", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: UserSearch };
  if (s === "recruiting") return { label: "Provider Recruitment", cls: "bg-slate-100 text-slate-500 border-slate-200", icon: Clock };
  return { label: error ? "Status unavailable — requests open" : "Checking live status…", cls: "bg-slate-100 text-slate-400 border-slate-200", icon: Clock };
};

export default function ExploreServices() {
  const [query, setQuery] = useState("");
  const { statusFor, loaded, error, locations } = useCoverageStatus();

  const meta = useServiceMeta("/services", {
    title: "Explore Recycling & Junk Removal Services Across Canada | Same Day Recycling",
    description: "Search every Canadian city and province we cover, check availability by postal code, and browse residential and commercial recycling and removal services — with honest, verified coverage status.",
  });
  useSEO({ ...meta, path: "/services" });
  useStructuredData("services-breadcrumb", {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://samedayrecycling.ca/" },
      { "@type": "ListItem", position: 2, name: "Explore Services", item: "https://samedayrecycling.ca/services" },
    ],
  });

  const normalized = query.trim().toLowerCase();
  const filtered = locations.filter((c) =>
    !normalized || c.name.toLowerCase().includes(normalized) || (PROVINCE_NAMES[c.province] || "").toLowerCase().includes(normalized)
  );
  const groups = [...REGIONS, { code: null, name: "Other requested service locations" }]
    .map((r) => ({ region: r, cities: filtered.filter((c) => c.province === r.code) }))
    .filter((g) => g.cities.length > 0);
  const activeCount = locations.filter((city) => statusFor(city.name) === "same_day").length;

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />

      <section className="bg-[#f4f7f5]">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Explore Services Across Canada</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#102B2A] max-w-3xl">
            Find recycling and removal services in your city
          </h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl">
            Search any Canadian city, check availability by postal code, and browse residential and commercial services.
            A city is only shown as live when coverage is verified — never before.
          </p>
        </div>
      </section>

      {/* Availability legend + postal check */}
      <section className="max-w-7xl mx-auto px-4 py-12 grid lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-slate-100 p-5">
            <h2 className="font-bold text-[#102B2A]">What our coverage statuses mean</h2>
            {error && <p role="status" className="mt-3 text-sm text-slate-600">Live coverage could not be loaded. No city is treated as available or recruiting until status is known; requests remain open.</p>}
            <div className="mt-4 space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-[#187B65] shrink-0 mt-0.5" />
                <div className="text-sm"><span className="font-bold text-[#102B2A]">Provider Available {loaded ? `(${activeCount} ${activeCount === 1 ? "city" : "cities"})` : error ? "(status unavailable)" : "(checking…)"}</span><span className="block text-slate-600">An active, verified contractor serves the named city. Same-day capacity is not assumed; the contractor must accept your specific job before the appointment is confirmed.</span></div>
              </div>
              <div className="flex items-start gap-3">
                <UserSearch className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm"><span className="font-bold text-[#102B2A]">Requests Open — Contractor Matching</span><span className="block text-slate-600">Open service requests here are being matched or recruited right now — never promised same-day.</span></div>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div className="text-sm"><span className="font-bold text-[#102B2A]">Provider Recruitment</span><span className="block text-slate-600">Requests are accepted nationwide — our dispatch team is recruiting a local contractor for this market.</span></div>
              </div>
            </div>
          </div>
        </div>
        <PostalCheck onCity={(cityName) => {
          const city = CITIES.find((c) => c.name === cityName);
          if (city) window.location.href = `/junk-removal-${city.slug}`;
        }} />
      </section>

      {/* Service categories */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">Service categories</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.name}
              to={cat.to}
              className="group rounded-2xl border border-slate-100 bg-white p-6 hover:border-[#187B65] transition-colors"
            >
              <cat.icon className="w-6 h-6 text-[#187B65]" />
              <div className="mt-3 font-bold text-[#102B2A]">{cat.name}</div>
              <p className="mt-1.5 text-sm text-slate-600">{cat.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-[#187B65]">
                Explore <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* City browser */}
      <section className="bg-[#f4f7f5]">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">Service locations</h2>
              <p className="mt-2 text-slate-600 text-sm">{locations.length} locations across every province and territory — statuses reflect verified coverage.</p>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search a city or province…"
                aria-label="Search service locations"
                className="input !bg-white pl-10"
              />
            </div>
          </div>

          {groups.length === 0 ? (
            <div className="mt-8 rounded-2xl bg-white border border-slate-100 p-8 text-slate-600">
              No cities match "{query}". Try a province name like "British Columbia" or a city like "Surrey".
            </div>
          ) : (
            <div className="mt-8 space-y-8">
              {groups.map((g) => (
                <div key={g.region.code}>
                  <div className="flex items-center gap-2 text-xs font-bold tracking-[0.15em] text-[#187B65] uppercase mb-3">
                    <MapPin className="w-3.5 h-3.5" /> {g.region.name}
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {g.cities.map((c) => {
                      const chip = chipFor(statusFor, loaded, c.name, error);
                      return (
                        <Link
                          key={c.name}
                          to={c.href}
                          className="group rounded-2xl bg-white border border-slate-100 p-4 hover:border-[#187B65] transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-[#102B2A]">{c.name}</span>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#187B65] transition-colors" />
                          </div>
                          <span className={`mt-3 inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold ${chip.cls}`}>
                            <chip.icon className="w-3 h-3" /> {chip.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#102B2A]">
        <div className="max-w-7xl mx-auto px-4 py-14 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Not sure where to start?</h2>
          <p className="mt-3 text-slate-300">Tell our assistant what you need removed and it will check verified availability for you.</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Link to="/service-finder" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-8 py-4 hover:bg-[#125C4E] transition-colors">Try the Service Finder</Link>
            <a href="tel:+16048491745" className="rounded-full border border-[#187B65]/40 text-[#54D9AE] font-bold px-8 py-4 hover:bg-[#187B65]/10 transition-colors flex items-center gap-2">
              <Phone className="w-4 h-4" /> (604) 849-1745
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}