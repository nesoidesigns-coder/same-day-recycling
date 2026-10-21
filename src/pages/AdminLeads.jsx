import LeadsTab from "@/components/admin/LeadsTab";

export default function AdminLeads() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0c3b24] tracking-tight mb-1">Leads</h1>
      <p className="text-sm text-slate-500 mb-6">Quote leads captured across the network — follow up before they go cold.</p>
      <LeadsTab />
    </div>
  );
}