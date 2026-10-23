import SeoTab from "@/components/admin/SeoTab";
import CityPagesPerf from "@/components/admin/CityPagesPerf";

export default function AdminKeywords() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#102B2A] tracking-tight mb-1">Search Keywords</h1>
      <p className="text-sm text-slate-500 mb-6">What Canadians actually search before finding you — from Google Search Console.</p>
      <CityPagesPerf />
      <div className="mt-6"><SeoTab /></div>
    </div>
  );
}