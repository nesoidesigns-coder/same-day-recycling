import { useState } from "react";
import { useSEO } from "@/lib/seo";
import { ClipboardList, Sparkles, Calculator, Handshake, CalendarCheck } from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import NationalRequestForm from "@/components/sdr/NationalRequestForm";
import RequestIntake from "@/components/ri/RequestIntake";
import LocalIntelligencePanel from "@/components/ri/LocalIntelligencePanel";
import useCoverageStatus from "@/hooks/useCoverageStatus";

const JOURNEY = [
  { icon: ClipboardList, title: "Describe", text: "Tell us what needs to go, in your own words — or pick a category." },
  { icon: Sparkles, title: "Understand", text: "We recognize your items and estimate the load size." },
  { icon: Calculator, title: "Estimate", text: "You see an indicative range up front — never a surprise." },
  { icon: Handshake, title: "Match", text: "Your request is routed to verified local providers." },
  { icon: CalendarCheck, title: "Book", text: "A provider confirms availability, price and arrival window." },
];

export default function RequestService() {
  useSEO({
    title: "Request Recycling or Junk Removal Anywhere in Canada | Same Day Recycling",
    description: "Request recycling, junk removal and material pickup services in any Canadian province or territory. Our platform connects you with local service providers as availability is confirmed.",
    path: "/request-service",
  });

  const params = new URLSearchParams(window.location.search);
  const [city] = useState((params.get("city") || "").slice(0, 120));
  const [handoff, setHandoff] = useState({});
  const [estimate, setEstimate] = useState(null);
  const coverage = useCoverageStatus();

  return (
    <div className="bg-ri-ivory min-h-screen">
      <Navbar />

      {/* Compact, service-first hero — the request interface starts here */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-6 md:pt-12">
        <div className="font-plex text-[11px] font-semibold tracking-[0.18em] text-ri-emerald uppercase">National service network</div>
        <h1 className="mt-2 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] text-ri-charcoal">
          A smarter way to clear your space.
        </h1>
        <p className="mt-3 text-base md:text-lg text-ri-slate max-w-2xl">
          Tell us what you need removed. Explore pricing, local options, and pickup availability in one place.
        </p>
      </section>

      {/* Intake + contextual intelligence, side by side on desktop */}
      <section className="max-w-6xl mx-auto px-4 pb-12 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <RequestIntake
            city={city}
            onServiceType={(service_type) => setHandoff((h) => ({ ...h, service_type }))}
            onFill={(items_description) => setHandoff((h) => ({ ...h, items_description }))}
            onEstimate={setEstimate}
          />
          <NationalRequestForm handoff={handoff} />
        </div>
        <div className="lg:sticky lg:top-20">
          <LocalIntelligencePanel
            city={city}
            coverage={coverage}
            estimate={estimate}
            serviceType={handoff.service_type}
          />
        </div>
      </section>

      {/* The customer journey */}
      <section className="bg-white border-t border-si-line">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="text-2xl md:text-3xl font-bold text-ri-charcoal text-center">From describe to booked, in five steps</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {JOURNEY.map((s, i) => (
              <div key={s.title} className="relative rounded-2xl bg-ri-ivory border border-si-line p-5">
                <div className="flex items-center justify-between">
                  <span className="w-10 h-10 rounded-xl bg-ri-forest text-ri-mint flex items-center justify-center">
                    <s.icon className="w-5 h-5" />
                  </span>
                  <span className="font-plex text-xs font-bold text-ri-slate/50">0{i + 1}</span>
                </div>
                <div className="mt-4 font-bold text-ri-charcoal">{s.title}</div>
                <p className="mt-1.5 text-sm text-ri-slate">{s.text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-ri-slate max-w-xl mx-auto">
            Request junk removal anywhere in Canada. Same-day service is subject to confirmed local
            provider availability. A verified service territory is not a confirmed appointment: a local
            contractor must accept your specific job, with your price and arrival window agreed first.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}