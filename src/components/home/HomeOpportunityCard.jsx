import {
  Truck, Armchair, WashingMachine, Laptop, Recycle, Trash2, PackageOpen, HardHat,
  Hammer, BedDouble, Leaf, Building2, Waves, Wrench, Package, Zap, CircleDot,
  ExternalLink, MapPin, Globe, ShieldCheck,
} from "lucide-react";
import { serviceCategoryLabel } from "@/lib/discoveryShared";
import { provinceLabel } from "@/lib/communityShared";
import { trackGA } from "@/lib/communityAnalytics";

const CATEGORY_ICONS = {
  junk_removal: Truck,
  furniture_removal: Armchair,
  appliance_removal: WashingMachine,
  electronics: Laptop,
  recycling: Recycle,
  waste_disposal: Trash2,
  estate_cleanout: PackageOpen,
  construction_debris: HardHat,
  demolition_cleanup: Hammer,
  mattress_disposal: BedDouble,
  yard_waste_removal: Leaf,
  commercial_waste: Building2,
  hot_tub_removal: Waves,
  scrap_metal: Wrench,
  bin_rentals: Package,
  same_day_pickup: Zap,
  other: CircleDot,
};

// Social-feed card for one real, sourced public service request. Every card
// links to the original post; nothing on it is generated or estimated.
export default function HomeOpportunityCard({ item, index = 0 }) {
  const CatIcon = CATEGORY_ICONS[item.service_category] || CircleDot;
  const date = item.posted_at ? new Date(item.posted_at).toLocaleDateString("en-CA", { month: "short", day: "numeric" }) : "";
  const verifiedDate = item.last_verified_at ? new Date(item.last_verified_at).toLocaleDateString("en-CA") : "";

  const open = () => trackGA("community_opportunity_open", {
    service_category: item.service_category,
    province: item.province_code || "",
    classification: item.classification,
    surface: "home",
  });

  return (
    <article
      className="glass aurora-rise rounded-2xl p-4 flex flex-col hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(16,43,42,0.12)] transition-all"
      style={{ animationDelay: `${Math.min(index * 60, 480)}ms` }}
    >
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider">
        <span className="inline-flex items-center gap-1 rounded-full bg-[#187B65]/10 text-[#187B65] px-2.5 py-1">
          <CatIcon className="w-3 h-3" />{serviceCategoryLabel(item.service_category)}
        </span>
        {item.classification === "active_request" && <span className="rounded-full bg-[#187B65] text-white px-2 py-1">Active request</span>}
        {item.classification === "potential_opportunity" && <span className="rounded-full bg-amber-100 text-amber-800 px-2 py-1">Potential</span>}
      </div>

      <a href={item.source_url} onClick={open} target="_blank" rel="noopener noreferrer nofollow" className="mt-2.5 block">
        <h3 className="font-bold text-[#102B2A] leading-snug line-clamp-2">{item.title}</h3>
      </a>
      {item.excerpt && <p className="mt-1.5 text-xs text-slate-600 leading-relaxed line-clamp-2">{item.excerpt}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
        {(item.city || item.province_code) && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {[item.city, provinceLabel(item.province_code)].filter((v, i, a) => v && a.indexOf(v) === i).join(", ")}
          </span>
        )}
        <span className="inline-flex items-center gap-1 min-w-0"><Globe className="w-3 h-3 shrink-0" /><span className="truncate">{item.source_label || "Public source"}</span></span>
        {date && <span>{date}</span>}
        {item.relevance_score > 0 && <span className="font-bold text-[#187B65]">AI relevance {item.relevance_score}%</span>}
      </div>

      <div className="mt-auto pt-3 flex items-center justify-between gap-2">
        <a
          href={item.source_url}
          onClick={open}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#125C4E] transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> Open original
        </a>
        {verifiedDate && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#187B65]" title={`Last verified ${verifiedDate}`}>
            <ShieldCheck className="w-3.5 h-3.5" /> Verified
          </span>
        )}
      </div>
    </article>
  );
}