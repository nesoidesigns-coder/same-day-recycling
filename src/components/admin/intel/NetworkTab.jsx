import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, RefreshCw, Users, Radar, MapPin, Target, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Network tab of the Intelligence Command Centre: verified contractor capacity,
// open matching activity and recruitment opportunities — aggregate counts from
// the platform's own coverage and market-opportunity functions. Never estimated.
const CLASS_META = {
  confirmed_capacity: { label: "Confirmed capacity", chip: "bg-emerald-50 text-emerald-700" },
  matching_territory: { label: "Matching territory", chip: "bg-amber-50 text-amber-700" },
  recruitment_opportunity: { label: "Recruitment opportunity", chip: "bg-sky-50 text-sky-700" },
  watchlist: { label: "Watchlist", chip: "bg-slate-100 text-slate-600" },
};

export default function NetworkTab() {
  const [coverage, setCoverage] = useState(null);
  const [market, setMarket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    const [cov, mkt] = await Promise.allSettled([
      base44.functions.invoke("coverageStatus", {}),
      base44.functions.invoke("marketOpportunity", {}),
    ]);
    setCoverage(cov.status === "fulfilled" ? cov.value.data : null);
    setMarket(mkt.status === "fulfilled" ? mkt.value.data : null);
    if (cov.status === "rejected" && mkt.status === "rejected") {
      setError("Network data is unavailable right now — both sources failed to load.");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cities = market?.cities || [];
  const counts = {
    capacityCities: coverage?.verified_cities?.length ?? null,
    contractors: coverage ? Object.values(coverage.contractor_counts || {}).reduce((a, n) => a + n, 0) : null,
    matching: coverage?.matching_cities?.length ?? null,
    recruitment: cities.filter((c) => c.classification === "recruitment_opportunity").length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-slate-600 max-w-2xl">
          Verified contractor coverage, open matching activity and where the network needs reinforcement — counted from live partner, request and Search Console records, never estimated.
        </p>
        <button onClick={load} disabled={loading} className="shrink-0 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors disabled:opacity-60">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-2xl bg-white border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin mr-2 text-[#187B65]" /> Loading the network…
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card icon={CheckIcon} label="Cities with capacity" value={counts.capacityCities} note="Verified active contractors" />
            <Card icon={Users} label="Verified contractors" value={counts.contractors} note="Active partner records" />
            <Card icon={Radar} label="Matching cities" value={counts.matching} note="Requests open — no contractor yet" />
            <Card icon={Target} label="Recruitment opportunities" value={counts.recruitment} note="Real search interest, no contractor" tone="text-[#187B65]" />
          </div>

          {cities.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5">
              <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">City network map — evidence behind each classification</h3>
              <div className="mt-4 space-y-2">
                {cities.map((c) => {
                  const meta = CLASS_META[c.classification] || CLASS_META.watchlist;
                  return (
                    <div key={`${c.city}-${c.province_code}`} className="rounded-xl border border-slate-100 px-4 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-[#102B2A]">
                          {c.city}{c.province_code ? `, ${c.province_code}` : ""}
                        </span>
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${meta.chip}`}>{meta.label}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-slate-500">
                        <span>{c.verified_partners} verified partner{c.verified_partners === 1 ? "" : "s"}</span>
                        <span>{c.demand_requests} request{c.demand_requests === 1 ? "" : "s"} · {c.demand_completed} completed</span>
                        {c.search_interest_impressions !== null && (
                          <span>{c.search_interest_impressions} search impressions (Search Console)</span>
                        )}
                        {c.search_interest_impressions === null && <span>Search Console not connected — interest unmeasured</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {market?.definitions && (
            <div className="rounded-2xl bg-[#eef4f0] border border-[#187B65]/20 px-5 py-4 text-xs text-[#102B2A] leading-relaxed">
              <strong>Definitions:</strong>
              {Object.entries(market.definitions).map(([k, v]) => (
                <span key={k} className="block mt-0.5"><strong className="capitalize">{k.replace(/_/g, " ")}:</strong> {v}</span>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <QuickLink to="/admin/jobs" icon={MapPin} label="Jobs & Dispatch" note="Assign and manage live jobs" />
            <QuickLink to="/admin/partners" icon={Users} label="Partners" note="Verify and manage contractors" />
            <QuickLink to="/admin/national" icon={ExternalLink} label="National Ops" note="Nationwide requests & recruitment" />
          </div>
        </>
      )}
    </div>
  );
}

function Card({ icon: Icon, label, value, note, tone = "text-[#102B2A]" }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-4">
      <Icon className="w-4 h-4 text-[#187B65]" />
      <div className={`mt-2 text-xl font-extrabold tabular-nums ${tone}`}>{value === null ? "—" : value.toLocaleString("en-CA")}</div>
      <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</div>
      <div className="mt-0.5 text-[10px] text-slate-400">{note}</div>
    </div>
  );
}

function CheckIcon(props) {
  return <span className="w-4 h-4 rounded-full bg-[#187B65] text-white text-[9px] font-bold flex items-center justify-center" {...props}>✓</span>;
}

function QuickLink({ to, icon: Icon, label, note }) {
  return (
    <Link to={to} className="group rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-4 hover:border-[#187B65] transition-colors">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-[#187B65]" />
        <span className="text-sm font-bold text-[#102B2A] group-hover:text-[#187B65] transition-colors">{label}</span>
      </div>
      <p className="mt-1 text-[11px] text-slate-500">{note}</p>
    </Link>
  );
}