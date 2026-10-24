import { useState } from "react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { Megaphone } from "lucide-react";
import CommandOverview from "@/components/admin/command/CommandOverview";
import ConsumerFunnelPanel from "@/components/admin/command/ConsumerFunnelPanel";
import ContractorFunnelPanel from "@/components/admin/command/ContractorFunnelPanel";

const WINDOWS = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
];

// Marketing Command Center — the unified dual-audience dashboard. Observed
// results, estimates and recommendations are always labelled separately.
export default function AdminMarketingCommand() {
  const [tab, setTab] = useState("overview");
  const [days, setDays] = useState(30);

  const tabs = [
    { key: "overview", label: "Combined Overview" },
    { key: "consumer", label: "Consumer Funnel" },
    { key: "contractor", label: "Contractor Funnel" },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9]">
      <TopBar />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-11 h-11 rounded-2xl bg-[#102B2A] text-[#187B65] flex items-center justify-center">
              <Megaphone className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-[#102B2A] tracking-tight">Marketing Command Center</h1>
              <p className="text-sm text-slate-500">Consumers and contractors, one funnel view per audience — verified records only</p>
            </div>
          </div>
          <div className="flex gap-1.5">
            {WINDOWS.map((w) => (
              <button
                key={w.days}
                onClick={() => setDays(w.days)}
                className={
                  days === w.days
                    ? "rounded-full bg-[#102B2A] text-white font-bold px-4 py-1.5 text-xs"
                    : "rounded-full bg-white text-slate-500 font-medium px-4 py-1.5 text-xs border border-slate-200 hover:border-[#187B65] transition-colors"
                }
              >
                {w.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                tab === t.key
                  ? "rounded-full bg-[#187B65]/10 text-[#187B65] font-bold px-5 py-2 text-sm border border-[#187B65]/30"
                  : "rounded-full bg-white text-slate-500 font-medium px-5 py-2 text-sm border border-slate-200 hover:border-[#187B65] transition-colors"
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "overview" && <CommandOverview days={days} />}
        {tab === "consumer" && <ConsumerFunnelPanel days={days} />}
        {tab === "contractor" && <ContractorFunnelPanel days={days} />}

        <p className="mt-8 text-[11px] text-slate-500">
          Every figure on this page is observed from app records. Market projections and AI recommendations are labelled as such in Growth Intelligence and AI Business Master — never blended into these numbers. Paid advertising and outbound messaging stay off until you explicitly approve them.
        </p>
      </div>
      <Footer />
    </div>
  );
}