import ServiceLanding from "@/components/sdr/ServiceLanding";

const CONFIG = {
  slug: "electronics-recycling",
  name: "Electronics Recycling",
  eyebrow: "E-waste · Canada",
  h1: "Electronics recycling for homes and offices",
  title: "Electronics Recycling & E-Waste Pickup | Same Day Recycling",
  description: "TVs, computers, printers and office e-waste collected in confirmed service areas across Canada and sent to certified recycling — upfront pricing, instant quotes.",
  intro: "Old electronics contain both valuable metals and materials that shouldn't reach a landfill. We collect your e-waste, sort it and route it to dedicated electronics recycling rather than the dump.",
  items: ["TVs & monitors", "Computers & laptops", "Printers & scanners", "Phones & tablets", "Audio & AV equipment", "Cables & accessories"],
  steps: [
    { title: "Get a quote", text: "List your e-waste online or send a photo — pricing is by truck space, starting at $139." },
    { title: "Book your slot", text: "Pick a date and time window. Book before noon and same-day pickup is usually available." },
    { title: "We sort and recycle", text: "Electronics are separated from the rest of your load and routed to dedicated e-waste recyclers." },
  ],
  faqs: [
    { q: "What electronics do you take?", a: "TVs, monitors, computers, laptops, printers, phones, AV equipment, cables and most office e-waste. If you're unsure, just ask." },
    { q: "Is my data safe?", a: "We recommend wiping devices before pickup. Devices we collect are routed to electronics recyclers — please remove storage media or wipe drives first for sensitive data." },
    { q: "Can offices book bulk e-waste pickups?", a: "Yes — office and commercial cleanouts are a core service, and commercial clients receive a diversion-rate certificate with every completed job." },
  ],
};

export default function ElectronicsRecycling() {
  return <ServiceLanding config={CONFIG} />;
}