import { useEffect, useState } from "react";
import { Loader2, Target } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { provinceName, SERVICE_TYPES } from "@/lib/geo";
import { COVERAGE } from "@/lib/coverage";

// Contractor sales intelligence — genuine demand by location, computed from
// real inquiry records only. Nothing here is estimated or fabricated.
export default function SalesIntelligenceTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [byCity, byService, total, unfulfilled, fulfilled, pipeline, recruits, licenses, reqPage] = await Promise.all([
          base44.entities.NationalRequest.aggregate({ groupBy: "city" }),
          base44.entities.NationalRequest.aggregate({ groupBy: "service_type" }),
          base44.entities.NationalRequest.count({}),
          base44.entities.NationalRequest.count({ status: { $in: ["new", "provider_matching", "recruiting"] } }),
          base44.entities.NationalRequest.count({ status: { $in: ["matched", "confirmed", "completed"] } }),
          base44.entities.NationalRequest.aggregate({ query: { quote_amount: { $gt: 0 } }, sum: ["quote_amount"] }),
          base44.entities.ProviderRecruit.filter({}, { limit: 500 }),
          base44.entities.SoftwareLicense.count({ status: { $in: ["active", "setup_paid"] } }),
          base44.entities.NationalRequest.filter({}, { limit: 500 }),
        ]);
        const recruitRows = recruits?.items || recruits || [];
        const reqs = reqPage?.items || reqPage || [];
        const verifiedTerritories = new Set(recruitRows.filter((r) => r.verified).map((r) => (r.territory || "").toLowerCase().trim()));
        const opCities = new Set(COVERAGE.filter((c) => c.status === "active").map((c) => c.name.toLowerCase()));
        const cityProvince = {};
        reqs.forEach((r) => { if (r.city && r.province_code && !cityProvince[r.city]) cityProvince[r.city] = r.province_code; });
        const cityRows = (byCity?.rows || []).filter((c) => c.city).sort((a, b) => b.count - a.count);
        const opportunities = cityRows.filter(
          (c) => !opCities.has(c.city.toLowerCase()) && !verifiedTerritories.has(c.city.toLowerCase())
        );
        const emailCounts = {};
        reqs.forEach((r) => { if (r.email) emailCounts[r.email.toLowerCase()] = (emailCounts[r.email.toLowerCase()] || 0) + 1; });
        const repeatCustomers = Object.values(emailCounts).filter((n) => n > 1).length;
        setData({
          cityRows, cityProvince,
          byService: (byService?.rows || []).filter((s) => s.service_type).sort((a, b) => b.count - a.count),
          total, unfulfilled, fulfilled,
          pipelineValue: pipeline?.rows?.[0]?.sum_quote_amount || 0,
          verifiedCount: recruitRows.filter((r) => r.verified).length,
          licenses, opportunities, repeatCustomers,
        });
      } catch {
        setError(true);
      }
    })();
  }, []);

  if (error) return <p className="text-sm text-red-600">Couldn't load sales intelligence. Try again.</p>;
  if (!data) return <div className="flex items-center gap-2 text-slate-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading demand intelligence…</div>;

  const matchRate = data.total ? Math.round((data.fulfilled / data.total) * 100) : 0;
  const softwareRate = data.verifiedCount ? Math.round((data.licenses / data.verifiedCount) * 100) : null;
  const serviceLabel = (v) => SERVICE_TYPES.find((s) => s.value === v)?.label || v;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-400 mb-3">Demand funnel (real records only)</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Customer inquiries", value: data.total },
            { label: "Unfulfilled requests", value: data.unfulfilled },
            { label: "Inquiry-to-contractor", value: `${matchRate}%` },
            { label: "Pipeline value (quoted)", value: `$${Number(data.pipelineValue).toLocaleString("en-CA")}` },
            { label: "Verified contractors", value: data.verifiedCount },
            { label: "Contractor-to-software-sale", value: softwareRate === null ? "—" : `${softwareRate}%` },
            { label: "Software licenses (active)", value: data.licenses },
            { label: "Repeat customer interest", value: data.repeatCustomers },
          ].map((t) => (
            <div key={t.label} className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
              <div className="text-2xl font-bold text-[#102B2A]">{t.value}</div>
              <div className="text-xs text-slate-500 mt-1">{t.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-400 mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-[#187B65]" /> Contractor outreach opportunities — demand without a verified contractor
        </h2>
        {data.opportunities.length === 0 ? (
          <p className="text-sm text-slate-500">No uncovered demand yet. Opportunities appear here automatically when a city accumulates inquiries without a verified contractor.</p>
        ) : (
          <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="px-4 py-2.5">City</th>
                  <th className="px-4 py-2.5">Inquiries</th>
                  <th className="px-4 py-2.5">Outreach play</th>
                </tr>
              </thead>
              <tbody>
                {data.opportunities.map((o) => (
                  <tr key={o.city} className="border-t border-slate-100">
                    <td className="px-4 py-2.5 font-bold text-[#102B2A]">{o.city}{o.cityProvince[o.city] ? `, ${o.cityProvince[o.city]}` : ""}</td>
                    <td className="px-4 py-2.5 font-semibold text-amber-600">{o.count}</td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">Approach local companies with this recorded demand, then pitch Same Day Recycling software for job intake and dispatch.</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
          <h3 className="font-bold text-[#102B2A] mb-3">Requested services</h3>
          {data.byService.length === 0 ? (
            <p className="text-sm text-slate-500">No inquiries yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.byService.map((s) => (
                  <tr key={s.service_type} className="border-t border-slate-100 first:border-t-0">
                    <td className="py-2 font-semibold text-[#102B2A]">{serviceLabel(s.service_type)}</td>
                    <td className="py-2 text-right">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
          <h3 className="font-bold text-[#102B2A] mb-3">Demand by city</h3>
          {data.cityRows.length === 0 ? (
            <p className="text-sm text-slate-500">No inquiries yet.</p>
          ) : (
            <table className="w-full text-sm">
              <tbody>
                {data.cityRows.slice(0, 12).map((c) => (
                  <tr key={c.city} className="border-t border-slate-100 first:border-t-0">
                    <td className="py-2 font-semibold text-[#102B2A]">{c.city}{data.cityProvince[c.city] ? `, ${data.cityProvince[c.city]}` : ""}</td>
                    <td className="py-2 text-right">{c.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}