import { Link } from "react-router-dom";
import { useSEO } from "@/lib/seo";
import { CheckCircle2, ArrowRight, Phone, Hourglass, RefreshCw, UserSearch } from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { REGIONS } from "@/lib/regions";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import CoverageMap from "@/components/coverage/CoverageMap";

// Coverage page — driven entirely by the live status engine
// (src/hooks/useCoverageStatus.js → coverageStatus endpoint). Three honest,
// data-backed states, applied with the same labels on every public surface:
//   Provider Available                   — active, verified provider serves city
//   Requests Open — Contractor Matching  — open requests are being matched
//   Provider Recruitment                 — requests accepted, capacity recruiting
export default function Coverage() {
  useSEO({
    title: "Pickup Coverage & Network Expansion | Same Day Recycling",
    description: "Recycling and junk removal requests accepted in every Canadian city. Nationwide contractor network, upfront pricing and arrival windows confirmed before each appointment.",
    path: "/coverage",
  });

  const { statusFor, loaded, error, locations } = useCoverageStatus();
  const slugFor = (name) => locations.find((city) => city.name === name)?.href || `/request-service?city=${encodeURIComponent(name)}`;
  const sameDayCitiesList = locations.filter((city) => statusFor(city.name) === "same_day");
  const matchingList = locations.filter((city) => statusFor(city.name) === "matching");
  const recruitingList = locations.filter((city) => statusFor(city.name) === "recruiting");
  const unavailableList = locations.filter((city) => statusFor(city.name) === "currently_unavailable");

  const SECTIONS = [
    {
      key: "same_day",
      title: "Provider Available",
      icon: <CheckCircle2 className="w-5 h-5 text-[#187B65]" />,
      dot: "bg-[#187B65]",
      intro: "An active, verified contractor lists this city as their service area. This does not confirm same-day capacity or an appointment. A booking is confirmed only after a contractor accepts the specific job and your price and arrival window are agreed.",
      cardLabel: "Verified provider — job acceptance still required",
      cities: sameDayCitiesList,
      bg: "bg-white",
      empty: "No active, verified contractor is currently listed for a city. Requests remain open nationwide; fulfillment is not confirmed until a qualified contractor accepts your job.",
    },
    {
      key: "matching",
      title: "Requests Open — Contractor Matching",
      icon: <UserSearch className="w-5 h-5 text-[#187B65]" />,
      dot: "bg-gold",
      intro: "These cities have open service requests right now; the system is matching or recruiting a local contractor. Availability, price and your arrival window are confirmed after your request, never before.",
      cardLabel: "Open request — contractor matching in progress",
      cities: matchingList,
      bg: "bg-[#f4f7f5]",
      empty: "No open matching requests right now — new requests appear here the moment they arrive.",
    },
    {
      key: "recruiting",
      title: "Provider Recruitment",
      icon: <Hourglass className="w-5 h-5 text-slate-400" />,
      dot: "bg-slate-300",
      intro: "Requests are open in these territories, but no verified contractor is active yet — customer demand here drives contractor recruitment. Requests are still accepted nationwide and no same-day service is promised.",
      cardLabel: "Requests open — recruiting provider",
      cities: recruitingList,
      bg: "bg-white",
      empty: "Every registry territory currently has verified capacity or active matching.",
    },
    {
      key: "currently_unavailable", title: "Unavailable",
      icon: <Hourglass className="w-5 h-5 text-muted-foreground" />, dot: "bg-muted-foreground",
      intro: "Verified territory records exist, but no current dispatch availability is confirmed. Requests remain open for review; no pickup is promised.",
      cardLabel: "No current dispatch availability confirmed", cities: unavailableList,
      bg: "bg-background", empty: "No listed verified territories are currently marked unavailable.",
    },
  ];

  return (
    <div className="bg-white">
      <Navbar />

      <section className="bg-[#102B2A] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <div className="text-xs font-bold tracking-[0.2em] text-gold uppercase mb-3">Coverage</div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight leading-[1.08]">Recycling &amp; Junk Removal Requests Across Canada</h1>
          <p className="mt-5 text-lg text-slate-300 max-w-2xl">
            Request junk removal anywhere in Canada. Same-day service is subject to confirmed local
            provider availability. Service requests are open in all 10 provinces and 3 territories —
            cities, towns, rural communities and remote locations. Tell us what needs to go and we'll
            work to connect you with a qualified local service provider, with price and arrival
            window confirmed with you before anything is scheduled or charged.
          </p>
          <div className="mt-6 flex flex-wrap gap-2 text-xs font-bold">
            {["Requests open in every province & territory", "Nationwide contractor matching", "Pricing & availability confirmed before pickup", "Every job tracked to completion"].map((t) => (
              <span key={t} className="inline-flex items-center rounded-full bg-white/10 border border-white/15 px-3 py-1.5 text-slate-100">
                {t}
              </span>
            ))}
          </div>
          {!loaded && !error && (
            <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/10 border border-white/15 px-4 py-2 text-sm text-slate-200">
              <RefreshCw className="w-4 h-4 animate-spin" /> Checking live network status…
            </div>
          )}
          {error && <p role="status" className="mt-6 text-sm text-slate-200">Live coverage status is unavailable. Requests remain open; call (604) 849-1745 to check your address. No availability is assumed.</p>}
        </div>
      </section>

      <section className="bg-[#f4f7f5] border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
          <CoverageMap />
        </div>
      </section>

      {SECTIONS.map((s) => (
        <section key={s.key} className={s.bg}>
          <div className="max-w-7xl mx-auto px-4 py-16 md:py-20">
            <h2 className="text-3xl font-bold text-[#102B2A] flex items-center gap-3">
              <span className={`w-3 h-3 rounded-full ${s.dot}`} /> {s.title}
            </h2>
            <p className="mt-2 text-slate-600 max-w-2xl">{s.intro}</p>
            {loaded && s.cities.length === 0 && (
              <div className="mt-6 rounded-2xl border border-slate-100 bg-[#f4f7f5] p-5 max-w-2xl text-sm text-slate-600">
                {s.empty}
              </div>
            )}
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {s.cities.map((c) => (
                <Link
                  key={c.name}
                  to={slugFor(c.name)}
                  className="group rounded-2xl border border-slate-100 bg-white shadow-sm p-6 flex items-center justify-between hover:border-[#187B65] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {s.icon}
                    <div>
                      <div className="font-bold text-[#102B2A]">{c.name}{c.province ? `, ${c.province}` : ""}</div>
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
      ))}

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
          <h2 className="text-2xl md:text-3xl font-bold text-[#102B2A]">Need a pickup?</h2>
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