import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Radar, Loader2, TriangleAlert } from "lucide-react";
import NetworkGrid from "@/components/home/NetworkGrid";
import HomeOpportunityCard from "@/components/home/HomeOpportunityCard";
import { trackGA } from "@/lib/communityAnalytics";

const CATEGORY_CHIPS = [
  { id: "all", label: "All services" },
  { id: "junk_removal", label: "Junk removal" },
  { id: "furniture_removal", label: "Furniture" },
  { id: "appliance_removal", label: "Appliances" },
  { id: "recycling", label: "Recycling" },
  { id: "scrap_metal", label: "Scrap metal" },
  { id: "same_day_pickup", label: "Same-day" },
];

// Primary homepage feature: the live AI discovery feed, fed by the Network
// Grid. Only genuinely sourced public requests appear — never placeholder or
// estimated listings.
export default function HomeDiscoveryFeed() {
  const [category, setCategory] = useState("all");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");

  useEffect(() => { trackGA("home_discovery_view"); }, []);

  const feed = useQuery({
    queryKey: ["homeDiscovery", category, province, city],
    queryFn: async () => {
      const q = { status: "open", classification: { $in: ["active_request", "potential_opportunity"] } };
      if (category !== "all") q.service_category = category;
      if (city) q.city = city;
      else if (province) q.province_code = province;
      return (await base44.entities.PublicOpportunity.filter(q, { sort: "-created_date", limit: 30 })).items || [];
    },
  });

  const items = [...(feed.data || [])].sort((a, b) => {
    const w = (i) => (i.classification === "active_request" ? 1 : 0);
    if (w(b) !== w(a)) return w(b) - w(a);
    return (b.relevance_score || 0) - (a.relevance_score || 0);
  });

  const pickCategory = (id) => {
    setCategory(id);
    trackGA("home_discovery_filter", { category: id });
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="w-9 h-9 rounded-xl bg-[#187B65] text-white flex items-center justify-center shrink-0">
          <Radar className="w-5 h-5" />
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-[#102B2A] leading-tight">Live Discovery</h2>
          <p className="text-xs text-slate-500">Real public posts requesting service, sourced and verified by Recycling OS AI</p>
        </div>
      </div>

      <NetworkGrid
        province={province}
        onProvince={(p) => { setProvince(p); setCity(""); }}
        city={city}
        onCity={setCity}
      />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Service categories">
        {CATEGORY_CHIPS.map((c) => (
          <button
            key={c.id}
            onClick={() => pickCategory(c.id)}
            className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${category === c.id ? "border-[#187B65] bg-[#187B65] text-white" : "border-slate-200 bg-white text-slate-600 hover:border-[#187B65] hover:text-[#187B65]"}`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {feed.isPending && (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500" role="status">
          <Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading live requests…
        </div>
      )}
      {feed.isError && (
        <p className="flex items-center gap-2 py-6 text-sm text-red-600" role="alert">
          <TriangleAlert className="w-4 h-4" /> Live requests could not be loaded right now.
        </p>
      )}
      {feed.data && items.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 text-center">
          <p className="text-sm font-bold text-[#102B2A]">No verified requests match this view yet.</p>
          <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Discovery runs on a schedule and only lists requests it has actually sourced from public posts — nothing here is estimated or filled in. Check back as the next run completes.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {items.map((item, i) => (
          <HomeOpportunityCard key={item.id} item={item} index={i} />
        ))}
      </div>

      <p className="text-[11px] leading-relaxed text-slate-500">
        Every card links to the original public post with its publication date. Requests are never invented; listings age out when their source disappears. Browsing and the community are always free.
      </p>
    </div>
  );
}