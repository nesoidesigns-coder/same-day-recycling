import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import FinancialsTab from "@/components/growth/FinancialsTab";
import FundTab from "@/components/growth/FundTab";
import CampaignsTab from "@/components/growth/CampaignsTab";
import SimulatorTab from "@/components/growth/SimulatorTab";
import CoverageTab from "@/components/growth/CoverageTab";

const TABS = [
  ["financials", "Financials"], ["fund", "Growth Fund"], ["campaigns", "Campaigns"],
  ["simulator", "Simulator"], ["coverage", "Capacity"],
];

export default function AdminGrowthEngine() {
  const [tab, setTab] = useState("financials");
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["networkGrowth"],
    queryFn: async () => (await base44.functions.invoke("networkGrowth", {})).data,
    refetchInterval: 60000,
  });

  return (
    <div className="space-y-5">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-brand-emerald">Recycling OS</p>
        <h1 className="text-2xl font-bold text-[#102B2A]">Network Growth Engine</h1>
        <p className="mt-1 text-sm text-slate-500">Contractor-supported customer acquisition: verified revenue in, owner-controlled advertising out. Figures are verified records only — estimates are always labeled.</p>
      </header>

      <div className="flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-white p-1.5">
        {TABS.map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`rounded-lg px-3.5 py-2 text-sm font-bold transition ${tab === key ? "bg-[#102B2A] text-white" : "text-slate-600 hover:bg-slate-100"}`}>
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white py-16" role="status">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#102B2A]" />
        </div>
      ) : (
        <>
          {tab === "financials" && <FinancialsTab data={data} />}
          {tab === "fund" && <FundTab data={data} onSaved={refetch} />}
          {tab === "campaigns" && <CampaignsTab data={data} onSaved={refetch} />}
          {tab === "simulator" && <SimulatorTab />}
          {tab === "coverage" && <CoverageTab data={data} />}
        </>
      )}
    </div>
  );
}