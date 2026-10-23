import { useEffect, useState } from "react";
import { RefreshCw, Search, ShieldCheck, MapPin, DollarSign, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import GrowthGauge from "@/components/admin/growth/GrowthGauge";
import NextActions from "@/components/admin/growth/NextActions";

const MODULE_LINKS = [
  { to: "/admin/search-authority", icon: Search, label: "Search Authority" },
  { to: "/admin/intelligence", icon: Sparkles, label: "Brand & Market Intelligence" },
  { to: "/admin/reputation", icon: ShieldCheck, label: "Reputation Monitor" },
  { to: "/admin/revenue", icon: DollarSign, label: "Revenue Intelligence" },
];

// Growth Intelligence — Phase 1. Five gauges, every one computed from live
// verified data with a documented methodology. Unavailable data shows
// "Not tracked", never an estimate.
export default function AdminGrowth() {
  const [data, setData] = useState({ scan: null, search: null, reputation: null, funnel: null, market: null });
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState([]);

  const load = async () => {
    setLoading(true);
    setFailed([]);
    const results = await Promise.allSettled([
      base44.entities.BrandScan.list({ sort: "-created_date", limit: 2 }),
      base44.functions.invoke("searchAuthority", {}),
      base44.functions.invoke("reputationEngine", {}),
      base44.functions.invoke("conversionFunnel", { days: 30 }),
      base44.functions.invoke("marketOpportunity", {}),
    ]);
    const names = ["scan", "search", "reputation", "funnel", "market"];
    const next = {};
    const fails = [];
    results.forEach((r, i) => {
      if (r.status === "fulfilled") {
        const v = r.value;
        next[names[i]] = names[i] === "scan" ? (v.items || v) : (v.data ?? v);
      } else fails.push(names[i]);
    });
    setData(next);
    setFailed(fails);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const { scan, search, reputation, funnel, market } = data;
  const searchOk = search?.connected;
  const net = reputation?.network;

  // ---- Gauge 1: Search Visibility (GSC, 28 days) ---------------------------
  // 40% index coverage + 30% CTR (8% CTR = 100) + 30% position (pos 5 = 100,
  // pos 20+ = 0). All inputs verified Google Search Console data.
  let searchScore = null;
  const searchEvidence = [], searchProblems = [], searchActions = [];
  if (searchOk) {
    const t = search.totals || {};
    const coverage = search.index.sitemap_pages > 0 ? search.index.with_impressions / search.index.sitemap_pages : 0;
    const ctrScore = Math.min(1, (t.ctr || 0) / 8);
    const posScore = t.position > 0 ? Math.max(0, Math.min(1, (20 - t.position) / 15)) : 0;
    searchScore = Math.round((0.4 * coverage + 0.3 * ctrScore + 0.3 * posScore) * 100);
    const impDelta = (t.impressions || 0) - (search.totals_previous?.impressions || 0);
    searchEvidence.push(
      `${(t.impressions || 0).toLocaleString("en-CA")} impressions, ${(t.clicks || 0).toLocaleString("en-CA")} clicks, ${t.ctr || 0}% CTR, avg position ${t.position || "—"} (28 days to ${search.endDate})`,
      `Index evidence: ${search.index.with_impressions} of ${search.index.sitemap_pages} sitemap pages received impressions in 90 days`,
      impDelta !== 0 ? `Impressions ${impDelta > 0 ? "up" : "down"} ${Math.abs(impDelta).toLocaleString("en-CA")} vs previous 28 days` : "Impressions flat vs previous 28 days",
    );
    if (search.index.no_impressions > 0) searchProblems.push(`${search.index.no_impressions} sitemap pages have zero impressions in 90 days (not indexed or not ranking)`);
    if ((t.ctr || 0) < 3 && (t.impressions || 0) > 100) searchProblems.push(`Site CTR of ${t.ctr}% is low for its impression volume — titles/descriptions are losing clicks`);
    (search.opportunities || []).slice(0, 3).forEach((o) => searchActions.push(`${o.action} — ${o.page}`));
  }

  // ---- Gauge 2: Brand Authority (latest AI brand scan) ---------------------
  // The scanner's documented 0-100 score across SEO, discoverability,
  // reputation, credibility and positioning; verified findings + flagged
  // AI estimates. Trend compares against the previous stored scan.
  const brandScore = scan?.[0]?.overall_score ?? null;
  const brandTrend = scan?.[0]?.previous_overall_score != null && brandScore != null
    ? brandScore - scan[0].previous_overall_score : null;

  // ---- Gauge 3: Customer Reputation (verified reviews only) ----------------
  // Verified average rating (minimum 3 approved reviews) scaled to 100:
  // (avg_rating / 5) * 100. Dispute facts reported alongside, never blended.
  let reputationScore = null;
  const repEvidence = [], repProblems = [], repActions = [];
  if (net) {
    if (net.verified_satisfaction != null && net.verified_review_count >= 3) {
      reputationScore = Math.round((net.verified_satisfaction / 5) * 100);
      repEvidence.push(`Verified average rating ${net.verified_satisfaction}/5 across ${net.verified_review_count} approved reviews`);
    } else {
      repEvidence.push(`Only ${net.verified_review_count} approved reviews on record — a minimum of 3 is required for a verified score`);
    }
    if (net.on_time_completion_rate != null) repEvidence.push(`On-time completion ${net.on_time_completion_rate}% across ${net.on_time_recorded} recorded arrivals`);
    if (net.pricing_dispute_frequency != null && net.pricing_dispute_frequency > 0) repProblems.push(`Pricing disputes on ${net.pricing_dispute_frequency}% of completed jobs`);
    if (net.unverified_disputes > 0) repProblems.push(`${net.unverified_disputes} open disputes awaiting resolution`);
    if (net.avg_contractor_response_hours != null && net.avg_contractor_response_hours > 24) repProblems.push(`Average contractor response time is ${net.avg_contractor_response_hours}h`);
    if (reputationScore != null && net.verified_review_count < 15) repActions.push(`Request reviews after every completed job to build a verifiable rating base (currently ${net.verified_review_count})`);
    if (net.avg_contractor_response_hours != null && net.avg_contractor_response_hours > 24) repActions.push("Chase slow contractor response times via the Payouts/Partners tools");
  }

  // ---- Gauge 4: Market Opportunity (city coverage classes) -----------------
  // Share of tracked cities weighted: confirmed capacity = 1.0, matching
  // territory = 0.5, recruitment = 0.25. 100 = every tracked city has
  // verified operational capacity.
  let marketScore = null;
  const mkEvidence = [], mkProblems = [], mkActions = [];
  if (market?.cities?.length) {
    const weight = { confirmed_capacity: 1, matching_territory: 0.5, recruitment_opportunity: 0.25 };
    marketScore = Math.round(100 * market.cities.reduce((s, c) => s + (weight[c.classification] ?? 0), 0) / market.cities.length);
    market.cities.slice(0, 4).forEach((c) => {
      mkEvidence.push(`${c.city}: ${c.classification.split("_").join(" ")} — ${c.demand_requests} requests, ${c.verified_partners} verified partners${c.search_interest_impressions !== null ? `, ${c.search_interest_impressions} search impressions` : ""}`);
    });
    market.cities.filter((c) => c.classification === "matching_territory").forEach((c) => {
      mkProblems.push(`${c.city} has real demand (${c.demand_requests} requests) but no verified contractor`);
      mkActions.push(`Recruit a contractor for ${c.city} to convert existing demand into capacity`);
    });
    market.cities.filter((c) => c.classification === "recruitment_opportunity").slice(0, 2).forEach((c) => {
      mkActions.push(`${c.city} shows search interest with no contractor — a recruitment market`);
    });
  }

  // ---- Gauge 5: Growth Readiness (funnel, 30 days, customer+contractor) ----
  // 40% visit→quote rate (30% benchmark = 100) + 40% quote→booking rate
  // (30% benchmark = 100) + 20% booking→confirmed completion. Owner and bot
  // traffic are excluded by the funnel engine itself.
  let growthScore = null;
  const grEvidence = [], grProblems = [], grActions = [];
  if (funnel?.rates) {
    const v2l = funnel.rates.visit_to_lead_pct, l2b = funnel.rates.lead_to_booking_pct, b2c = funnel.rates.booking_to_confirmed_pct;
    if (v2l != null && l2b != null) {
      growthScore = Math.round(Math.max(0, Math.min(100,
        0.4 * Math.min(1, v2l / 30) * 100 + 0.4 * Math.min(1, l2b / 30) * 100 + 0.2 * Math.min(1, (b2c ?? 0) / 100) * 100)));
    }
    grEvidence.push(`Search visits → quotes: ${v2l ?? "—"}% · quotes → bookings: ${l2b ?? "—"}% · bookings → confirmed: ${b2c ?? "—"}% (30 days, real traffic only)`);
    const paidJobs = funnel.funnel?.paid?.platform ?? 0;
    grEvidence.push(`Verified platform-paid jobs: ${paidJobs}; externally paid awaiting reconciliation: ${funnel.funnel?.paid?.external_unverified ?? 0} (kept out of verified revenue)`);
    if ((l2b ?? 0) < 20) { grProblems.push(`Only ${l2b}% of quotes become bookings`); grActions.push("Review quote follow-ups and response speed in the Lead Pipeline"); }
    if ((v2l ?? 0) < 15) { grProblems.push(`Only ${v2l}% of visitors request a quote`); grActions.push("Clarify the booking path and pricing on the home page"); }
  }

  // ---- Ranked next actions across all sources ------------------------------
  const actions = [];
  if (searchOk) (search.opportunities || []).slice(0, 2).forEach((o) => actions.push({
    what: o.action, why: o.evidence, do: o.action,
    measure: `Impressions and CTR for ${o.page} in Search Authority`, to: "/admin/search-authority", module: "Search Authority",
  }));
  market?.cities?.filter((c) => c.classification === "matching_territory").slice(0, 1).forEach((c) => actions.push({
    what: `Recruit a verified contractor in ${c.city}`, why: `${c.demand_requests} real request(s) with no verified partner`,
    do: "Approve a pending contractor application or open recruitment for this city",
    measure: "City classification moves to Confirmed capacity in Market Opportunity", to: "/admin/national", module: "National Ops",
  }));
  if (brandScore != null && (scan?.[0]?.weaknesses || []).length) actions.push({
    what: "Act on the top brand-scan weakness", why: scan[0].weaknesses[0],
    do: "Review the full scan and work through its recommendations", measure: "Re-run the scan and compare the brand score",
    to: "/admin/intelligence", module: "Brand & Market Intelligence",
  });
  if (net && net.verified_review_count < 15) actions.push({
    what: "Grow verified review volume", why: `Only ${net.verified_review_count} approved reviews — reputation metrics need a base of real feedback`,
    do: "Enable review requests after completed jobs", measure: "Approved review count in the Reputation dashboard", to: "/admin/reputation", module: "Reputation",
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#102B2A]">Growth Intelligence</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">Five live gauges, each with its documented methodology and supporting evidence. Unavailable data shows as not tracked — never estimated.</p>
        </div>
        <button onClick={load} disabled={loading} className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#187B65] transition-colors" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-[#102B2A] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>
      {failed.length > 0 && !loading && (
        <p className="mt-3 text-xs text-amber-600">Some data sources failed to load ({failed.join(", ")}) — their gauges show as not tracked until they respond.</p>
      )}

      <div className="mt-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <GrowthGauge
          label="Search Visibility" value={loading ? null : searchScore}
          trend={searchOk ? (search.totals?.impressions || 0) - (search.totals_previous?.impressions || 0) : null}
          formula="40% index coverage + 30% CTR (8% = full marks) + 30% average position (position 5 = full, 20+ = zero). Source: Google Search Console, last 28 days, verified property data only."
          evidence={searchEvidence} problems={searchProblems} actions={searchActions}
        />
        <GrowthGauge
          label="Brand Authority" value={loading ? null : brandScore} trend={loading ? null : brandTrend}
          formula="The AI brand scanner's documented 0-100 score across SEO, discoverability, reputation, credibility and positioning, with every finding labelled verified or AI-estimated. Trend compares the two most recent scans."
          evidence={scan?.[0] ? [`Latest scan ${String(scan[0].created_date || "").slice(0, 10)} scored ${scan[0].overall_score}${brandTrend !== null ? ` (${brandTrend >= 0 ? "+" : ""}${brandTrend} vs previous)` : ""}`] : []}
          problems={scan?.[0]?.weaknesses?.slice(0, 3)}
          actions={scan?.[0]?.opportunities?.slice(0, 3)}
        />
        <GrowthGauge
          label="Customer Reputation" value={loading ? null : reputationScore}
          formula="Verified average rating (minimum 3 approved reviews) scaled to 100: (rating / 5) × 100. Dispute and punctuality facts are reported alongside, never blended into the score."
          evidence={repEvidence} problems={repProblems} actions={repActions}
        />
        <GrowthGauge
          label="Market Opportunity" value={loading ? null : marketScore}
          formula="Share of tracked cities weighted by verified state: confirmed capacity = 1.0, matching territory = 0.5, recruitment = 0.25. 100 means every tracked city has verified operational capacity."
          evidence={mkEvidence} problems={mkProblems} actions={mkActions}
        />
        <GrowthGauge
          label="Growth Readiness" value={loading ? null : growthScore}
          formula="40% visit→quote rate (30% benchmark) + 40% quote→booking rate (30% benchmark) + 20% booking→confirmed completion. Real customer and contractor traffic only — owner and bot activity excluded."
          evidence={grEvidence} problems={grProblems} actions={grActions}
        />
      </div>

      <div className="mt-5">
        <NextActions actions={actions} loading={loading} />
      </div>

      <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {MODULE_LINKS.map((m) => (
          <Link key={m.to} to={m.to} className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 hover:border-[#187B65] transition-colors">
            <m.icon className="w-4 h-4 text-[#187B65]" />
            <div className="text-xs font-bold text-[#102B2A] mt-2 leading-snug">{m.label} <ArrowRight className="w-3 h-3 inline text-slate-300" /></div>
          </Link>
        ))}
      </div>
    </div>
  );
}