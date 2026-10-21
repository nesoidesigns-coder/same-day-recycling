import SystemsTab from "@/components/admin/SystemsTab";

export default function AdminSystem() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0c3b24] tracking-tight mb-1">System Health</h1>
      <p className="text-sm text-slate-500 mb-6">Live status of integrations, automations and data pipelines.</p>
      <SystemsTab />
    </div>
  );
}