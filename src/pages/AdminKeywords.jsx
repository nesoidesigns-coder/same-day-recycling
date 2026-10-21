import SeoTab from "@/components/admin/SeoTab";

export default function AdminKeywords() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0c3b24] tracking-tight mb-1">Search Keywords</h1>
      <p className="text-sm text-slate-500 mb-6">What Canadians actually search before finding you — from Google Search Console.</p>
      <SeoTab />
    </div>
  );
}