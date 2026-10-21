import ServiceLanding from "@/components/sdr/ServiceLanding";

const CONFIG = {
  slug: "commercial-recycling",
  name: "Commercial & Office Recycling",
  eyebrow: "Business solutions · Canada",
  h1: "Commercial recycling and office cleanouts, on your schedule",
  title: "Commercial & Office Recycling | Same Day Recycling",
  description: "Office furniture, e-waste, fit-out debris and recurring pickup programs for businesses in confirmed service areas across Canada — with diversion-rate certificates.",
  intro: "Move-outs, renovations and inventory clear-outs generate waste on a deadline. We haul office furniture, e-waste and debris same day, run recurring pickup programs, and issue a formal diversion-rate certificate with every completed commercial job.",
  items: ["Office furniture & desks", "E-waste & electronics", "Fit-out & renovation debris", "Warehouse & storage clearouts", "Recurring pickup programs", "Diversion-rate certificates"],
  steps: [
    { title: "Scope the job", text: "Call or book online with your items and timeline — we confirm coverage and pricing up front." },
    { title: "One-time or recurring", text: "Book a single haul or set a weekly/per-phase pickup rhythm that matches your project." },
    { title: "Get your certificate", text: "After the job, you receive a diversion-rate certificate showing how the load was sorted." },
  ],
  faqs: [
    { q: "Do you offer recurring commercial pickups?", a: "Yes — one-time hauls or recurring scheduled pickups (weekly or per phase) for contractors, offices and property managers." },
    { q: "What is a diversion-rate certificate?", a: "A formal document issued with every completed commercial job showing how much of your load was recycled or donated versus disposed." },
    { q: "Can you work around building management?", a: "Yes. For condo and office buildings we coordinate service elevators and paperwork with building management as needed." },
  ],
};

export default function CommercialRecycling() {
  return <ServiceLanding config={CONFIG} />;
}