import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, RefreshCw, DollarSign, ArrowRight, Sparkles, Search, ShieldCheck, Briefcase, BarChart3 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import RingGauge from "@/components/admin/RingGauge";
import BrandScanner from "@/components/admin/intel/BrandScanner";
import MarketOpportunityPanel from "@/components/admin/intel/MarketOpportunityPanel";
import RexIntelligenceAsk from "@/components/admin/intel/RexIntelligenceAsk";
import EvidenceInspector from "@/components/admin/intel/EvidenceInspector";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");

// Brand & Market Intelligence dashboard. Every gauge states its calculation;
// unavailable data shows "Not tracked" rather than a made-up score.
export default function AdminIntelligence() {
  const [scan, setScan] = useState(null);
  const [history, setHistory] = useState([]);
  const [market, setMarket] = useState(null);
  const [funnel, setFunnel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const [s, m, f] = await Promise.allSettled([
      base44.entities.BrandScan.list({ sort: "-created_date", limit: 10 }),
      base44.functions.invoke("marketOpportunity", {}),
      base44.functions.invoke("conversionFunnel", { days: 30 }),
    ]);
    if (s.status === "fulfilled") {
      const page = s.value?.items || s.value || [];
      setHistory(Array.isArray(page) ? page : page.items || []);
      setScan((Array.isArray(page) ? page : page.items || [])[0] || null);
    }
    if (m.status === "fulfilled") setMarket(m.value.data);
    if (f.status === "fulfilled") setFunnel(f.value.data);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const runScan = async () => {
    setRunning(true);
    try {
      await base44.functions.invoke("brandScan", {});
      await load();
    } finally {
      setRunning(false);
    }
  };

  const f = funnel;
  const gaugeExplanation = scan
    ? `AI-weighted average of five sub-scores (SEO, discoverability, reputation, credibility, positioning), 0–100. Verified findings from live site content; unconfirmed items are flagged as AI estimates.`
    : undefined;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#102B2A]">Brand &amp; Market Intelligence</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Rex-powered intelligence for the business: brand visibility, search presence, market opportunity and
            revenue attribution — real data only, unavailable sources shown as not connected.
          </p>
        </div>
        <button onClick={load} disabled={loading} className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#187B65] transition-colors" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-[#102B2A] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="mt-5 grid md:grid-cols-2 gap-4">
        <RingGauge
          value={loading ? null : (scan?.overall_score ?? null)}
          label="Brand Visibility"
          sub={gaugeExplanation}
          unavailableReason={loading ? undefined : "no brand scan yet — run one below"}
        />
        <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
          <div className="text-sm font-bold text-[#102B2A] mb-3 inline-flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-[#187B65]" /> Revenue Attribution (30 days)
          </div>
          {f ? (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <Att label="Search visits → quotes" value={`${f.rates.visit_to_lead_pct ?? "—"}%`} />
              <Att label="Quotes → bookings" value={`${f.rates.lead_to_booking_pct ?? "—"}%`} />
              <Att label="Bookings → completed" value={`${f.rates.booking_to_confirmed_pct ?? "—"}% confirmed`} />
              <Att label="Completed job value" value={money(f.money.completed_job_value)} note={`${money(f.money.commission_earned)} commission`} />
              <Att label="Platform-paid jobs" value={String(f.funnel.paid.platform)} note="verified through checkout" />
              <Att label="External-paid (unverified)" value={String(f.funnel.paid.external_unverified)} note="awaiting reconciliation" />
            </div>
          ) : (
            <p className="text-sm text-slate-500">Not connected — funnel analytics unavailable.</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <DashLink to="/admin/search-authority" icon={Search} label="Search Authority" />
        <DashLink to="/admin/reputation" icon={ShieldCheck} label="Reputation Monitor" />
        <DashLink to="/admin/sales" icon={Briefcase} label="Competitor Intelligence" />
        <DashLink to="/admin/analytics" icon={BarChart3} label="Traffic & Analytics" />
      </div>

      <div className="mt-5">
        <BrandScanner scan={scan} history={history} running={running} onRun={runScan} />
      </div>

      <div className="mt-5">
        <EvidenceInspector scanId={scan?.id} />
      </div>

      <div className="mt-5">
        <MarketOpportunityPanel market={market} loading={loading && !market} />
      </div>

      <div className="mt-5">
        <RexIntelligenceAsk />
      </div>
    </div>
  );
}

function Att({ label, value, note }) {
  return (
    <div className="rounded-xl bg-[#f4f7f5] border border-slate-100 px-3 py-2.5">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="text-lg font-extrabold text-[#102B2A]">{value}</div>
      {note && <div className="text-[10px] text-slate-500">{note}</div>}
    </div>
  );
}

function DashLink({ to, icon: Icon, label }) {
  return (
    <Link to={to} className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3.5 py-1.5 font-semibold text-[#102B2A] hover:border-[#187B65] transition-colors">
      <Icon className="w-3.5 h-3.5 text-[#187B65]" /> {label} <ArrowRight className="w-3 h-3 text-slate-400" />
    </Link>
  );
}