import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, MapPin } from "lucide-react";

// Vancouver-only long-tail furniture/removal content. Rendered on the
// Vancouver city page (below the granular service blocks) to capture
// specific queries — "same day furniture removal vancouver", "sofa
// removal vancouver bc", "condo furniture removal vancouver" — that the
// generic junk-removal headings don't answer directly.
const BLOCKS = [
  {
    h2: "Same Day Furniture Removal in Vancouver BC",
    p: "When you search for same day furniture removal in Vancouver, you usually have a mover coming, a move-out inspection tomorrow, or a new sofa arriving at the door. Book before noon and a verified Vancouver contractor can confirm an afternoon window for old furniture pickup — one piece or a whole home. Your price is approved before a single item is lifted, and the load is sorted for donation and recycling after pickup.",
    keywords: ["same day furniture pickup vancouver", "old sofa removal vancouver", "book before noon furniture pickup"],
  },
  {
    h2: "Furniture Removal for Vancouver Condos, Apartments & Walk-ups",
    p: "Vancouver living means elevators with reserved moving slots, parkade clearance limits, third-floor walk-ups in Kitsilano, and narrow stairwells in heritage buildings on Commercial Drive. Crews handle mattress disposal through tight stairwells, sectional sofas disassembled to fit a Yaletown high-rise elevator, and strata loading-dock rules in South Granville — including carry-out protection for hallways and elevator pads.",
    keywords: ["condo furniture removal vancouver", "apartment junk removal vancouver", "walk-up & stairwell carry-out", "mattress disposal vancouver"],
  },
  {
    h2: "Office Furniture Removal in Downtown Vancouver & Mount Pleasant",
    p: "Office furniture removal in downtown Vancouver and Mount Pleasant commercial spaces: desks, task chairs, boardroom tables, filing cabinets and cubicle walls, cleared outside business hours so your lease handover or renovation doesn't stall. Metal-framed furniture goes to scrap recyclers, reusable chairs and desks go to local donation programs, and e-waste like monitors and printers is routed to certified processors.",
    keywords: ["office furniture disposal downtown vancouver", "desk & cubicle removal vancouver", "business closure cleanout vancouver"],
  },
  {
    h2: "Moving-Out & Estate Furniture Cleanouts in Vancouver",
    p: "End-of-tenancy cleanouts and estate furniture removal in Vancouver come with deadlines — possession dates, estate sales, property-viewing schedules. A full-home furniture cleanout covers dressers, bed frames, dining sets, bookshelves and garage leftovers in one visit, sorted on-site: keep, donate, recycle, dispose. Landlords and strata managers across East Vancouver and Fairview use the same flat, approved pricing for turnover cleanups.",
    keywords: ["estate furniture cleanout vancouver", "moving out furniture disposal vancouver", "full-home cleanout vancouver"],
  },
  {
    h2: "Furniture Donation Pickup in Vancouver — Reuse Before Recycling",
    p: "Furniture donation pickup in Vancouver comes first: couches, dining tables and dressers in reusable condition are offered to local donation programs before recycling is considered, and you see the diversion result on your Recycling Impact Report. Items that can't be donated — water-damaged upholstery, broken frames, torn mattresses — are separated for metal, wood and textile recycling instead of one trip to landfill.",
    keywords: ["furniture donation pickup vancouver", "couch donation vancouver bc", "eco-friendly furniture disposal vancouver"],
  },
  {
    h2: "Sofa, Sectional & Recliner Pickup Across Vancouver Neighbourhoods",
    p: "Single-item pickup is the most requested Vancouver job: a sofa leaving a basement suite in Renfrew-Collingwood, a recliner heading out of a Fairview apartment, a futon from a student rental near UBC. One-piece removal keeps the price at the minimum pickup rate, and neighbourhood coverage runs from Dunbar and Point Grey through Mount Pleasant, Hastings-Sunrise and Victoria Drive.",
    keywords: ["sofa removal vancouver", "recliner pickup vancouver", "single item furniture removal vancouver"],
  },
];

