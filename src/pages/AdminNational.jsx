import { useState } from "react";
import { Globe2, Loader2 } from "lucide-react";
import OverviewTab from "@/components/admin/nat/OverviewTab";
import RequestsTab from "@/components/admin/nat/RequestsTab";
import RecruitmentTab from "@/components/admin/nat/RecruitmentTab";
import SalesIntelligenceTab from "@/components/admin/nat/SalesIntelligenceTab";

const TABS = [
  { key: "overview", label: "Overview" },
  { key: "requests", label: "Requests" },
  { key: "recruitment", label: "Provider Recruitment" },
  { key: "intelligence", label: "Sales Intelligence" },
];

export default function AdminNational() {
  const [tab, setTab] = useState("overview");
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <span className="w-10 h-10 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center shrink-0">
          <Globe2 className="w-5 h-5" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-[#102B2A] leading-tight">National Operations</h1>
          <p className="text-sm text-slate-500">Every Canadian market — requests, provider matching and recruitment in one place.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
              tab === t.key ? "bg-[#102B2A] text-white" : "bg-white text-slate-600 border border-slate-200 hover:border-[#187B65]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "requests" && <RequestsTab />}
      {tab === "recruitment" && <RecruitmentTab />}
      {tab === "intelligence" && <SalesIntelligenceTab />}

      <div className="mt-6 text-xs text-slate-400 flex items-center gap-1.5">
        <Loader2 className="w-3 h-3" /> Counts and lists load from live records — never estimated.
      </div>
    </div>
  );
}