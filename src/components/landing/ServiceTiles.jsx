import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { Image } from "@/components/ui/image";

const IMG = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/";

const TILES = [
  { name: "Furniture Removal", note: "Sofas, mattresses, dressers", to: "/furniture-removal", img: `${IMG}6759d22f1_generated_image.png` },
  { name: "Appliance Removal", note: "Fridges, stoves, washers", to: "/appliance-removal", img: `${IMG}2127ddfa5_generated_image.png` },
  { name: "Moving Cleanouts", note: "Move-out and downsizing", to: "/move-assist", img: `${IMG}f7cf93bd0_generated_image.png` },
  { name: "Construction Debris", note: "Renovation and job-site waste", to: "/request-service?service=other", img: `${IMG}f6583d255_generated_image.png` },
  { name: "Commercial Pickup", note: "Offices and retail spaces", to: "/commercial-recycling", img: `${IMG}75c169cf4_generated_image.png` },
  { name: "Electronics Recycling", note: "Household and office e-waste", to: "/electronics-recycling", img: `${IMG}9335b6a72_generated_image.png` },
];

export default function ServiceTiles() {
  return (
    <section className="mx-auto max-w-[1280px] px-4">
      <div className="mb-2.5 flex items-end justify-between gap-2">
        <h2 className="font-heading text-[17px] font-extrabold tracking-tight text-lm-ink">What we clear</h2>
        <Link to="/services" className="text-[11.5px] font-bold text-[hsl(var(--lm-teal))] hover:underline">All services</Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        {TILES.map((t) => (
          <Link
            key={t.name}
            to={t.to}
            className="group overflow-hidden rounded-xl border border-lm-line bg-white transition-all hover:-translate-y-0.5 hover:border-[hsl(var(--lm-teal)/0.4)] hover:shadow-[0_14px_28px_-22px_rgba(17,24,39,0.45)]"
          >
            <div className="relative aspect-[4/3] overflow-hidden bg-[hsl(var(--ri-mint))]">
              <Image src={t.img} alt={t.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
              <span className="absolute right-1.5 top-1.5 rounded-full bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-lm-ink">
                Instant estimate
              </span>
            </div>
            <div className="px-2.5 pb-2.5 pt-2">
              <div className="flex items-start justify-between gap-1">
                <span className="text-[12px] font-bold leading-tight text-lm-ink">{t.name}</span>
                <ArrowUpRight className="mt-0.5 h-3 w-3 shrink-0 text-lm-muted group-hover:text-[hsl(var(--lm-teal))]" />
              </div>
              <div className="mt-0.5 text-[10.5px] leading-tight text-lm-muted">{t.note}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}