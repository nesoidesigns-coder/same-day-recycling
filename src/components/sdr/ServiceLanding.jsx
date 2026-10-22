import { Link } from "react-router-dom";
import { Phone, CheckCircle2, ArrowRight, ShieldCheck, Leaf } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { useSEO, useStructuredData, PRODUCTION_URL } from "@/lib/seo";
import { useServiceMeta } from "@/components/seo/useServiceMeta";
import { CITIES } from "@/lib/cities";
import BeforeAfterGallery from "./BeforeAfterGallery";

const BASE = PRODUCTION_URL;

// Only claim service areas that are actually confirmed live — never "all of Canada".
const ACTIVE_CITIES = CITIES
  .filter((c) => c.status === "active")
  .map((c) => ({ "@type": "City", name: c.name }));

export default function ServiceLanding({ config }) {
  const { slug, name, eyebrow, h1, title, description, intro, items, steps, faqs, gallery_service } = config;
  const url = `${BASE}/${slug}`;

  const storedMeta = useServiceMeta(`/${slug}`, { title, description });
  useSEO({ ...storedMeta, path: `/${slug}` });
  useStructuredData(`${slug}-service`, {
    "@type": "Service",
    name,
    serviceType: name,
    provider: { "@id": `${BASE}/#organization` },
    url,
    description,
    areaServed: ACTIVE_CITIES,
  });
  useStructuredData(`${slug}-breadcrumb`, {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${BASE}/` },
      { "@type": "ListItem", position: 2, name: "Recycling Services", item: `${BASE}/#services` },
      { "@type": "ListItem", position: 3, name },
    ],
  });
  useStructuredData(`${slug}-faq`, faqs?.length ? {
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  } : null);

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />

      <section className="bg-[#f4f7f5]">
        <div className="max-w-7xl mx-auto px-4 py-14 md:py-20">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">{eyebrow}</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#102B2A] max-w-3xl">{h1}</h1>
          <p className="mt-5 text-lg text-slate-600 max-w-2xl">{intro}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/#book" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-3.5 hover:bg-[#125C4E] transition-colors">Book a Pickup</Link>
            <Link to="/pricing" className="rounded-full border-2 border-[#102B2A] text-[#102B2A] font-bold px-7 py-3.5 hover:bg-[#102B2A] hover:text-white transition-colors">See Transparent Pricing</Link>
            <a href="tel:+16048491745" className="rounded-full bg-white border border-slate-200 px-7 py-3.5 font-bold text-[#102B2A] hover:border-[#187B65] transition-colors flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#187B65]" /> (604) 849-1745
            </a>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-14">
        <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">What we take</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item} className="rounded-2xl border border-slate-100 bg-white p-5 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#187B65] shrink-0 mt-0.5" />
              <span className="font-semibold text-[#102B2A]">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f4f7f5]">
        <div className="max-w-7xl mx-auto px-4 py-14">
          <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">How it works</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-white border border-slate-100 p-6">
                <div className="w-9 h-9 rounded-full bg-[#187B65] text-[#102B2A] font-bold flex items-center justify-center">{i + 1}</div>
                <div className="mt-4 font-bold text-[#102B2A]">{s.title}</div>
                <p className="mt-2 text-sm text-slate-600">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {gallery_service && <BeforeAfterGallery service={gallery_service} />}

      <section className="max-w-7xl mx-auto px-4 py-14">
        <div className="rounded-3xl bg-[#f4f7f5] border border-[#187B65]/20 p-8 grid md:grid-cols-2 gap-6">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-6 h-6 text-[#187B65] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#102B2A]">Availability, stated honestly</div>
              <p className="mt-2 text-sm text-slate-600">
                Pickups are fulfilled in each city by our verified partner network — we confirm coverage for your address before booking.
                See <Link to="/coverage" className="font-semibold text-[#187B65] hover:underline">current coverage</Link> for confirmed, onboarding and planned cities.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Leaf className="w-6 h-6 text-[#187B65] shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-[#102B2A]">Recycling and donation first</div>
              <p className="mt-2 text-sm text-slate-600">
                Every load is sorted after pickup: reusable items go to donation partners, metal and electronics are recycled, and you can request a Recycling Impact Report for your records.
              </p>
            </div>
          </div>
        </div>
      </section>

      {faqs?.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 pb-14">
          <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">{name} — questions</h2>
          <div className="mt-8 space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="rounded-2xl border border-slate-200 bg-white p-5">
                <summary className="cursor-pointer font-bold text-[#102B2A]">{f.q}</summary>
                <p className="mt-3 text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="bg-[#102B2A]">
        <div className="max-w-7xl mx-auto px-4 py-14 text-center">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-white">Ready to clear it out?</h2>
          <p className="mt-3 text-slate-300">Get an instant quote online, or call (604) 849-1745 — we confirm availability before you book.</p>
          <Link to="/#book" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-8 py-4 hover:bg-[#125C4E] transition-colors">
            Book a Pickup <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}