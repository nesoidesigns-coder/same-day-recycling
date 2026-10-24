import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Network as NetworkIcon, MapPin, Loader2 } from "lucide-react";
import { provinceLabel } from "@/lib/communityShared";
import { trackGA } from "@/lib/communityAnalytics";

// Interactive Network Grid: verified public service requests grouped by
// province, then city. Counts come straight from sourced records — a zero or
// empty grid means nothing has been verified yet, never absent demand.
export default function NetworkGrid({ province, onProvince, city, onCity }) {
  const counts = useQuery({
    queryKey: ["homeNetworkCounts"],
    queryFn: async () => {
      const res = await base44.entities.PublicOpportunity.aggregate({ query: { status: "open" }, groupBy: "province_code" });
      return (res?.rows || res || []).filter((r) => r.province_code);
    },
  });

  const cities = useQuery({
    queryKey: ["homeNetworkCities", province],
    enabled: !!province,
    queryFn: async () => {
      const res = await base44.entities.PublicOpportunity.aggregate({ query: { status: "open", province_code: province }, groupBy: "city" });
      return (res?.rows || res || []).filter((r) => r.city);
    },
  });

  const rows = counts.data || [];
  const total = rows.reduce((s, r) => s + (r.count || 0), 0);

  const pick = (p) => {
    onProvince(p);
    if (p) trackGA("home_discovery_filter", { province: p });
  };

  return (
    <div className="glass rounded-3xl p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-xl bg-[#187B65] text-white flex items-center justify-center shrink-0">
          <NetworkIcon className="w-4 h-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold text-[#102B2A]">Network Grid</h3>
          <p className="text-[11px] text-slate-500">Verified public service requests across Canada</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          onClick={() => pick("")}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${!province ? "border-[#187B65] bg-[#187B65] text-white" : "border-white/70 bg-white/60 text-slate-600 hover:border-[#187B65] hover:text-[#187B65]"}`}
        >
          All Canada {counts.data ? `· ${total}` : ""}
        </button>
        {rows.map((r) => (
          <button
            key={r.province_code}
            onClick={() => pick(r.province_code)}
            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors ${province === r.province_code ? "border-[#187B65] bg-[#187B65] text-white" : "border-white/70 bg-white/60 text-slate-600 hover:border-[#187B65] hover:text-[#187B65]"}`}
          >
            {provinceLabel(r.province_code)} · {r.count}
          </button>
        ))}
        {counts.isPending && <Loader2 className="w-4 h-4 animate-spin text-[#187B65] self-center" />}
      </div>

      {province && cities.data && cities.data.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2 border-t border-white/70 pt-2.5">
          <button
            onClick={() => onCity("")}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${!city ? "border-[#187B65] bg-[#187B65]/10 text-[#187B65]" : "border-white/70 bg-white/60 text-slate-600 hover:border-[#187B65] hover:text-[#187B65]"}`}
          >
            All of {provinceLabel(province)}
          </button>
          {cities.data.map((r) => (
            <button
              key={r.city}
              onClick={() => { onCity(city === r.city ? "" : r.city); if (city !== r.city) trackGA("home_discovery_filter", { city: r.city }); }}
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold transition-colors ${city === r.city ? "border-[#187B65] bg-[#187B65]/10 text-[#187B65]" : "border-white/70 bg-white/60 text-slate-600 hover:border-[#187B65] hover:text-[#187B65]"}`}
            >
              <MapPin className="w-3 h-3" /> {r.city} · {r.count}
            </button>
          ))}
        </div>
      )}

      {counts.data && total === 0 && (
        <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
          No public requests verified yet. Discovery runs on a schedule and only records requests it has actually sourced — an empty grid means not collected yet, not zero demand.
        </p>
      )}
    </div>
  );
}