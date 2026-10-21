import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, Phone, CheckCircle2, ShieldCheck, Leaf, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useSEO, useStructuredData } from "@/lib/seo";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import RexBanner from "@/components/sdr/RexBanner";
import Services from "@/components/sdr/Services";
import QuoteCalculator from "@/components/sdr/QuoteCalculator";
import Booking from "@/components/sdr/Booking";
import NotFoundPage from "@/lib/NotFoundPage";
import { Image } from "@/components/ui/image";
import { cityFromSlug, CITIES } from "@/lib/cities";
import { regionByCode } from "@/lib/regions";

const HERO_IMG = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/5dbff3504_generated_image.png";

const BANDS = [
  { key: "minimum_pickup", size: "Minimum pickup", weight: "Up to 200 lbs" },
  { key: "eighth_truck", size: "1/8 truck", weight: "200 - 350 lbs" },
  { key: "quarter_truck", size: "1/4 truck", weight: "350 - 700 lbs" },
  { key: "half_truck", size: "1/2 truck", weight: "700 - 1,400 lbs" },
  { key: "three_quarter_truck", size: "3/4 truck", weight: "1,400 - 2,100 lbs" },
  { key: "full_truck", size: "Full truck", weight: "2,100 - 2,800 lbs" },
];

const FALLBACK_PRICES = {
  minimum_pickup: 139, eighth_truck: 189, quarter_truck: 269,
  half_truck: 419, three_quarter_truck: 549, full_truck: 649,
};

const TRUST_POINTS = [
  "Upfront pricing on every job, no hidden fees",
  "Recycling & donation first — never straight to landfill",
  "Same-day dispatch on bookings made before noon",
  "Trained crews for condo, strata and apartment move-outs",
];

