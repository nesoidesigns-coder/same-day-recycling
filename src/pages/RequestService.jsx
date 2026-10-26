import { useState } from "react";
import { useSEO } from "@/lib/seo";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import NationalRequestForm from "@/components/sdr/NationalRequestForm";
import RequestIntake from "@/components/ri/RequestIntake";
import JourneyProgress from "@/components/ri/JourneyProgress";
import LocalIntelligencePanel from "@/components/ri/LocalIntelligencePanel";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { useIntelligence } from "@/lib/intelligenceContext";

export default function RequestService() {
  useSEO({
    title: "Request Recycling or Junk Removal Anywhere in Canada | Same Day Recycling",
    description: "Request recycling, junk removal and material pickup services in any Canadian province or territory. Our platform connects you with local service providers as availability is confirmed.",
    path: "/request-service",
  });

  const params = new URLSearchParams(window.location.search);
  // Shared intelligence state: a city or service selected on the homepage or
  // in Live Intelligence opens the request flow already filled (never asked
  // again unless the customer needs to correct it). URL params win.
  const intel = useIntelligence();
  const [city] = useState(((params.get("city") || "").slice(0, 120)) || intel.selection.city || "");
  const [handoff, setHandoff] = useState(intel.selection.service ? { service_type: intel.selection.service } : {});
  const [estimate, setEstimate] = useState(null);
  const [formSnapshot, setFormSnapshot] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const coverage = useCoverageStatus();

  // Live journey state — a step is reached when its outcome exists anywhere
  // on the page (smart intake or the request form itself). The progress track
  // counts a step complete when it or any later step is reached.
  const reached = [
    Boolean(handoff.service_type || handoff.items_description || formSnapshot.items_description),
    Boolean(estimate),
    Boolean(handoff.items_description || formSnapshot.items_description),
    Boolean(String(formSnapshot.city || "").trim()),
    submitted,
  ];

  return (
    <div className="bg-ri-ivory min-h-screen">
      <Navbar />

      {/* Compact, service-first hero — the request interface starts here */}
      <section className="max-w-6xl mx-auto px-4 pt-8 pb-4 md:pt-12">
        <div className="font-plex text-[11px] font-semibold tracking-[0.18em] text-ri-emerald uppercase">National service network</div>
        <h1 className="mt-2 text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] text-ri-charcoal">
          A smarter way to clear your space.
        </h1>
        <p className="mt-3 text-base md:text-lg text-ri-slate max-w-2xl">
          Tell us what you need removed. Explore pricing, local options, and pickup availability in one place.
        </p>
      </section>

      {/* Live journey progress — Describe → Understand → Estimate → Locate → Confirm */}
      <section className="max-w-6xl mx-auto px-4 pb-5 md:pb-7">
        <JourneyProgress reached={reached} />
      </section>

      {/* Intake + contextual intelligence, side by side on desktop */}
      <section className="max-w-6xl mx-auto px-4 pb-12 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          <div id="ri-intake" className="scroll-mt-24">
          <RequestIntake
            city={city}
            onServiceType={(service_type) => setHandoff((h) => ({ ...h, service_type }))}
            onFill={(items_description) => setHandoff((h) => ({ ...h, items_description }))}
            onEstimate={setEstimate}
          />
          </div>
          <div id="request-form" className="scroll-mt-24">
          <NationalRequestForm
            handoff={handoff}
            estimate={estimate}
            onProgress={setFormSnapshot}
            onSubmitted={() => setSubmitted(true)}
          />
          </div>
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

      {/* Honest expectations — kept from the original journey section */}
      <section className="max-w-6xl mx-auto px-4 pb-12">
        <p className="text-sm text-ri-slate max-w-2xl">
          Request junk removal anywhere in Canada. Same-day service is subject to confirmed local
          provider availability. A verified service territory is not a confirmed appointment: a local
          contractor must accept your specific job, with your price and arrival window agreed first.
        </p>
      </section>

      <Footer />
    </div>
  );
}