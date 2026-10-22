import LeadPipelineBoard from "@/components/admin/LeadPipelineBoard";

export default function AdminPipeline() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#102B2A] tracking-tight mb-1">Lead Pipeline</h1>
      <p className="text-sm text-slate-500 mb-6">Where every potential customer stands in the booking process — quote leads, realtors, software and white-label inquiries. Advance or back a card with the arrows; leads older than 7 days are flagged.</p>
      <LeadPipelineBoard />
    </div>
  );
}