export default function CityPage() {
  const { pageSlug } = useParams();
  const prefix = "junk-removal-";
  const slug = pageSlug && pageSlug.startsWith(prefix) ? pageSlug.slice(prefix.length) : null;
  const city = slug ? cityFromSlug(slug) : null;
  const isActive = city?.status === "active";
  const region = city ? regionByCode(city.province) : null;

  const [prices, setPrices] = useState(FALLBACK_PRICES);
  const [centers, setCenters] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [quotePrefill, setQuotePrefill] = useState(null);

  useSEO({
    title: city ? (isActive ? `Junk Removal in ${city.name}, ${city.province} | Same Day Recycling` : `${city.name} Recycling Coverage: ${city.status === "partner_onboarding" ? "Partner Onboarding" : "Planned Expansion"} | Same Day Recycling`) : "Page Not Found | Same Day Recycling",
    description: city ? (isActive ? `Request furniture, appliance and junk removal in ${city.name}, ${city.province}. Check local pickup availability and get an upfront estimate before booking.` : `Pickup service is not live in ${city.name}, ${city.province}. ${city.status === "partner_onboarding" ? "Partner recruitment or verification is underway." : "Expansion is planned."} Check confirmed areas or apply as a provider.`) : "This page was not found. Browse recycling services, software or confirmed coverage.",
    path: pageSlug ? `/${pageSlug}` : "/",
    robots: city && isActive ? "index, follow" : "noindex, follow",
  });

  useStructuredData("city-breadcrumb", city ? {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://samedayrecycling.ca/" },
      { "@type": "ListItem", position: 2, name: region?.name || "Canada", item: region ? `https://samedayrecycling.ca/region/${region.code}` : "https://samedayrecycling.ca/coverage" },
      { "@type": "ListItem", position: 3, name: city.name, item: `https://samedayrecycling.ca/${prefix}${slug}` },
    ],
  } : null);

  useStructuredData("city-faq", city ? {
    "@type": "FAQPage",
    mainEntity: (isActive ? ACTIVE_FAQ(city) : OFFBOARD_FAQ(city)).map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null);

  useEffect(() => {
    if (!city) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await base44.functions.invoke("cityPricing", { city: city.name });
        if (!cancelled && res?.data?.prices) setPrices({ ...FALLBACK_PRICES, ...res.data.prices });
      } catch { /* fallback rates already set */ }
      try {
        const c = await base44.entities.RecyclingCenter.filter({ city: city.name }, { limit: 12 });
        if (!cancelled) setCenters(Array.isArray(c) ? c : c.items || []);
      } catch { /* section hides itself */ }
      try {
        const r = await base44.entities.Review.filter({ approved: true, city: city.name }, { limit: 6 });
        if (!cancelled) setReviews(Array.isArray(r) ? r : r.items || []);
      } catch { /* section hides itself */ }
    })();
    return () => { cancelled = true; };
  }, [city?.name]);

  // Structured data for search engines and AI answer engines
  useEffect(() => {
    if (!city || !isActive) return undefined;
    const ld = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: `Junk removal in ${city.name}`,
      provider: { "@id": "https://samedayrecycling.ca/#organization" },
      url: `https://samedayrecycling.ca/${prefix}${slug}`,
      areaServed: { "@type": "City", name: city.name },
      description: `Furniture, appliance and junk removal requests in ${city.name}, ${city.province}. Pickup availability is confirmed before booking.`,
    };
    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "city-jsonld";
    el.text = JSON.stringify(ld);
    document.head.appendChild(el);
    return () => { document.getElementById("city-jsonld")?.remove(); };
  }, [city?.name]);

  if (!city) return <NotFoundPage />;

  const bookFromQuote = (payload) => {
    setQuotePrefill(payload);
    document.getElementById("book")?.scrollIntoView({ behavior: "smooth" });
  };

  const neighbours = CITIES.filter((c) => c.province === city.province && c.name !== city.name);

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />

      {/* Hero */}
      <section className="bg-[#f4f7f5]">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20 grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">
              {city.name} &amp; area · Part of Canada's national partner network
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#102B2A]">
              {city.seo_title} in {city.name}, {city.province}
            </h1>
            <p className="mt-5 text-lg text-slate-600">{city.blurb}</p>
            {isActive ? (
              <>
                <div className="mt-6 flex flex-wrap gap-3">
                  <a href="#book" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-3.5 hover:bg-[#125C4E] transition-colors">Book a Pickup in {city.name}</a>
                  <a href="#quote" className="rounded-full border-2 border-[#102B2A] text-[#102B2A] font-bold px-7 py-3.5 hover:bg-[#102B2A] hover:text-white transition-colors">Get a Free Quote</a>
                </div>
                <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5 font-semibold"><CheckCircle2 className="w-4 h-4 text-[#187B65]" /> Same-day slots when booked before noon</span>
                  <span className="flex items-center gap-1.5 font-semibold"><ShieldCheck className="w-4 h-4 text-[#187B65]" /> Upfront pricing from ${prices.minimum_pickup}</span>
                  <a href="tel:+16048491745" className="flex items-center gap-1.5 font-semibold text-[#102B2A] hover:text-[#187B65]"><Phone className="w-4 h-4 text-[#187B65]" /> (604) 849-1745</a>
                </div>
              </>
            ) : (
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/contractors" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-3.5 hover:bg-[#125C4E] transition-colors">Apply as a {city.name} partner</Link>
                <Link to="/coverage" className="rounded-full border-2 border-[#102B2A] text-[#102B2A] font-bold px-7 py-3.5 hover:bg-[#102B2A] hover:text-white transition-colors">See live coverage</Link>
              </div>
            )}
          </div>
          <div className="rounded-3xl overflow-hidden border border-slate-100 shadow-sm">
            <Image src={HERO_IMG} alt={`Junk removal crew in ${city.name}`} className="w-full aspect-[4/3]" fittingType="fill" />
          </div>
        </div>
      </section>

      {isActive && <RexBanner message={`I've got ${city.name}'s pricing and pickup rules memorized — just ask!`} />}

      {!isActive && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="rounded-3xl bg-[#f4f7f5] border border-[#187B65]/20 p-8 max-w-2xl">
            <div className="flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3"><MapPin className="w-4 h-4" /> {city.status === "coming_soon" ? "Coming Soon" : "Partner Onboarding"}</div>
            <h2 className="text-2xl font-bold text-[#102B2A]">Service in {city.name} is not live yet</h2>
            <p className="mt-3 text-slate-600">
              We only advertise same-day service where operator coverage is confirmed — and {city.name} hasn't reached that bar yet.
              {city.status === "partner_onboarding" ? " A partner is being recruited or verified for this territory right now." : " Expansion here is planned."}
            </p>
          </div>
        </section>
      )}

      <Services />

      {/* Service area */}
      <section className="bg-[#f4f7f5]">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Service area</div>
          <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">We cover {city.name} — and our partner cities across {region?.name || "Canada"}</h2>
          <p className="mt-3 text-slate-600 max-w-2xl">Our trucks run same-day routes across the region, and our national partner network keeps adding cities — so a pickup is never far away.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {neighbours.map((c) => (
              <Link key={c.slug} to={`/${prefix}${c.slug}`} className="rounded-full bg-white border border-slate-200 px-4 py-2 text-sm font-semibold text-[#102B2A] hover:border-[#187B65] hover:text-[#187B65] transition-colors">
                {c.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* City pricing */}
      {isActive && (
        <section id="pricing" className="max-w-7xl mx-auto px-4 py-14">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Upfront, guaranteed</div>
          <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">Junk removal prices in {city.name}</h2>
          <p className="mt-3 text-slate-600 max-w-2xl">You pay by truck space, not by the hour — the price we quote is the price you pay. Book before noon for same-day pickup.</p>
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {BANDS.map((b) => (
              <div key={b.key} className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className="font-bold text-[#102B2A]">{b.size}</div>
                <div className="text-sm text-slate-500">{b.weight}</div>
                <div className="mt-2 text-2xl font-bold text-[#187B65]">${prices[b.key]}</div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-500 flex items-center gap-1.5"><Leaf className="w-4 h-4 text-[#187B65]" /> Recycling and donation are always included — you never pay extra for eco disposal.</p>
        </section>
      )}

      {/* Recycling centers */}
      {centers.length > 0 && (
        <section className="bg-[#f4f7f5]">
          <div className="max-w-7xl mx-auto px-4 py-14">
            <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Live recycling map</div>
            <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">Recycling centers in {city.name}</h2>
            <p className="mt-3 text-slate-600">Real drop-off depots, transfer stations and recycling facilities — researched and kept up to date for you.</p>
            <div className="mt-8 grid md:grid-cols-2 gap-4">
              {centers.map((c) => (
                <div key={c.id} className="rounded-2xl bg-white border border-slate-100 p-5">
                  <div className="font-bold text-[#102B2A]">{c.name}</div>
                  <div className="text-sm text-slate-500 mt-1">{c.address}</div>
                  {c.accepts && <div className="text-sm text-slate-500 mt-2"><span className="font-semibold text-[#102B2A]">Accepts:</span> {c.accepts}</div>}
                  <div className="mt-3 flex gap-4 text-sm font-semibold">
                    {c.phone && <a href={`tel:${c.phone}`} className="text-[#187B65] hover:underline">Call</a>}
                    {c.website && <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-[#187B65] hover:underline">Website</a>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Trust */}
      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid lg:grid-cols-2 gap-10 items-start">
          <div>
            <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Trusted in {city.name}</div>
            <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">Why {city.name} trusts Same Day Recycling</h2>
            <ul className="mt-6 space-y-3">
              {TRUST_POINTS.map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-slate-700"><CheckCircle2 className="w-5 h-5 text-[#187B65] shrink-0 mt-0.5" /> {t}</li>
              ))}
            </ul>
          </div>
          {reviews.length > 0 && (
            <div className="space-y-4">
              <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase">Reviews</div>
              <h3 className="text-2xl font-bold text-[#102B2A]">What {city.name} customers say</h3>
              {reviews.map((r) => (
                <div key={r.id} className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-5">
                  <div className="text-gold font-bold">{"★".repeat(Math.round(r.rating))}</div>
                  <p className="mt-2 text-slate-700">"{r.text}"</p>
                  <div className="mt-2 text-sm font-semibold text-[#102B2A]">{r.customer_name} · Verified customer · {r.city}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Quote + booking */}
      {isActive && (
        <>
          <section id="quote" className="bg-[#f4f7f5]">
            <div className="max-w-7xl mx-auto px-4 py-14">
              <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">No guesswork</div>
              <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">Get an instant {city.name} quote</h2>
              <p className="mt-3 text-slate-600">Pick your items or describe the job — see the price before you book.</p>
              <div className="mt-8"><QuoteCalculator onBook={bookFromQuote} city={city.name} /></div>
            </div>
          </section>
          <Booking prefill={{ ...(quotePrefill || {}), city: city.name }} />
        </>
      )}

      {/* Local guide + FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-14">
        <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">Junk removal in {city.name}, {city.province} — what locals should know</h2>
        <p className="mt-4 text-slate-600">
          {isActive
            ? `Same-day pickup is live in ${city.name}: book before noon and a crew is usually there the same afternoon. Every load is sorted after pickup — furniture in good shape goes to donation partners, metal goes to recyclers, and the rest is disposed of responsibly rather than a straight-to-landfill run.`
            : `Same Day Recycling is expanding across ${region?.name || "Canada"} through its partner network. Until a ${city.name} partner is verified, this page reflects planned coverage only — see our live coverage areas for same-day service today.`}
        </p>
        <div className="mt-8 space-y-3">
          {(isActive ? ACTIVE_FAQ(city) : OFFBOARD_FAQ(city)).map((f) => (
            <details key={f.q} className="rounded-2xl border border-slate-200 bg-white p-5" open={false}>
              <summary className="cursor-pointer font-bold text-[#102B2A]">{f.q}</summary>
              <p className="mt-3 text-slate-600">{f.a}</p>
            </details>
          ))}
        </div>
        <a href={isActive ? "#book" : "/contractors"} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-3.5 hover:bg-[#125C4E] transition-colors">
          {isActive ? `Book a pickup in ${city.name}` : "Become a partner"} <ArrowRight className="w-4 h-4" />
        </a>
      </section>

      <Footer />
    </div>
  );
}

const ACTIVE_FAQ = (city) => [
  { q: `Do you really do same-day pickup in ${city.name}?`, a: "Yes — book before noon and we'll usually reach you the same afternoon. Afternoon bookings are typically next-day." },
  { q: "What does junk removal cost here?", a: `Our ${city.name} rates start at $${FALLBACK_PRICES.minimum_pickup} for a minimum pickup and scale by truck space — see the pricing table above. The price we quote is the price you pay.` },
  { q: "Do you take mattresses and appliances?", a: "Yes. Mattresses, fridges, washers and stoves all go out with the crew — appliances are recycled as scrap metal." },
  { q: "What happens to my junk?", a: "Every load is sorted: furniture in good shape is donated, metal and electronics are recycled, and only the true remainder is responsibly disposed." },
];

const OFFBOARD_FAQ = (city) => [
  { q: `Is same-day service live in ${city.name} yet?`, a: "Not yet. This page reflects planned or onboarding coverage only — we list a city as live only once a partner is verified." },
  { q: "When will service start?", a: "Territories open as verified partners come on board. Contractors and haulers in the area can apply through our partner program today." },
  { q: "Where is service live right now?", a: "See the coverage page for the current list of Active & Verified cities — new territories are added as partners are verified." },
];