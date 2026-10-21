import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { provinceName } from "@/lib/geo";

function Tile({ label, value, accent }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
      <div className={`text-2xl font-bold ${accent || "text-[#102B2A]"}`}>{value}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}

export default function OverviewTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [total, unassigned, confirmed, completed, quotesSent, verifiedProviders, prospects, callbacks, revenue, bookingsConfirmed, bookingsCompleted, bookingRevenue, byProvince, byCity, verifiedByProvince] =
          await Promise.all([
            base44.entities.NationalRequest.count({}),
            base44.entities.NationalRequest.count({ status: { $in: ["new", "provider_matching", "recruiting"] } }),
            base44.entities.NationalRequest.count({ status: "confirmed" }),
            base44.entities.NationalRequest.count({ status: "completed" }),
            base44.entities.NationalRequest.count({ quote_status: "sent" }),
            base44.entities.ProviderRecruit.count({ verified: true }),
            base44.entities.ProviderRecruit.count({ partnership_status: { $in: ["prospect", "applying", "verifying"] } }),
            base44.entities.ProviderRecruit.count({ outreach_status: "callback_scheduled" }),
            base44.entities.PaypalTransaction.aggregate({ query: { status: { $in: ["paid", "active"] } }, sum: ["amount"] }),
            base44.entities.Booking.count({ status: { $in: ["confirmed", "scheduled"] } }),
            base44.entities.Booking.count({ status: "completed" }),
            base44.entities.Booking.aggregate({ query: { status: "completed" }, sum: ["job_value"] }),
            base44.entities.NationalRequest.aggregate({ groupBy: "province_code" }),
            base44.entities.NationalRequest.aggregate({ groupBy: "city" }),
            base44.entities.ProviderRecruit.aggregate({ query: { verified: true }, groupBy: "province_code" }),
          ]);
        setData({
          total, unassigned, confirmed, completed, quotesSent, verifiedProviders, prospects, callbacks,
          revenue: revenue?.rows?.[0]?.sum_amount || 0,
          bookingsConfirmed, bookingsCompleted,
          bookingRevenue: bookingRevenue?.rows?.[0]?.sum_amount || 0,
          byProvince: byProvince?.rows || [],
          byCity: byCity?.rows || [],
          verifiedByProvince: verifiedByProvince?.rows || [],
        });
      } catch {
        setError(true);
      }
    })();
  }, []);

  if (error) return <p className="text-sm text-red-600">Couldn't load national metrics. Try again.</p>;
  if (!data) {
    return <div className="flex items-center gap-2 text-slate-500 py-10"><Loader2 className="w-5 h-5 animate-spin" /> Loading national metrics…</div>;
  }

  const verifiedMap = Object.fromEntries(data.verifiedByProvince.map((r) => [r.province_code, r.count]));
  const topCities = [...data.byCity].filter((c) => c.city).sort((a, b) => b.count - a.count).slice(0, 10);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-400 mb-3">Live counts</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Tile label="National requests" value={data.total} />
          <Tile label="Unassigned requests" value={data.unassigned} accent={data.unassigned > 0 ? "text-amber-600" : undefined} />
          <Tile label="Confirmed bookings" value={data.confirmed + data.bookingsConfirmed} />
          <Tile label="Completed jobs" value={data.completed + data.bookingsCompleted} />
          <Tile label="Quotes awaiting approval" value={data.quotesSent} accent={data.quotesSent > 0 ? "text-amber-600" : undefined} />
          <Tile label="Revenue (transactions)" value={`$${Number(data.revenue).toLocaleString("en-CA")}`} />
          <Tile label="Verified providers" value={data.verifiedProviders} />
          <Tile label="Prospective providers" value={data.prospects} />
          <Tile label="Pending callbacks" value={data.callbacks} accent={data.callbacks > 0 ? "text-amber-600" : undefined} />
        </div>
        <p className="mt-2 text-xs text-slate-400">Job revenue from completed operator bookings: ${Number(data.bookingRevenue).toLocaleString("en-CA")}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
          <h3 className="font-bold text-[#102B2A] mb-3">Requests by province &amp; territory</h3>
          {data.byProvince.length === 0 ? (
            <p className="text-sm text-slate-500">No requests yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="py-1.5">Region</th>
                  <th className="py-1.5 text-right">Requests</th>
                  <th className="py-1.5 text-right">Verified providers</th>
                </tr>
              </thead>
              <tbody>
                {[...data.byProvince].sort((a, b) => b.count - a.count).map((r) => (
                  <tr key={r.province_code || "unknown"} className="border-t border-slate-100">
                    <td className="py-2 font-semibold text-[#102B2A]">{provinceName(r.province_code) || r.province_code || "Unspecified"}</td>
                    <td className="py-2 text-right">{r.count}</td>
                    <td className="py-2 text-right text-[#187B65] font-semibold">{verifiedMap[r.province_code] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm p-5">
          <h3 className="font-bold text-[#102B2A] mb-3">Top cities by request volume</h3>
          {topCities.length === 0 ? (
            <p className="text-sm text-slate-500">No requests yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 uppercase tracking-wide">
                  <th className="py-1.5">City</th>
                  <th className="py-1.5 text-right">Requests</th>
                </tr>
              </thead>
              <tbody>
                {topCities.map((r) => (
                  <tr key={r.city} className="border-t border-slate-100">
                    <td className="py-2 font-semibold text-[#102B2A]">{r.city}</td>
                    <td className="py-2 text-right">{r.count}</td>
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