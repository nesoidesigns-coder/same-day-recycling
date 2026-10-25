import { Link } from "react-router-dom";
import { ArrowRight, Compass, Radio, CalendarCheck, HardHat, Phone } from "lucide-react";
import { useSEO } from "@/lib/seo";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import PriceEstimator from "@/components/sdr/PriceEstimator";
import NationalServicePulse from "@/components/home/pulse/NationalServicePulse";
import OpportunityPulse from "@/components/home/pulse/OpportunityPulse";
import PulseSearch from "@/components/home/pulse/PulseSearch";

// Recycling OS — National Service Pulse homepage. Minimalist Canadian service
// intelligence: two coordinated gauges, one search field, five sections.
// Detailed analytics live on their dedicated pages (/adi, /demand, /live).

const EXPLORE_LINKS = [
  { icon: Compass, title: "Demand Observatory", desc: "Interactive, honestly-labelled Canadian demand data — sector by sector, province by province.", to: "/adi" },
  { icon: Radio, title: "Market Pulse", desc: "Trends and signals across the eight service markets the platform monitors.", to: "/demand" },
  { icon: Radio, title: "Live Centre", desc: "The full live intelligence terminal, filtered by geography and timeframe.", to: "/live" },
];

export default function LivingInfrastructureHome() {
  useSEO({
    title: "Canadian Service Pulse | Live Demand Intelligence & Instant Pickup Pricing | Same Day Recycling",
    description: "Two live gauges measure Canadian service demand across every monitored sector. One search finds your service, its pricing and verified local availability — then books it.",
    path: "/",
  });

  return (
    <div className="bg-white pb-20">
      <TopBar />
      <Navbar />

      {/* 1. National Service Pulse */}
      <section id="national-pulse" className="bg-brand-navy text-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-20">
          <div className="max-w-2xl mb-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-4 py-1.5 font-plex text-[11px] font-semibold text-[#2FD9C8]">
              <Radio className="w-3.5 h-3.5 animate-pulse motion-reduce:animate-none" /> LIVE SIGNAL ENGINE · CANADA
            </div>
            <h1 className="mt-5 text-[34px] md:text-[56px] font-bold leading-[1.06] tracking-tight text-white">
              One intelligent national pulse.
            </h1>
            <p className="mt-4 text-base md:text-lg text-white/65 max-w-xl">
              What Canadians need moved, removed and recycled — measured live, honestly labelled, and
              turned into an instant price for you.
            </p>
          </div>
          <NationalServicePulse />
        </div>
      </section>

      {/* 2. Explore Canadian Service Demand */}
      <main className="max-w-[1280px] mx-auto px-4 md:px-8">
        <section id="explore" className="py-12 md:py-20">
          <h2 className="text-[25px] md:text-[32px] font-semibold tracking-tight text-li-carbon">Explore Canadian service demand</h2>
          <p className="mt-1.5 text-sm md:text-base text-li-slate max-w-2xl">Deeper research lives on its own pages — the homepage stays focused on your decision.</p>
          <div className="mt-6 grid sm:grid-cols-3 gap-4">
            {EXPLORE_LINKS.map((l) => (
              <Link key={l.title} to={l.to} className="group rounded-[20px] border border-li-steel bg-white p-5 hover:border-li-infra transition-colors">
                <l.icon className="w-5 h-5 text-li-infra" />
                <h3 className="mt-3 text-base font-bold text-li-carbon">{l.title}</h3>
                <p className="mt-1 text-sm text-li-slate">{l.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-li-infra">Explore <ArrowRight className="w-3.5 h-3.5" /></span>
              </Link>
            ))}
          </div>
        </section>

        {/* 3. Find a Service */}
        <section id="find-service" className="py-12 md:py-20">
          <h2 className="text-[25px] md:text-[32px] font-semibold tracking-tight text-li-carbon">Find a service</h2>
          <p className="mt-1.5 text-sm md:text-base text-li-slate max-w-2xl mb-6">One question, instant answers: enter a service and location, or build a price directly below.</p>
          <PulseSearch />
          <div className="mt-10">
            <PriceEstimator />
          </div>
        </section>

        {/* 4. Live Discovery */}
        <section id="live-discovery" className="py-12 md:py-20">
          <div className="max-w-2xl mb-8">
            <h2 className="text-[25px] md:text-[32px] font-semibold tracking-tight text-li-carbon">Live discovery</h2>
            <p className="mt-1.5 text-sm md:text-base text-li-slate">
              The Opportunity Pulse tracks only actionable signals — real requests, inquiries and bookings.
              Pick a service to see where the activity is.
            </p>
          </div>
          <OpportunityPulse />
        </section>
      </main>

      {/* 5. Book a Pickup / Join the Network */}
      <section id="book" className="bg-brand-navy text-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-20">
          <h2 className="text-[25px] md:text-[32px] font-semibold tracking-tight text-white">Book a pickup. Or join the network.</h2>
          <p className="mt-2 max-w-2xl text-sm md:text-base text-white/65">
            Book before noon and same-day pickup may be available, subject to contractor confirmation.
            Contractors: run your territory on the same intelligence.
          </p>
          <div className="mt-7 grid gap-4 sm:grid-cols-2 max-w-3xl">
            <Link to="/request-service" className="rounded-[20px] bg-[#2FD9C8] text-brand-navy p-6 hover:bg-white transition-colors group">
              <CalendarCheck className="w-6 h-6" />
              <h3 className="mt-3 text-lg font-bold">Book a pickup</h3>
              <p className="mt-1 text-sm text-brand-navy/70">Get a quote and a confirmed time — no registration needed.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold">Start now <ArrowRight className="w-4 h-4" /></span>
            </Link>
            <Link to="/contractors" className="rounded-[20px] border border-white/15 bg-white/[0.06] p-6 hover:border-[#2FD9C8] transition-colors group">
              <HardHat className="w-6 h-6 text-[#2FD9C8]" />
              <h3 className="mt-3 text-lg font-bold">Join the network</h3>
              <p className="mt-1 text-sm text-white/60">Territory intelligence, dispatch and customer tools for contractors.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#2FD9C8]">Partner up <ArrowRight className="w-4 h-4" /></span>
            </Link>
          </div>
          <a href="tel:+16048491745" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors">
            <Phone className="w-4 h-4" /> (604) 849-1745 · online requests 24/7
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}