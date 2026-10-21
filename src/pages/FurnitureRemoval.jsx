import ServiceLanding from "@/components/sdr/ServiceLanding";

const CONFIG = {
  slug: "furniture-removal",
  name: "Furniture Removal & Recycling",
  eyebrow: "Residential recycling · Canada",
  h1: "Furniture removal and recycling, done the responsible way",
  title: "Furniture Removal & Recycling | Same Day Recycling",
  description: "Sofas, mattresses, dressers and more picked up in confirmed service areas across Canada. Upfront pricing, donation and recycling first — get an instant quote.",
  intro: "Old furniture is heavy, awkward and rarely landfill-bound material. Our crews lift everything out of any room, then sort each load — reusable pieces to donation partners, metal frames and springs to recyclers.",
  items: ["Sofas & couches", "Mattresses & box springs", "Tables & chairs", "Dressers & wardrobes", "Office & desk furniture", "Hot tubs & patio sets"],
  steps: [
    { title: "Get a quote", text: "List your pieces online or send a photo — pricing is by truck space, starting at $139." },
    { title: "Book your slot", text: "Pick a date and time window. Book before noon and same-day pickup is usually available." },
    { title: "We lift it all", text: "The crew removes items from any room, then sorts the load for donation and recycling." },
  ],
  faqs: [
    { q: "Do you take mattresses and box springs?", a: "Yes. Mattresses and box springs go out with the crew, and the metal springs are recycled rather than landfilled." },
    { q: "How much does furniture removal cost?", a: "Pricing is based on the truck space your items take, from a $139 minimum pickup to a full truck. The price we quote is the price you pay." },
    { q: "Do I need to be home?", a: "Not for curbside pickup. Stage items in your driveway, lane or garage front and take $25 off with our Curbside Discount." },
  ],
};

export default function FurnitureRemoval() {
  return <ServiceLanding config={CONFIG} />;
}