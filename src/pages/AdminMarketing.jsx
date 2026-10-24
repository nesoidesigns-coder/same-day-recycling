import { useState } from "react";
import { Search, Activity, Sparkles, Network, TrendingUp, BrainCircuit, ExternalLink } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import FollowUpsTab from "@/components/admin/FollowUpsTab";
import SeoInsightsTab from "@/components/admin/SeoInsightsTab";
import ResearchTab from "@/components/admin/ResearchTab";
import AnalyticsTab from "@/components/admin/AnalyticsTab";
import LiveTrackerTab from "@/components/admin/LiveTrackerTab";
import SystemsTab from "@/components/admin/SystemsTab";
import QueryTrackerTab from "@/components/admin/QueryTrackerTab";
import CoCreatorTab from "@/components/admin/CoCreatorTab";
import CompetitorsTab from "@/components/admin/CompetitorsTab";
import SearchConsoleTab from "@/components/admin/SearchConsoleTab";
import RealtimeTab from "@/components/admin/RealtimeTab";
import MarketingAiPanel from "@/components/admin/MarketingAiPanel";
import SocialPostsPanel from "@/components/admin/SocialPostsPanel";
import NetworkTab from "@/components/admin/intel/NetworkTab";

// Recycling OS Intelligence Command Centre — five-tier hierarchy. Every
// existing tool is preserved, grouped by what it answers:
//   Live Market  — what Canadians search for and where demand emerges
//   Live Business— real visitors, inquiries, bookings and revenue
//   AI Actions   — what Rex and the marketing agents are doing
//   Network      — contractor availability, matching and dispatch
//   Growth       — SEO, content, competitors and expansion
const TIERS = [
  { key: "market", label: "Live Market", icon: Search, panels: [
    { key: "keywords", label: "Search Queries" },
    { key: "research", label: "AI Research" },
  ]},
  { key: "business", label: "Live Business", icon: Activity, panels: [
    { key: "live", label: "Live Tracker" },
    { key: "analytics", label: "Analytics" },
    { key: "realtime", label: "Realtime" },
    { key: "queries", label: "Inquiries" },
  ]},
  { key: "ai", label: "AI Actions", icon: Sparkles, panels: [
    { key: "command", label: "AI Command" },
    { key: "followups", label: "AI Follow-ups" },
    { key: "socialposts", label: "Social Posts" },
    { key: "cocreator", label: "AI Co-Creator" },
    { key: "systems", label: "Agent Systems" },
  ]},
  { key: "network", label: "Network", icon: Network, panels: [
    { key: "network", label: "Contractors & Dispatch" },
  ]},
  { key: "growth", label: "Growth", icon: TrendingUp, panels: [
    { key: "seo", label: "SEO Insights" },
    { key: "competitors", label: "Competitors" },
  ]},
];

const PANELS = {
  command: (openCocreator) => <MarketingAiPanel onOpenCocreator={openCocreator} />,
  socialposts: () => <SocialPostsPanel />,
  live: () => <LiveTrackerTab />,
  competitors: () => <CompetitorsTab />,
  followups: () => <FollowUpsTab />,
  seo: () => <SeoInsightsTab />,
  keywords: () => <SearchConsoleTab />,
  research: () => <ResearchTab />,
  analytics: () => <AnalyticsTab />,
  realtime: () => <RealtimeTab />,
  systems: () => <SystemsTab />,
  queries: () => <QueryTrackerTab />,
  cocreator: () => <CoCreatorTab />,
  network: () => <NetworkTab />,
};

export default function AdminMarketing() {
  const [tierKey, setTierKey] = useState("market");
  const [panelKey, setPanelKey] = useState("keywords");

  const tier = TIERS.find((t) => t.key === tierKey) || TIERS[0];
  const panel = tier.panels.find((p) => p.key === panelKey) || tier.panels[0];

  const switchTier = (t) => {
    setTierKey(t.key);
    setPanelKey(t.panels[0].key);
  };
  const openCocreator = () => { setTierKey("ai"); setPanelKey("cocreator"); };

  const renderPanel = () => {
    const fn = PANELS[panel.key];
    return fn ? fn(openCocreator) : tier.panels.length === 1 ? <NetworkTab /> : null;
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-11 h-11 rounded-2xl bg-[#102B2A] text-[#187B65] flex items-center justify-center">
            <BrainCircuit className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[#102B2A] tracking-tight">Recycling OS Intelligence Command Centre</h1>
            <p className="text-sm text-slate-500">Market demand, live business activity, AI actions, network coverage and growth — in one hierarchy</p>
          </div>
        </div>

        {/* Tier navigation */}
        <div className="flex flex-wrap gap-2 mb-3">
          {TIERS.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTier(t)}
              className={
                tierKey === t.key
                  ? "inline-flex items-center gap-2 rounded-full bg-[#102B2A] text-white font-bold px-5 py-2 text-sm"
                  : "inline-flex items-center gap-2 rounded-full bg-slate-100 text-slate-700 font-medium px-5 py-2 text-sm hover:bg-slate-200 transition-colors"
              }
            >
              <t.icon className={`w-4 h-4 ${tierKey === t.key ? "text-[#187B65]" : ""}`} /> {t.label}
            </button>
          ))}
        </div>

        {/* Panel navigation within the tier */}
        {tier.panels.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-6 pl-1">
            {tier.panels.map((p) => (
              <button
                key={p.key}
                onClick={() => setPanelKey(p.key)}
                className={
                  panelKey === p.key
                    ? "rounded-full bg-[#187B65]/10 text-[#187B65] font-bold px-4 py-1.5 text-xs border border-[#187B65]/30"
                    : "rounded-full text-slate-500 font-medium px-4 py-1.5 text-xs hover:text-[#102B2A] border border-transparent hover:border-slate-200 transition-colors"
                }
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
        <div className="mb-6" />

        {renderPanel()}

        <div className="mt-8">
          <a
            href="/admin/facebook"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65] hover:underline"
          >
            Content &rarr; FB AI Hub <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
      <Footer />
    </div>
  );
}