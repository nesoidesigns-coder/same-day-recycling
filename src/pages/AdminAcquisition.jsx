import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Users, ClipboardCheck, DollarSign, MapPin, Filter } from "lucide-react";
import { base44 } from "@/api/base44Client";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const fmtPct = (v) => (v === null || v === undefined ? "—" : `${v}%`);

const PERIODS = [
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
  { key: 90, label: "90 days" },
];

// Customer Acquisition: business growth only — owner testing and bot
// traffic are excluded from every number on this page.
export default function AdminAcquisition() {
  const [days, setDays] = useState(30);
  const [funnel, setFunnel] = useState(null);
  const [traffic, setTraffic] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [f, t] = await Promise.all([
        base44.functions.invoke("conversionFunnel", { days }),
        base44.functions.invoke("visitStats", {}),
      ]);
      setFunnel(f.data);
      setTraffic(t.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);

  const f = funnel?.funnel;
  const r = funnel?.rates;
  const cls = f?.visits.by_class || {};
  const realVisits = (cls.customer || 0) + (cls.contractor || 0);
  const source = days === 7 ? traffic?.visits_7d : traffic?.visits_30d;

  const kpis = f && [
    { label: "Genuine customer bookings", value: f.booking_requests.current, icon: Users, sub: "Real records only — internal tests excluded" },
    { label: "Confirmed jobs", value: f.confirmed.current, icon: ClipboardCheck, sub: "Accepted and scheduled" },
    { label: "Completed jobs", value: f.completed.current, icon: Filter, sub: `${f.paid.platform} platform · ${f.paid.external} external settled` },
    { label: "Revenue from completed jobs", value: money(funnel.money.completed_job_value), icon: DollarSign, sub: `Commission earned: ${money(funnel.money.commission_earned)}` },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#102B2A]">Customer Acquisition</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Actual business growth: customers finding the site, requesting quotes and booking jobs. Your own admin
            activity and bot crawlers are counted separately and excluded here.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full bg-white border border-slate-200 p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setDays(p.key)}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold ${days === p.key ? "bg-[#102B2A] text-white" : "text-slate-600 hover:text-[#102B2A]"}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={load} disabled={loading} className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#187B65] transition-colors" aria-label="Refresh">
            <RefreshCw className={`w-4 h-4 text-[#102B2A] ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {loading && !funnel ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading acquisition data…
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl bg-white border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>
      ) : funnel ? (
        <>
          {/* Real vs test: the growth numbers below exclude every test record. */}
          <div className="mt-6 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">
              Real business growth vs test activity
            </h2>
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <div className="rounded-2xl bg-[#eef4f0] border border-[#187B65]/25 px-4 py-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#187B65]">Real customer bookings</div>
                <div className="mt-1 text-3xl font-extrabold text-[#102B2A]">{f.booking_requests.current}</div>
                <div className="text-[11px] text-slate-500 mt-1">Previous period: {f.booking_requests.previous}</div>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-4 py-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Test records (excluded)</div>
                <div className="mt-1 text-3xl font-extrabold text-slate-500">{funnel.tests.current}</div>
                <div className="text-[11px] text-slate-500 mt-1">Previous period: {funnel.tests.previous}</div>
              </div>
            </div>
            {funnel.tests.records.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-4">Reference</th>
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">City</th>
                    <th className="py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {funnel.tests.records.map((t) => (
                    <tr key={t.ref} className="border-t border-slate-100">
                      <td className="py-2.5 pr-4 font-mono text-xs text-slate-500">{t.ref}</td>
                      <td className="py-2.5 pr-4 text-[#102B2A]">{t.name || "—"}</td>
                      <td className="py-2.5 pr-4">{t.city || "—"}</td>
                      <td className="py-2.5 capitalize text-slate-600">{t.status || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-500">No test bookings created in this period.</p>
            )}
          </div>

          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-4">
                <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <k.icon className="w-3.5 h-3.5 text-[#187B65]" /> {k.label}
                </div>
                <div className="mt-1 text-2xl font-extrabold text-[#102B2A]">{k.value}</div>
                <div className="mt-0.5 text-[11px] text-slate-500">{k.sub}</div>
              </div>
            ))}
          </div>

          <div className="mt-5 grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Real traffic this period</h2>
              <div className="space-y-4">
                <TrafficRow label="Customer visits" value={cls.customer || 0} total={realVisits} color="#187B65" note="Exploring services & requesting quotes" />
                <TrafficRow label="Contractor visits" value={cls.contractor || 0} total={realVisits} color="#54D9AE" note="Providers exploring partnerships & software" />
                <TrafficRow label="Quote leads" value={f.quote_leads.current} total={Math.max(realVisits, 1)} color="#102B2A" note={`${fmtPct(r.visit_to_lead_pct)} of real visits become quotes`} />
              </div>
              <div className="mt-4 rounded-xl bg-[#eef4f0] px-4 py-3 text-[11px] text-[#102B2A] leading-relaxed">
                Excluded from this page: {cls.owner || 0} owner visits (your testing & admin) and {cls.bot || 0} bot
                visits (crawlers & automated). Unclassified legacy visits: {cls.unclassified || 0}.
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">
                Where real visits came from ({days === 7 ? "7" : "30"} days)
              </h2>
              <div className="space-y-4">
                <TrafficRow label="Search" value={source?.search || 0} total={source?.total || 0} color="#187B65" />
                <TrafficRow label="Facebook" value={source?.facebook || 0} total={source?.total || 0} color="#54D9AE" />
                <TrafficRow label="Direct" value={source?.direct || 0} total={source?.total || 0} color="#102B2A" />
                <TrafficRow label="Referral / other" value={source?.other || 0} total={source?.total || 0} color="#94a3b8" />
              </div>
              <div className="mt-4 text-[11px] text-slate-500">
                Conversion: {fmtPct(r.lead_to_booking_pct)} of quote leads became bookings ·{" "}
                {fmtPct(r.booking_to_confirmed_pct)} of bookings confirmed.
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 inline-flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#187B65]" /> Customer demand by city
            </h2>
            {funnel.cities.length === 0 ? (
              <p className="text-sm text-slate-500">No customer booking requests in this period yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-2 pr-4">City</th>
                    <th className="py-2 pr-4">Requests</th>
                    <th className="py-2 pr-4">Completed</th>
                    <th className="py-2">Job value</th>
                  </tr>
                </thead>
                <tbody>
                  {funnel.cities.map((c) => (
                    <tr key={c.city} className="border-t border-slate-100">
                      <td className="py-2.5 pr-4 font-semibold text-[#102B2A]">{c.city}</td>
                      <td className="py-2.5 pr-4">{c.requests}</td>
                      <td className="py-2.5 pr-4">{c.completed}</td>
                      <td className="py-2.5 font-semibold text-[#187B65]">{money(c.value)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

        </>
      ) : null}
    </div>
  );
}

function TrafficRow({ label, value, total, color, note }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-bold text-[#102B2A]">{label}</span>
        <span className="text-sm font-extrabold text-[#187B65]">{Number(value).toLocaleString("en-CA")}</span>
      </div>
      <div className="mt-1.5 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${Math.max(pct, value > 0 ? 2 : 0)}%`, backgroundColor: color }} />
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-slate-500">
        <span>{note}</span>
        <span>{pct}%</span>
      </div>
    </div>
  );
}