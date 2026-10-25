import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Sofa, Refrigerator, Truck, Recycle, Building2, Boxes, DollarSign, MapPin, HelpCircle, ShieldCheck, BadgeCheck, HardHat, Network, MonitorSmartphone, ArrowRight } from "lucide-react";
import { useSEO } from "@/lib/seo";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import IntelligencePreview from "@/components/home/IntelligencePreview";
import LiveRing from "@/components/os/LiveRing";

// Recycling OS homepage prototype (Phase 1) — lives on its own route so the
// live homepage stays untouched until this passes review. Five sections:
// Welcome search, Recycling OS LIVE preview, everyday services, consumer
// intelligence, contractor opportunities.

const SERVICES = [
  { icon: Sofa, title: "Furniture Removal", desc: "Sofas, mattresses and dressers, hauled away responsibly.", to: "/furniture-removal" },
  { icon: Refrigerator, title: "Appliance Removal", desc: "Fridges, washers and stoves, safely removed and recycled.", to: "/appliance-removal" },
  { icon: Truck, title: "Junk Removal", desc: "One pickup or a whole load — describe it and get a quote.", to: "/request-service" },
  { icon: Boxes, title: "Moving Cleanouts", desc: "Clear out what's left behind before or after your move.", to: "/move-assist" },
  { icon: Recycle, title: "Recycling Options", desc: "Where your materials really go, with cited sources.", to: "/recycling" },
  { icon: Building2, title: "Commercial Services", desc: "Office, retail and property pickups on your schedule.", to: "/commercial-recycling" },
];

const QUESTIONS = [
  { icon: DollarSign, q: "What will this service cost?", a: "Published rates plus sourced local prices — real numbers, clearly labelled.", to: "/pricing" },
  { icon: MapPin, q: "What are my local options?", a: "Verified providers, coverage status and alternatives in your city.", to: "/services" },
  { icon: Recycle, q: "Can this item be recycled?", a: "Ask the disposal advisor — municipal rules, cited sources.", to: "/recycling-assistant" },
  { icon: ShieldCheck, q: "Is a contractor available?", a: "Live coverage status, from verified partner territories only.", to: "/coverage" },
  { icon: HelpCircle, q: "Is professional pickup worth the cost?", a: "Compare published rates against the DIY trip — time, fees, disposal.", to: "/recycling-os#rex-discover" },
];

const SERVICE_OPTIONS = ["Junk removal", "Furniture removal", "Appliance removal", "Electronics recycling", "Moving cleanout", "Commercial cleanout"];

