import { MapPin } from "lucide-react";

const CLASS_META = {
  confirmed_capacity: { label: "Confirmed capacity", tone: "bg-[#187B65] text-white", desc: "Verified active contractor accepts jobs here today" },
  matching_territory: { label: "Matching territory", tone: "bg-amber-500 text-white", desc: "Real requests accepted, pending contractor matching" },
  recruitment_opportunity: { label: "Recruitment", tone: "bg-sky-500 text-white", desc: "Real search interest, no contractor yet" },
};

// Market Opportunity Engine panel: demand vs confirmed capacity per city.
// Potential demand is always separated from confirmed service capacity.
export default function MarketOpportunityPanel({ market, loading }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 inline-flex items-center gap-2">
        <MapPin className="w-4 h-4 text-[#187B65]" /> Market Opportunity Engine
      </h2>
      {loading ? (
        <p className="text-sm text-slate-500">Loading market data…</p>
      ) : !market?.cities?.length ? (
        <p className="text-sm text-slate-600">No demand signals or coverage data yet — cities appear here as real requests or search impressions arrive.</p>
      ) : (
        <>
          <div className="flex flex-wrap gap-3 mb-4 text-[11px]">
            {Object.entries(CLASS_META).map(([k, m]) => (
              <span key={k} className="inline-flex items-center gap-1.5 text-slate-600">
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${m.tone}`}>{m.label}</span>
                {m.desc}
              </span>
            ))}
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-4">City</th>
                <th className="py-2 pr-4 text-right">Requests</th>
                <th className="py-2 pr-4 text-right">Completed</th>
                <th className="py-2 pr-4 text-right">Verified partners</th>
                <th className="py-2 pr-4 text-right">Search impressions</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {market.cities.map((c) => {
                const m = CLASS_META[c.classification];
                return (
                  <tr key={c.city} className="border-t border-slate-100">
                    <td className="py-2.5 pr-4 font-semibold text-[#102B2A]">{c.city}{c.province_code ? `, ${c.province_code}` : ""}</td>
                    <td className="py-2.5 pr-4 text-right">{c.demand_requests}</td>
                    <td className="py-2.5 pr-4 text-right">{c.demand_completed}</td>
                    <td className="py-2.5 pr-4 text-right">{c.verified_partners}</td>
                    <td className="py-2.5 pr-4 text-right">{c.search_interest_impressions === null ? "—" : c.search_interest_impressions}</td>
                    <td className="py-2.5 text-right">
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${m ? m.tone : "bg-slate-100 text-slate-500"}`}>
                        {m ? m.label : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!market.search_connected && (
            <p className="mt-3 text-[11px] text-slate-500">Search-interest column unavailable (Search Console not connected) — demand and capacity figures are unaffected.</p>
          )}
        </>
      )}
    </div>
  );
}