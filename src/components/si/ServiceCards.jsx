import { Link } from "react-router-dom";
import { Armchair, ArrowRight, Building2, HardHat, Home, KeyRound, Leaf, MapPin, Refrigerator, Trash2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { setRexContext } from "@/lib/rexSession";
import { COVERAGE_STATUS, money } from "./siShared";

const PHOTOS = {
  furniture: "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/3c76de6ea_generated_image.png",
  appliance: "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/58e8c0557_generated_image.png",
  junk: "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/27e2d989f_generated_image.png",
  yard: "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/a8ef6976e_generated_image.png",
  construction: "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/4b85c461a_generated_image.png",
  moving: "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/5acac6fe6_generated_image.png",
  estate: "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/8a35de190_generated_image.png",
  commercial: "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/a338d682d_generated_image.png",
};

const CARDS = [
  { key: "junk", name: "Junk Removal", Icon: Trash2, serviceType: "junk_removal", desc: "General household junk, bagged or loose, loaded and hauled the same day where available.", to: "/request-service" },
  { key: "furniture", name: "Furniture Removal", Icon: Armchair, serviceType: "furniture", desc: "Sofas, mattresses, dressers and more — carried out and sorted for donation or recycling.", to: "/furniture-removal" },
  { key: "appliance", name: "Appliance Removal", Icon: Refrigerator, serviceType: "appliances", desc: "Fridges, washers and stoves removed safely and sent to certified recycling streams.", to: "/appliance-removal" },
  { key: "yard", name: "Yard Waste", Icon: Leaf, serviceType: "junk_removal", desc: "Branches, leaves, sod and garden clippings hauled to green-waste facilities.", to: "/request-service" },
  { key: "construction", name: "Construction Debris", Icon: HardHat, serviceType: "junk_removal", desc: "Drywall, lumber and renovation debris cleared and sorted for recycling streams.", to: "/request-service" },
  { key: "moving", name: "Moving Cleanouts", Icon: Home, serviceType: "cleanouts", desc: "Clear the old place on your schedule with staged pickups tied to your move date.", to: "/move-assist" },
  { key: "estate", name: "Estate Cleanouts", Icon: KeyRound, serviceType: "cleanouts", desc: "Respectful, unhurried full-home clearouts with donation and recycling sorting.", to: "/request-service" },
  { key: "commercial", name: "Commercial Removal", Icon: Building2, desc: "Office furniture, electronics and fit-out debris removed around your business hours.", to: "/commercial-recycling" },
];

// Section — service cards that read like real consumer products: photography,
// plain-language copy, a published starting rate, and live availability from
// verified coverage records. Availability is never overstated.
export default function ServiceCards({ city, prices, coverage, cities }) {
  const startingAt = money(Number(prices?.minimum_pickup));
  const cityStatus = city ? coverage.statusFor(city) : null;
  const availability = city
    ? cityStatus
      ? `${COVERAGE_STATUS[cityStatus].label} in ${city}`
      : "Checking availability…"
    : null;

  return (
    <section id="services" className="py-12 md:py-16">
      <div className="max-w-2xl">
        <h2 className="text-[24px] font-bold tracking-tight text-si-ink md:text-[30px]">Services built around your pickup</h2>
        <p className="mt-1.5 text-sm text-si-muted md:text-base">
          Every service is quoted before anything is loaded, and every load is sorted for its best recycling or
          donation outcome.
        </p>
      </div>
      <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <article key={card.key} className="group flex flex-col overflow-hidden rounded-[20px] border border-si-line bg-white shadow-sm transition-shadow hover:shadow-md">
            <div className="relative aspect-[4/3] overflow-hidden bg-si-bg2">
              <Image src={PHOTOS[card.key]} alt={card.name} className="size-full" fittingType="fill" />
              <span className="absolute left-3 top-3 inline-flex size-8 items-center justify-center rounded-full bg-white/95 text-ri-forest shadow-sm" aria-hidden="true">
                <card.Icon className="size-4" />
              </span>
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="text-base font-bold text-si-ink">{card.name}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-si-muted">{card.desc}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                {startingAt && <span className="font-semibold text-si-ink">From {startingAt} pickup</span>}
                {startingAt && <span className="text-si-muted/70">· published platform rate</span>}
              </div>
              {availability ? (
                <div className="mt-1.5 inline-flex w-fit items-center gap-1.5 rounded-full bg-si-bg2 px-2.5 py-1 text-[11px] font-semibold text-si-muted">
                  <MapPin className="size-3" /> {availability}
                </div>
              ) : null}
              <div className="mt-4 flex flex-wrap gap-2.5">
                <Link
                  to={card.to}
                  onClick={() => card.serviceType && setRexContext({ service_type: card.serviceType, page: "homepage-services" })}
                  className="inline-flex items-center gap-1.5 rounded-full bg-si-forest px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-si-mint hover:text-si-forest"
                >
                  Explore Service <ArrowRight className="size-3.5" />
                </Link>
                <Link
                  to={`/request-service${city ? `?city=${encodeURIComponent(city)}` : ""}`}
                  className="inline-flex items-center rounded-full border border-si-forest/25 px-4 py-2 text-sm font-bold text-si-forest transition-colors hover:bg-si-forest hover:text-white"
                >
                  Get Quote
                </Link>
              </div>
            </div>
          </article>
        ))}
      </div>
      {cities && (
        <p className="mt-5 font-plex text-[11px] text-si-muted">
          Monitored cities: {cities.slice(0, 12).join(" · ")}{cities.length > 12 ? " and more" : ""} — see all locations on the <Link to="/coverage" className="font-bold text-si-forest underline-offset-4 hover:underline">Locations page</Link>.
        </p>
      )}
    </section>
  );
}