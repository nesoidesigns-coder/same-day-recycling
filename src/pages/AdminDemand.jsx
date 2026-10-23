import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Globe2, Loader2, BookOpen } from "lucide-react";
import DemandHealthTab from "@/components/admin/demand/DemandHealthTab";
import DemandDataTab from "@/components/admin/demand/DemandDataTab";
import DemandImportTab from "@/components/admin/demand/DemandImportTab";
import DemandInsightsTab from "@/components/admin/demand/DemandInsightsTab";

const TABS = [
  ["health", "Source Health"],
  ["data", "Industry Data"],
  ["import", "Import Data"],
  ["insights", "Rex Analysis"],
  ["methodology", "Methodology"],
];

export default function AdminDemand() {
  const [tab, setTab] = useState("health");
  const [report, setReport] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await base44.functions.invoke("demandReport", {});
        setReport(res.data);
      } catch {
        setReport(null);
      }
    })();
  }, [tab]);

  return (
    <div>
      <div className="flex items-center gap-3 mb-1">
        <span className="w-10 h-10 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center">
          <Globe2 className="w-5 h-5" />
        </span>
        <div>
          <h1 className="text-2xl font-extrabold text-[#102B2A]">National Demand Intelligence</h1>
          <p className="text-sm text-slate-500">Canadian search-demand measurement across the industry, with Same Day Recycling's verified capture shown separately.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto my-5 pb-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-bold border transition-colors ${
              tab === key ? "bg-[#102B2A] text-white border-[#102B2A]" : "bg-white text-slate-600 border-slate-200 hover:border-[#187B65]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
        {tab === "health" && <DemandHealthTab report={report} />}
        {tab === "data" && <DemandDataTab />}
        {tab === "import" && <DemandImportTab onImported={() => setReport(null)} />}
        {tab === "insights" && <DemandInsightsTab />}
        {tab === "methodology" && <Methodology />}
      </div>
    </div>
  );
}

function Methodology() {
  return (
    <div className="max-w-3xl">
      <h2 className="font-extrabold text-[#102B2A] text-lg flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-[#187B65]" /> Methodology
      </h2>
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-5">
          <div className="font-bold text-[#102B2A] mb-1">Two intelligence layers</div>
          <p><span className="font-semibold text-[#102B2A]">Industry Demand</span> — estimated Canadian search demand for removal and recycling services, regardless of which company receives the customer. Sourced from admin-verified, source-labeled observations (Google Ads Keyword Planner estimates, published industry estimates). Deduplicated per keyword + geography + period so overlapping variants are never counted twice.</p>
          <p className="mt-2"><span className="font-semibold text-[#102B2A]">Our Market Capture</span> — Same Day Recycling's own verified performance: Google Search Console impressions and clicks (Canada-filtered, 28-day window), Google Analytics engagement, and verified Recycling OS inquiries, bookings and completed jobs. Internal test records are always excluded.</p>
        </div>
        <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-5">
          <div className="font-bold text-[#102B2A] mb-1">Market share rule</div>
          <p>A market-share figure is only calculated when numerator and denominator are methodologically comparable. Industry search-volume estimates and organic clicks measure different things, so no share number is published between the two layers. Comparable ratios (e.g. click-through rate within Search Console) are labeled with their basis.</p>
        </div>
        <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-5">
          <div className="font-bold text-[#102B2A] mb-1">Indices are not counts</div>
          <p>Relative-interest indices (Google Trends style, 0-100) express popularity against the geography's own maximum. They are never presented as exact search counts anywhere on the platform.</p>
        </div>
        <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-5">
          <div className="font-bold text-[#102B2A] mb-1">Update cadence & honesty</div>
          <p>Search Console and Analytics refresh daily on their real provider cadence (Search Console reporting lags ~2 days). Keyword Planner volumes are monthly estimates and refresh only when a verified export is imported. Google Trends has no bulk API — indices are recorded manually with their source. Every refresh, failure and unavailable provider is logged in Source Health with timestamps and coverage notes. Nothing claims real-time nationwide search tracking.</p>
        </div>
        <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-5">
          <div className="font-bold text-[#102B2A] mb-1">Demand vs. coverage</div>
          <p>Search demand and contractor availability are never merged: coverage displays are drawn exclusively from operational partner records, and demand displays exclusively from search data. AI analysis output is always labeled as AI estimates.</p>
        </div>
      </div>
    </div>
  );
}