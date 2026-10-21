import { Link } from "react-router-dom";
import { useSEO } from "@/lib/seo";
import { MapPin, CheckCircle2, Rocket, Clock, ArrowRight, Phone, Hourglass } from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { COVERAGE, STATUS_LABELS } from "@/lib/coverage";
import { REGIONS } from "@/lib/regions";

const SECTIONS = [
  {
    status: "active",
    icon: <CheckCircle2 className="w-5 h-5 text-[#187B65]" />,
    dot: "bg-[#187B65]",
    intro: "Operating nationwide — every Canadian city is covered. Our dispatch team confirms pricing, pickup availability and your arrival window before issuing a guaranteed appointment.",
    cardLabel: "Same-day pickup — nationwide",
    linkFor: () => "/#book",
  },
  {
    status: "partner_onboarding",
    icon: <Rocket className="w-5 h-5 text-[#187B65]" />,
    dot: "bg-[#102B2A]",
    intro: "Inquiries are open in these cities today. A local provider is being matched or verified — service availability and scheduling are confirmed after your request.",
    cardLabel: "Inquiries open — matching provider",
    linkFor: (c) => `/request-service?city=${encodeURIComponent(c.name)}`,
  },
  {
    status: "coming_soon",
    icon: <Hourglass className="w-5 h-5 text-slate-400" />,
    dot: "bg-slate-300",
    intro: "These markets are active for inquiries — customer demand here drives contractor recruitment. Local availability is confirmed after your request, and no same-day service is promised.",
    cardLabel: "Inquiries open — recruiting provider",
    linkFor: (c) => `/request-service?city=${encodeURIComponent(c.name)}`,
  },
];

export default function Coverage() {
  useSEO({
    title: "Pickup Coverage & Network Expansion | Same Day Recycling",
    description: "Same-day recycling and junk removal in every Canadian city. Nationwide dispatch network, upfront pricing and arrival windows confirmed before each appointment.",
    path: "/coverage",
  });
  return (
    <div className="bg-white">
      <Navbar />

      <section className="bg-[#102B2A] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <div className="text-xs font-bold tracking-[0.2em] text-gold uppercase mb-3">Coverage</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.08]">Recycling &amp; Junk Removal Requests Across Canada</h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl">
            Service requests are open in all 10 provinces and 3 territories — cities, towns, rural
            communities and remote locations. Tell us what needs to go and we'll work to connect you
            with a qualified local service provider. Same-day fulfillment depends on contractor
            availability and is confirmed with you before anything is scheduled or charged.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
            {["Requests open in every province & territory", "Nationwide contractor matching", "Pricing & availability confirmed before pickup", "Every job tracked to completion"].map((t) => (
              <span key={t} className="inline-flex items-center rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-slate-100">
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {SECTIONS.map((s) => {
        const cities = COVERAGE.filter((c) => c.status === s.status);
        return (
          <section key={s.status} className={s.status === "partner_onboarding" ? "bg-[#f4f7f5]" : "bg-white"}>
            <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
              <h2 className="text-3xl font-bold text-[#102B2A] flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${s.dot}`} /> {STATUS_LABELS[s.status]}
              </h2>
              <p className="mt-2 text-slate-600 max-w-2xl">{s.intro}</p>
              <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {cities.map((c) => (
                  <Link
                    key={c.name}
                    to={s.linkFor(c)}
                    className="group rounded-2xl border border-slate-100 bg-white shadow-sm p-6 flex items-center justify-between hover:border-[#187B65] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {s.status === "active" ? (
                        <Clock className="w-5 h-5 text-[#187B65]" />
                      ) : s.status === "partner_onboarding" ? (
                        <Rocket className="w-5 h-5 text-[#187B65]" />
                      ) : (
                        <Hourglass className="w-5 h-5 text-slate-400" />
                      )}
                      <div>
                        <div className="font-bold text-[#102B2A]">{c.name}, {c.province}</div>
                        <div className="text-xs text-slate-500">{s.cardLabel}</div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#187B65] transition-colors" />
                  </Link>
                ))}
                <Link
                  to="/request-service"
                  className="rounded-2xl bg-[#102B2A] text-white p-6 flex items-center justify-between hover:bg-[#0a3020] transition-colors"
                >
                  <div>
                    <div className="font-bold">Your city not listed?</div>
                    <div className="text-xs text-slate-300 mt-1">Inquiries accepted in every Canadian city — availability and scheduling confirmed after your request.</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-[#187B65]" />
                </Link>
              </div>
            </div>
          </section>
        );
      })}

      <section className="bg-white border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl font-bold text-[#102B2A]">Browse by province &amp; territory</h2>
          <p className="mt-2 text-slate-600">Coverage status, verified listings and booking cities in every region.</p>
          <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {REGIONS.map((r) => (
              <Link
                key={r.code}
                to={`/region/${r.code}`}
                className="rounded-xl border border-slate-100 bg-white shadow-sm px-4 py-3.5 text-sm font-bold text-[#102B2A] hover:border-[#187B65] transition-colors"
              >
                {r.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-slate-100">
        <div className="max-w-3xl mx-auto px-4 py-16 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-[#102B2A]">Need a pickup in an active city?</h2>
          <p className="mt-2 text-slate-600">Call or text and we'll confirm coverage for your address.</p>
          <a href="tel:+16048491745" className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-8 py-4 hover:bg-[#125C4E] transition-colors">
            <Phone className="w-5 h-5" /> (604) 849-1745
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}