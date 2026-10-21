import ServiceLanding from "@/components/sdr/ServiceLanding";

const CONFIG = {
  slug: "appliance-removal",
  name: "Appliance Removal & Recycling",
  eyebrow: "Residential recycling · Canada",
  h1: "Appliance removal with proper metal and refrigerant handling",
  title: "Appliance Removal & Recycling | Same Day Recycling",
  description: "Fridges, washers, stoves and more removed in confirmed service areas across Canada. Appliances recycled as scrap metal — upfront pricing and instant quotes.",
  intro: "Appliances are mostly metal, which makes them valuable recyclables — but fridges and freezers need proper handling. Our crews disconnect, carry and haul them, and every appliance goes to metal recycling.",
  items: ["Fridges & freezers", "Washers & dryers", "Stoves & ovens", "Dishwashers & microwaves", "Water heaters & furnaces", "Small appliances"],
  steps: [
    { title: "Get a quote", text: "Tell us what appliances you're replacing — pricing is by truck space, starting at $139." },
    { title: "Book your slot", text: "Pick a date and time window. Book before noon and same-day pickup is usually available." },
    { title: "We haul and recycle", text: "The crew carries appliances out of any room — most of their weight becomes recycled scrap metal." },
  ],
  faqs: [
    { q: "Do you take fridges and freezers?", a: "Yes. Fridges, freezers and other appliances are picked up by the crew and sent to metal recycling." },
    { q: "Is there a charge for appliance pickup?", a: "Appliance pickup follows our standard truck-space pricing, starting at $139. Free pickup applies to certain scrap metal items where a network partner is live — just ask." },
    { q: "Can you remove appliances from the basement?", a: "Yes. The crew does all the lifting, from any floor — you don't need to move anything yourself." },
  ],
};

export default function ApplianceRemoval() {
  return <ServiceLanding config={CONFIG} />;
}