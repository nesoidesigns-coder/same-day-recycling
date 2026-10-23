import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight } from "lucide-react";

// Granular service-keyword content for city pages. Each block carries its own
// H2 targeting long-tail queries ("couch removal [city]", "furniture disposal
// [city]") that the generic "junk removal" headings don't capture.
const SERVICE_BLOCKS = (city) => [
  {
    h2: `Couch Removal in ${city}`,
    p: `Sofas, loveseats, sectionals, futons and hide-a-beds go out with the crew — no driveway staging required. We lift it from wherever it sits, and every couch in reusable condition goes to a donation partner before recycling is even considered.`,
    keywords: ["sofa & sectional pickup", "hide-a-bed removal", "donation-first handling"],
  },
  {
    h2: `Furniture Disposal in ${city}`,
    p: `Dressers, bed frames, dining sets, office desks and chairs — any volume, any floor. Mixed furniture loads are sorted at the depot: wood, metal and textiles are separated for recycling, and only the true remainder is responsibly disposed.`,
    keywords: ["dresser & bed frame pickup", "office furniture removal", "full-load sorting"],
  },
  {
    h2: `Mattress & Appliance Disposal in ${city}`,
    p: `Mattresses, box springs, fridges, stoves, washers and dryers are all accepted. Appliances are recycled as scrap metal, and mattress materials are separated rather than landfilled. Upfront pricing applies to every item.`,
    keywords: ["mattress pickup", "fridge & stove disposal", "scrap-metal recycling"],
  },
  {
    h2: `Electronics & E-Waste Pickup in ${city}`,
    p: `TVs, computers, monitors, printers and small electronics are routed to certified e-waste processors. Nothing with a circuit board goes to landfill — that's the standard on every ${city} load.`,
    keywords: ["TV & computer recycling", "certified e-waste routing"],
  },
];

export default function CityGranularServices({ city }) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-14">
      <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Popular removal services</div>
      <p className="mt-3 text-slate-600 max-w-2xl">
        Every job is quoted, approved by you, and sorted after pickup — whether it's one couch or a whole house.
      </p>
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {SERVICE_BLOCKS(city).map((b) => (
          <div key={b.h2} className="rounded-2xl border border-slate-100 bg-white p-6">
            <h2 className="text-xl font-bold tracking-tight text-[#102B2A]">{b.h2}</h2>
            <p className="mt-2.5 text-sm text-slate-600">{b.p}</p>
            <ul className="mt-3 space-y-1.5">
              {b.keywords.map((k) => (
                <li key={k} className="flex items-center gap-2 text-sm font-semibold text-[#102B2A]">
                  <CheckCircle2 className="w-4 h-4 text-[#187B65] shrink-0" /> {k}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/furniture-removal" className="inline-flex items-center gap-2 text-sm font-bold text-[#187B65] hover:underline">
          Furniture removal details <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/appliance-removal" className="inline-flex items-center gap-2 text-sm font-bold text-[#187B65] hover:underline">
          Appliance pickup details <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/electronics-recycling" className="inline-flex items-center gap-2 text-sm font-bold text-[#187B65] hover:underline">
          Electronics recycling details <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}