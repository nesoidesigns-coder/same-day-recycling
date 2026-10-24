import ServiceLanding from "@/components/sdr/ServiceLanding";

const CONFIG = {
  slug: "furniture-removal",
  gallery_service: "furniture-removal",
  name: "Furniture Removal & Recycling",
  eyebrow: "Residential recycling · Canada",
  h1: "Furniture removal and recycling, done the responsible way",
  title: "Furniture Removal & Recycling | Same Day Recycling",
  description: "Sofas, mattresses, dressers and more picked up in confirmed service areas across Canada. Upfront pricing, donation and recycling first — get an instant quote.",
  intro: "Old furniture is heavy, awkward and rarely landfill-bound material. Our crews lift everything out of any room, then sort each load — reusable pieces to donation partners, metal frames and springs to recyclers.",
  items: ["Sofas & couches", "Mattresses & box springs", "Tables & chairs", "Dressers & wardrobes", "Office & desk furniture", "Hot tubs & patio sets", "Sectionals & loveseats", "Bedroom sets & nightstands", "Dining sets & bar stools", "Bookshelves & cabinets", "Recliners & futons", "Exercise equipment"],
  steps: [
    { title: "Get a quote", text: "List your pieces online or send a photo — pricing is by truck space, starting at $139." },
    { title: "Request a slot", text: "Tell us your preferred date and time. Your appointment is confirmed only after a qualified contractor accepts the job and you approve the price." },
    { title: "We lift it all", text: "The crew removes items from any room, then sorts the load for donation and recycling." },
  ],
  deep: [
    {
      heading: "Sofa and couch removal",
      paragraphs: [
        "A couch is the single most common piece we pick up, and the hardest to move alone: too wide for most doorways, too heavy for one person, and no municipal truck will take it on regular collection day. Our crew carries sectionals, sofa beds, loveseats and recliners down from any floor, through hallways, around corners and down elevators — you don't dismantle or drag anything to the curb first.",
        "Where a sofa still has life in it, we route it to donation partners before anything else. Worn-out frames and metal mechanisms get broken down for recycling. If your couch is already staged outside, the Curbside Discount takes $25 off and you don't need to be home for the pickup.",
      ],
    },
    {
      heading: "Mattress and box spring disposal",
      paragraphs: [
        "Mattresses and box springs are accepted on every pickup, from a single bed to a whole household's worth. The steel springs inside are pulled out and recycled as metal, and clean mattresses in good condition are offered to donation partners first — a far better outcome than the landfill most municipal programs leave them with.",
        "Many cities require a bulky-item sticker or a special booking to take even one mattress; with us, a single mattress fits a normal minimum pickup. If you're clearing a whole bedroom, the bed, nightstand, dresser and boxes go out in the same visit at no extra per-item charge — you pay by truck space, not by piece.",
      ],
    },
    {
      heading: "Furniture removal pricing: what it costs",
      paragraphs: [
        "Furniture is priced by how much truck space your load takes, so a few pieces cost a fraction of a full clear-out. You approve the final price on arrival, before anything is lifted, and there are no per-item add-ons or fuel surcharges after that. If the load takes less space than estimated, you pay less — never more.",
      ],
      tiers: [
        { label: "Minimum pickup", price: "from $139", detail: "A single mattress, one sofa, or a nightstand plus a few bags." },
        { label: "1/4 truck", price: "from $269", detail: "A sofa and love seat, or a bedroom set's worth of pieces." },
        { label: "Full truck", price: "from $649", detail: "A whole-home or office furniture clear-out in one visit." },
      ],
    },
    {
      heading: "Where your furniture goes: donation and recycling first",
      paragraphs: [
        "Every furniture load is sorted the same way: pieces in reusable condition go to donation partners, metal frames, springs and hardware go to metal recyclers, and clean wood from solid furniture is recycled. Only true residual material is landfilled.",
        "After the pickup you can request a Recycling Impact Report — a receipt that shows how your load was sorted. Estate clearances and property handovers often use it as documentation of responsible disposal.",
      ],
      bullets: [
        "Reusable furniture routed to donation partners first, before any disposal decision",
        "Metal springs, frames and hardware recycled, including mattress springs",
        "Recycling Impact Report available for every completed pickup",
      ],
    },
    {
      heading: "Hot tub and patio furniture removal",
      paragraphs: [
        "Bulky outdoor pieces — hot tubs, patio sets, pergolas, gazebos, shed contents — are heavier and more awkward than indoor furniture, so a photo gets you the sharpest quote before booking. The crew handles the tear-out and lifting, including hauling an old hot tub off the deck.",
        "Hot tub shells and patio sets contain recyclable metal and plastic that we sort out after pickup rather than sending the whole unit to landfill.",
      ],
    },
    {
      heading: "Office and commercial furniture removal",
      paragraphs: [
        "Desks, chairs, shelving, cubicle walls and reception furniture go out on a scheduled pickup that works around your business hours. Offices, retail fit-outs, property managers and co-working spaces use one-off clearances or recurring service as layouts change.",
        "Commercial clients receive a formal diversion-rate certificate with every completed job — useful for municipal reporting and green-building scorecards.",
      ],
    },
    {
      heading: "Single-item furniture removal",
      paragraphs: [
        "You don't need a full clear-out to book. One couch, one mattress, one dresser or a single appliance is the most common furniture pickup — and it prices at the minimum truck rate, not a full load. That makes single-item removal the cheapest responsible option when a piece is too heavy or awkward for a curb-side collection day, or your municipality won't take upholstered items at all.",
        "A single couch pickup works the same way as any other job: the crew carries the piece out of the room it's in — down stairs, through elevators, around tight corners — and the final price is approved with you on arrival before anything is lifted. If the item is already staged at the curb or in the garage, the Curbside Discount takes $25 off and you don't need to be home.",
      ],
    },
    {
      heading: "Areas we serve",
      paragraphs: [
        "Furniture removal requests are open across Canada. Each city page carries local pricing, pickup rules and booking, and the dedicated furniture removal service details above apply on every job. A listed city is not a confirmed crew or same-day slot: dispatch must match a qualified contractor, obtain their acceptance and agree your price and arrival window before confirming the appointment.",
      ],
      links: [
        { label: "Furniture removal in Vancouver", to: "/junk-removal-vancouver" },
        { label: "Junk removal in Burnaby", to: "/junk-removal-burnaby" },
        { label: "Junk removal in Surrey", to: "/junk-removal-surrey" },
        { label: "Junk removal in Richmond", to: "/junk-removal-richmond" },
        { label: "Junk removal in Coquitlam", to: "/junk-removal-coquitlam" },
      ],
    },
  ],
  faqs: [
    { q: "Do you take mattresses and box springs?", a: "Yes. Mattresses and box springs go out with the crew, and the metal springs are recycled rather than landfilled. A single mattress fits a normal minimum pickup." },
    { q: "How much does furniture removal cost?", a: "Pricing is based on the truck space your items take, from a $139 minimum pickup to a full truck at the national standard rate — your quote always shows your city's exact rates. You approve the final price before anything is lifted." },
    { q: "Do I need to be home?", a: "Not for curbside pickup. Stage items in your driveway, lane or garage front and take $25 off with our Curbside Discount." },
    { q: "Can you take furniture from upstairs or an apartment?", a: "Yes. The crew carries items from any floor, including stairs, elevators and tight corners. For condo and strata buildings we coordinate elevator bookings with building management." },
    { q: "Do you disassemble furniture for removal?", a: "Where a piece needs it, the crew handles the disassembly as part of the pickup. You don't need to dismantle anything beforehand." },
    { q: "Can you remove just one item?", a: "Yes — single-item pickup is the most common booking. A couch, mattress, dresser or appliance prices at the minimum truck rate, and you approve the exact price before the crew lifts anything." },
    { q: "How fast can a single couch be picked up?", a: "You can request a same-day or next-day window when you book. It is confirmed only after a qualified contractor accepts your specific job — a city page listing never guarantees a slot." },
    { q: "What happens to my old furniture?", a: "Every load is sorted: reusable pieces go to donation partners, metal frames and mattress springs are recycled, and only residual material is landfilled. You can request a Recycling Impact Report for the record." },
    { q: "Can I get same-day furniture pickup?", a: "You can request same-day furniture pickup. It is not guaranteed by a city listing or the time you submit: a qualified contractor must accept your specific job and confirm the arrival window first." },
    { q: "Do you remove hot tubs?", a: "Yes. Hot tubs and other bulky outdoor items are quoted from a photo to price them accurately — send one in the quote tool and we'll book the pickup." },
  ],
};

export default function FurnitureRemoval() {
  return <ServiceLanding config={CONFIG} />;
}