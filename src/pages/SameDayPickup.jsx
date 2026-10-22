import ServiceLanding from "@/components/sdr/ServiceLanding";

const CONFIG = {
  slug: "same-day-pickup",
  name: "Same-Day Pickup",
  eyebrow: "Same-day service · Canada",
  h1: "Request a same-day pickup — confirmed one job at a time",
  title: "Same-Day Junk & Furniture Pickup | Same Day Recycling",
  description: "Request same-day junk, furniture or appliance pickup across Canada. Local capacity, contractor acceptance, your approved price and arrival window must be confirmed first.",
  intro: "Tell us what needs to go, your address and preferred time. Requesting before noon does not guarantee a same-day slot: dispatch checks local capacity and obtains a qualified contractor's acceptance before confirming your appointment. You approve the price before work begins.",
  items: ["Request a same-day window; contractor acceptance required", "Curbside Discount: $25 off, no need to be home", "Upfront pricing from $139", "Price approved before we lift anything", "Every load sorted for recycling & donation", "Recycling Impact Report for your records"],
  steps: [
    { title: "Request a window", text: "Share your address and preferred date. Requests are open nationwide, but local availability is checked for each job." },
    { title: "Approve and confirm", text: "Get an estimate, approve the final scope and price, and receive an appointment only after a qualified contractor accepts your job and arrival window." },
    { title: "Crew arrives", text: "We call or text your arrival window, do all the lifting, and email your Recycling Impact Report after." },
  ],
  faqs: [
    { q: "How does same-day pickup work?", a: "Request your preferred date and time. Dispatch checks local capacity and obtains a qualified contractor's acceptance; your approved price and arrival window must be agreed before the pickup is confirmed. Submitting before noon does not guarantee same-day service." },
    { q: "Is same-day service available in my city?", a: "See the coverage page for verified provider and matching statuses. Provider Available means a verified provider serves a city, not that they have accepted your job or have capacity today. Same-day service is confirmed only for your specific accepted appointment." },
    { q: "Do I need to be home for the pickup?", a: "No. Stage items curbside in your driveway, lane or garage front, take $25 off, and we text you the arrival window." },
  ],
};

export default function SameDayPickup() {
  return <ServiceLanding config={CONFIG} />;
}