import ServiceLanding from "@/components/sdr/ServiceLanding";

const CONFIG = {
  slug: "same-day-pickup",
  name: "Same-Day Pickup",
  eyebrow: "Same-day service · Canada",
  h1: "Book before noon — picked up the same afternoon",
  title: "Same-Day Junk & Furniture Pickup | Same Day Recycling",
  description: "Same-day junk, furniture and appliance pickup in confirmed service areas across Canada. Book before noon for same-afternoon service, with upfront pricing approved before loading.",
  intro: "When junk has to go today, the cutoff matters: bookings made before noon usually get a crew the same afternoon. Later bookings are scheduled for the next available slot. Every price is approved by you before anything is lifted.",
  items: ["Book before noon → same afternoon", "Curbside Discount: $25 off, no need to be home", "Upfront pricing from $139", "Price approved before we lift anything", "Every load sorted for recycling & donation", "Recycling Impact Report for your records"],
  steps: [
    { title: "Check the clock", text: "Before noon Vancouver time? Same-day pickup is usually on. After that, we book the next available slot." },
    { title: "Quote and book", text: "Get an instant quote online or by phone, then lock in your time window — it takes minutes." },
    { title: "Crew arrives", text: "We call or text your arrival window, do all the lifting, and email your Recycling Impact Report after." },
  ],
  faqs: [
    { q: "How does same-day pickup work?", a: "Book before noon and a crew usually reaches you the same afternoon. Bookings after noon are typically scheduled for the next available slot." },
    { q: "Is same-day service available in my city?", a: "We only advertise same-day service where a verified partner is confirmed. Availability is checked for your address before you book — see the coverage page for the current list." },
    { q: "Do I need to be home for the pickup?", a: "No. Stage items curbside in your driveway, lane or garage front, take $25 off, and we text you the arrival window." },
  ],
};

export default function SameDayPickup() {
  return <ServiceLanding config={CONFIG} />;
}