const AREAS = [
  "Kitsilano", "Mount Pleasant", "East Vancouver", "Yaletown", "West End",
  "Commercial Drive", "Fairview", "Dunbar", "Point Grey", "Renfrew-Collingwood",
  "South Granville", "Hastings-Sunrise", "Shaughnessy", "Kensington-Cedar Cottage",
];

const FAQS = [
  {
    q: "How fast can you pick up a couch in Vancouver?",
    a: "Same-day couch removal in Vancouver is offered when a verified local contractor confirms your window — book before noon for the best chance of an afternoon slot. Your price and arrival window are always approved before anything is lifted.",
  },
  {
    q: "Do you remove furniture from Vancouver condos and apartments?",
    a: "Yes. Crews handle elevator bookings, walk-up stairwells, parkade clearance limits and strata loading-dock requirements across Vancouver — from Yaletown high-rises to Kitsilano basement suites.",
  },
  {
    q: "Can you remove just one item, like a mattress or a dresser?",
    a: "Yes — single-item pickup is the most common Vancouver booking and prices at the minimum pickup rate. Mattresses, box springs, fridges, stoves, sofas and single dressers all go out with the crew.",
  },
  {
    q: "What happens to donated furniture from Vancouver homes?",
    a: "Furniture in reusable condition is offered to local donation programs before recycling, and every load is sorted after pickup. You receive a Recycling Impact Report showing how much of your load was diverted from landfill.",
  },
];

export default function VancouverContent() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-14" aria-label="Vancouver furniture removal services">
      <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3 flex items-center gap-1.5">
        <MapPin className="w-4 h-4" /> Vancouver furniture &amp; removal specialists
      </div>
      <h2 className="text-3xl font-bold tracking-tight text-[#102B2A]">Furniture removal in Vancouver — by job, by neighbourhood</h2>
      <p className="mt-3 text-slate-600 max-w-2xl">
        From single sofas in Kitsilano to full condo cleanouts downtown, every Vancouver job is quoted upfront, approved by you before loading, and sorted for donation and recycling after pickup.
      </p>

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {BLOCKS.map((b) => (
          <div key={b.h2} className="rounded-2xl border border-slate-100 bg-white p-6">
            <h3 className="text-xl font-bold tracking-tight text-[#102B2A]">{b.h2}</h3>
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

      <div className="mt-10 rounded-2xl bg-[#f4f7f5] border border-[#187B65]/20 p-6">
        <h3 className="font-bold text-[#102B2A]">Serving Vancouver neighbourhoods</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {AREAS.map((a) => (
            <span key={a} className="rounded-full bg-white border border-slate-200 px-3.5 py-1.5 text-sm font-semibold text-[#102B2A]">{a}</span>
          ))}
        </div>
        <p className="mt-3 text-sm text-slate-600">Requests are accepted city-wide, including these areas. Same-day pickup is subject to contractor confirmation of your window — never assumed.</p>
      </div>

      <div className="mt-10 max-w-3xl space-y-3">
        <h3 className="text-2xl font-bold text-[#102B2A]">Vancouver furniture removal FAQs</h3>
        {FAQS.map((f) => (
          <details key={f.q} className="rounded-2xl border border-slate-200 bg-white p-5">
            <summary className="cursor-pointer font-bold text-[#102B2A]">{f.q}</summary>
            <p className="mt-3 text-slate-600">{f.a}</p>
          </details>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link to="/furniture-removal" className="inline-flex items-center gap-2 text-sm font-bold text-[#187B65] hover:underline">
          Furniture removal service details <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/same-day-pickup" className="inline-flex items-center gap-2 text-sm font-bold text-[#187B65] hover:underline">
          How same-day pickup works <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/junk-removal-north-vancouver" className="inline-flex items-center gap-2 text-sm font-bold text-[#187B65] hover:underline">
          North Vancouver junk removal <ArrowRight className="w-4 h-4" />
        </Link>
        <Link to="/junk-removal-burnaby" className="inline-flex items-center gap-2 text-sm font-bold text-[#187B65] hover:underline">
          Burnaby junk removal <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}