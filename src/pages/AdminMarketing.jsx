import { useState } from "react";
import { Megaphone } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import FollowUpsTab from "@/components/admin/FollowUpsTab";
import SeoInsightsTab from "@/components/admin/SeoInsightsTab";

const TABS = [
  { key: "followups", label: "AI Follow-ups" },
  { key: "seo", label: "SEO Insights" },
];

export default function AdminMarketing() {
  const [tab, setTab] = useState("followups");

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center gap-3 mb-8">
          <span className="w-11 h-11 rounded-2xl bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center">
            <Megaphone className="w-5 h-5" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[#0c3b24] tracking-tight">AI Marketing Hub</h1>
            <p className="text-sm text-slate-500">Lead-chasing AI, SEO insights and content tools</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={
                tab === t.key
                  ? "rounded-full bg-[#0c3b24] text-[#1d9e56] font-bold px-5 py-2 text-sm"
                  : "rounded-full bg-slate-100 text-slate-700 font-medium px-5 py-2 text-sm hover:bg-slate-200 transition-colors"
              }
            >
              {t.label}
            </button>
          ))}
          <a
            href="/admin/facebook"
            className="rounded-full bg-slate-100 text-slate-700 font-medium px-5 py-2 text-sm hover:bg-slate-200 transition-colors"
          >
            Content &rarr; FB AI Hub
          </a>
        </div>

        {tab === "followups" ? <FollowUpsTab /> : <SeoInsightsTab />}
      </div>
      <Footer />
    </div>
  );
}