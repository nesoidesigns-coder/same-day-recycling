import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import CitySummaryTab from "@/components/admin/CitySummaryTab";
import CityPricingEditor from "@/components/admin/CityPricingEditor";
import { MapPin } from "lucide-react";

export default function AdminCities() {
  const [providers, setProviders] = useState(null);

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.Provider.filter({ verification: "verified" }, { limit: 1 });
      setProviders(items.length);
    })().catch(() => setProviders(0));
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">City Management</h1>
        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-[#187B65]" /> Service coverage and pricing per city — add any Canadian city without code changes
        </p>
      </div>

      <CitySummaryTab />

      <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-1">City-specific pricing</h2>
        <p className="text-xs text-slate-500 mb-4">Type any city name to set local rates. Cities without their own rates use the default ladder — that is shown to customers as awaiting local configuration, never as invented coverage.</p>
        <CityPricingEditor />
      </div>

      <p className="text-xs text-slate-400 px-1">Verified recycling-provider listings in the public directory: {providers === null ? "…" : providers}. Partner onboarding status per city is shown in the coverage summary above.</p>
    </div>
  );
}