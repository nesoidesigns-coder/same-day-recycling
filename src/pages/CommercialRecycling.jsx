import ServiceLanding from "@/components/sdr/ServiceLanding";

const CONFIG = {
  slug: "commercial-recycling",
  name: "Commercial & Office Recycling",
  eyebrow: "Business solutions · Canada",
  h1: "Commercial recycling and office cleanouts, on your schedule",
  title: "Commercial Junk Removal & Waste Management | Same Day Recycling",
  description: "Commercial junk removal and waste management for Canadian businesses. Office furniture, e-waste and recurring pickup programs with a diversion record for every completed job.",
  intro: "Move-outs, renovations and inventory clear-outs generate waste on a deadline. We haul office furniture, e-waste and debris, run recurring pickup programs, and issue a formal diversion record with every completed commercial job, showing how your load was sorted.",
  items: ["Office furniture & desks", "E-waste & electronics", "Fit-out & renovation debris", "Warehouse & storage clearouts", "Recurring pickup programs", "Diversion records for every job"],
  steps: [
    { title: "Scope the job", text: "Call or book online with your items and timeline — we confirm coverage and pricing up front." },
    { title: "One-time or recurring", text: "Book a single haul or set a weekly/per-phase pickup rhythm that matches your project." },
    { title: "Get your diversion record", text: "After the job, you receive a formal record showing how your load was sorted — donated, recycled, e-waste or disposed — generated from your actual load." },
  ],
  faqs: [
    { q: "Do you offer recurring commercial pickups?", a: "Yes — one-time hauls or recurring scheduled pickups (weekly or per phase) for contractors, offices and property managers." },
    { q: "What is a diversion record?", a: "A formal document issued with every completed commercial job showing how your load was sorted — donated, recycled, e-waste or responsibly disposed. It is generated from your actual load, not a fixed percentage." },
    { q: "Can you work around building management?", a: "Yes. For condo and office buildings we coordinate service elevators and paperwork with building management as needed." },
  ],
};

export default function CommercialRecycling() {
  return <ServiceLanding config={CONFIG} />;
}