export default function RecyclingOsHome() {
  useSEO({
    title: "Junk Removal Across Canada | Same Day Recycling",
    description: "Explore junk removal, furniture and appliance services across Canada. Understand pricing, recycling options and live service activity — then book with confidence.",
    path: "/",
  });
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [service, setService] = useState(SERVICE_OPTIONS[0]);

  const runSearch = (e) => {
    e.preventDefault();
    const q = location.trim() ? `${service} in ${location.trim()}` : service;
    navigate(`/service-finder?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="bg-warm-white pb-20">
      <TopBar />
      <Navbar />
      <main>
        {/* Section 1 — Welcome */}
        <section className="bg-warm-white">
          <div className="max-w-3xl mx-auto px-4 pt-12 pb-10 text-center">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Know Your Options. Find Your Service.</h1>
            <p className="mt-4 text-lg text-slate-600">Explore local removal and recycling services, understand pricing, and discover service activity across Canada.</p>
            <form onSubmit={runSearch} className="mt-7 rounded-2xl bg-white border border-slate-200 p-3 shadow-sm flex flex-col sm:flex-row gap-2">
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or postal code" aria-label="City or postal code"
                className="flex-1 rounded-xl border border-slate-200 px-4 py-3 text-[#102B2A] placeholder:text-slate-400 focus:border-[#187B65] focus:outline-none focus:ring-2 focus:ring-[#187B65]/30" />
              <select value={service} onChange={(e) => setService(e.target.value)} aria-label="Service" className="rounded-xl border border-slate-200 px-3 py-3 font-semibold text-[#102B2A] bg-white">
                {SERVICE_OPTIONS.map((s) => <option key={s}>{s}</option>)}
              </select>
              <button type="submit" className="rounded-xl bg-amber-500 text-[#102B2A] font-bold px-6 py-3 hover:bg-amber-600 inline-flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> Find it
              </button>
            </form>
            <p className="mt-3 text-xs text-slate-400">Free to explore — no account needed. Coverage is confirmed before booking, never assumed.</p>
          </div>
        </section>

        {/* Section 2 — Recycling OS LIVE */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
            <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-[#187B65]/10 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-[#187B65] uppercase"><Network className="w-3.5 h-3.5" /> Recycling OS LIVE</span>
                <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-[#102B2A]">One Living View of Canada's Service Market</h2>
              </div>
              <Link to="/live" className="text-sm font-bold text-[#187B65] hover:underline inline-flex items-center gap-1.5">Full LIVE centre <ArrowRight className="w-4 h-4" /></Link>
            </div>
            <LiveRing />
            <div className="mt-4">
              <IntelligencePreview />
            </div>
          </div>
        </section>

        {/* Section 3 — Everyday Services */}
        <section className="bg-warm-white">
          <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-[#102B2A]">Everyday Services</h2>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {SERVICES.map((s) => (
                <Link key={s.title} to={s.to} className="group rounded-2xl bg-white border border-slate-200 p-5 hover:border-[#187B65] hover:shadow-md transition-all">
                  <span className="w-11 h-11 rounded-xl bg-[#187B65]/10 flex items-center justify-center group-hover:bg-[#187B65] transition-colors">
                    <s.icon className="w-5 h-5 text-[#187B65] group-hover:text-white transition-colors" />
                  </span>
                  <h3 className="mt-3 font-bold text-[#102B2A]">{s.title}</h3>
                  <p className="mt-1 text-sm text-slate-600">{s.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Section 4 — Consumer Intelligence */}
        <section className="bg-white">
          <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#187B65]/10 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-[#187B65] uppercase"><BadgeCheck className="w-3.5 h-3.5" /> Consumer intelligence</span>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight text-[#102B2A]">Answers Before You Book</h2>
            <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {QUESTIONS.map((c) => (
                <Link key={c.q} to={c.to} className="rounded-2xl bg-[#f4f7f5] border border-slate-200 p-5 hover:border-[#187B65] transition-colors flex flex-col">
                  <c.icon className="w-5 h-5 text-[#187B65]" />
                  <h3 className="mt-3 font-bold text-sm text-[#102B2A] leading-snug">{c.q}</h3>
                  <p className="mt-1.5 text-xs text-slate-600 flex-1">{c.a}</p>
                  <span className="mt-3 text-xs font-bold text-[#187B65]">Find out <span aria-hidden="true">→</span></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5 — Contractor Opportunities */}
        <section className="bg-[#102B2A] text-white">
          <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-emerald-300 uppercase"><HardHat className="w-3.5 h-3.5" /> For contractors</span>
            <h2 className="mt-3 text-2xl md:text-3xl font-bold tracking-tight">Run Your Business on Recycling OS</h2>
            <p className="mt-2 max-w-2xl text-emerald-100/80 text-sm">Operational intelligence, dispatch and customer tools — separate from the consumer booking experience. No guaranteed jobs or revenue are promised; you always see the data before you commit.</p>
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <Link to="/contractors" className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-emerald-400/50 transition-colors group">
                <Network className="w-6 h-6 text-emerald-300" />
                <h3 className="mt-3 text-lg font-bold">Join the contractor network</h3>
                <p className="mt-1.5 text-sm text-emerald-100/70">Verified coverage, dispatch activity, service-category demand and a partner dashboard with live job intelligence.</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-300 group-hover:underline">Explore network membership <ArrowRight className="w-4 h-4" /></span>
              </Link>
              <Link to="/software" className="rounded-2xl bg-white/5 border border-white/10 p-6 hover:border-emerald-400/50 transition-colors group">
                <MonitorSmartphone className="w-6 h-6 text-emerald-300" />
                <h3 className="mt-3 text-lg font-bold">Recycling OS software licence</h3>
                <p className="mt-1.5 text-sm text-emerald-100/70">The full operating system for haulers: bookings, dispatch, finance tracking and customer management under your own brand.</p>
                <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-300 group-hover:underline">See the software <ArrowRight className="w-4 h-4" /></span>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}