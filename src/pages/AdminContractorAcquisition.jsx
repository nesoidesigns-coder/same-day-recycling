import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, MapPin, Quote, ClipboardCheck, Truck, Users, Percent, Sparkles } from "lucide-react";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const fmt = (v, unit = "") => (v === null || v === undefined || v === "" ? "—" : `${v}${unit}`);

const rows = (res) => (res?.rows || []);

// City-level contractor acquisition intelligence: verified historical results
// (live records only) clearly separated from Rex's projected market
// opportunity. Nothing on this page is ever advertised as guaranteed work.
export default function AdminContractorAcquisition() {
  const [data, setData] = useState(null);
  const [projection, setProjection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [quoteAll, quoteBooked, natlAll, natlDone, jobs, done, partners, verified] = await Promise.all([
        base44.entities.QuoteLead.aggregate({ groupBy: "city" }),
        base44.entities.QuoteLead.aggregate({ query: { status: "booked" }, groupBy: "city" }),
        base44.entities.NationalRequest.aggregate({ query: { record_type: "service" }, groupBy: "city" }),
        base44.entities.NationalRequest.aggregate({ query: { record_type: "service", status: "completed" }, groupBy: "city" }),
        base44.entities.Booking.aggregate({ query: { record_type: "service" }, groupBy: "city", sum: ["job_value"] }),
        base44.entities.Booking.aggregate({ query: { record_type: "service", assignment_status: { $in: ["completed", "paid"] } }, groupBy: "city", sum: ["final_invoice"] }),
        base44.entities.Partner.aggregate({ groupBy: "city" }),
        base44.entities.Partner.aggregate({ query: { verified: true }, groupBy: "city" }),
      ]);
      const index = {};
      const touch = (city) => { if (city) { index[city] = index[city] || { city, inquiries: 0, quotes_booked: 0, requests: 0, requests_completed: 0, jobs: 0, completed: 0, job_value: 0, completed_value: 0, partners: 0, verified_partners: 0 }; } };
      for (const r of rows(quoteAll)) { touch(r.city); index[r.city].inquiries = r.count || 0; }
      for (const r of rows(quoteBooked)) { touch(r.city); index[r.city].quotes_booked = r.count || 0; }
      for (const r of rows(natlAll)) { touch(r.city); index[r.city].requests = r.count || 0; }
      for (const r of rows(natlDone)) { touch(r.city); index[r.city].requests_completed = r.count || 0; }
      for (const r of rows(jobs)) { touch(r.city); index[r.city].jobs = r.count || 0; index[r.city].job_value = r.sum_job_value || 0; }
      for (const r of rows(done)) { touch(r.city); index[r.city].completed = r.count || 0; index[r.city].completed_value = r.sum_final_invoice || 0; }
      for (const r of rows(partners)) { touch(r.city); index[r.city].partners = r.count || 0; }
      for (const r of rows(verified)) { touch(r.city); index[r.city].verified_partners = r.count || 0; }
      const cities = Object.values(index).sort((a, b) => (b.inquiries + b.requests) - (a.inquiries + a.requests));
      setData({ cities });

      try {
        const m = await base44.functions.invoke("marketOpportunity", {});
        setProjection(m.data || null);
      } catch {
        setProjection(null);
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const rate = (num, den) => (den > 0 ? `${Math.round((num / den) * 100)}%` : "—");

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#102B2A]">Contractor Acquisition Intelligence</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl">
            City-level funnel from verified customer inquiries to completed jobs, with live contractor capacity. Historical
            figures come from actual records only; the projection panel is Rex's estimate and is never advertised as guaranteed work.
          </p>
        </div>
        <button onClick={load} className="p-2.5 rounded-full bg-white border border-slate-200 hover:border-[#187B65] transition-colors" aria-label="Refresh">
          <RefreshCw className={`w-4 h-4 text-[#102B2A] ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !data ? (
        <div className="flex items-center justify-center py-24 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading city funnel…</div>
      ) : error ? (
        <div className="mt-8 rounded-2xl bg-white border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>
      ) : (
        <>
          <div className="mt-6 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4 inline-flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#187B65]" /> Verified historical results by city
            </h2>
            {data.cities.length === 0 ? (
              <p className="text-sm text-slate-500">No customer inquiries recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[860px]">
                  <thead>
                    <tr className="text-left text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2 pr-4"><Quote className="w-3 h-3 inline mr-1" />Inquiries</th>
                      <th className="py-2 pr-4">City</th>
                      <th className="py-2 pr-4">Qualified opportunities</th>
                      <th className="py-2 pr-4"><ClipboardCheck className="w-3 h-3 inline mr-1" />Booked jobs</th>
                      <th className="py-2 pr-4">Completed</th>
                      <th className="py-2 pr-4">Job value (actual)</th>
                      <th className="py-2 pr-4"><Users className="w-3 h-3 inline mr-1" />Capacity</th>
                      <th className="py-2"><Percent className="w-3 h-3 inline mr-1" />Inquiry → booked</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.cities.map((c) => {
                      const booked = c.jobs + c.requests;
                      const inquiries = c.inquiries + c.requests;
                      return (
                        <tr key={c.city} className="border-t border-slate-100">
                          <td className="py-2.5 pr-4 font-bold text-[#102B2A]">{c.city}</td>
                          <td className="py-2.5 pr-4">{c.inquiries}</td>
                          <td className="py-2.5 pr-4">{inquiries - c.quotes_booked - (c.requests_completed) > 0 ? inquiries - c.quotes_booked : 0} open</td>
                          <td className="py-2.5 pr-4">{booked}</td>
                          <td className="py-2.5 pr-4">{c.completed + c.requests_completed}</td>
                          <td className="py-2.5 pr-4 font-semibold text-[#187B65]">{money(Math.max(c.job_value, c.completed_value))}</td>
                          <td className="py-2.5 pr-4">{c.verified_partners}/{c.partners} verified</td>
                          <td className="py-2.5">{rate(booked, inquiries)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <p className="mt-3 text-[11px] text-slate-500">
              Inquiries = quote requests; booked = bookings + national requests (internal test records excluded); capacity = contractors on file
              (verified/total). All figures are recorded actuals.
            </p>
          </div>

          <div className="mt-5 rounded-3xl bg-white border border-amber-200 shadow-sm p-5 md:p-7">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-amber-700 mb-4 inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" /> Projected market opportunity — Rex estimate, not verified demand
            </h2>
            {!projection ? (
              <p className="text-sm text-slate-500">No projection available right now. Run the Market Opportunity Engine in Brand &amp; Market Intelligence to generate one.</p>
            ) : Array.isArray(projection.opportunities) && projection.opportunities.length ? (
              <div className="grid md:grid-cols-2 gap-3">
                {projection.opportunities.slice(0, 6).map((o, i) => (
                  <div key={i} className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3.5">
                    <div className="font-bold text-[#102B2A] text-sm">{o.city || o.market || o.title || "Opportunity"}</div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{o.rationale || o.reasoning || o.notes || o.summary || ""}</p>
                  </div>
                ))}
              </div>
            ) : (
              <pre className="text-xs text-slate-600 whitespace-pre-wrap">{JSON.stringify(projection, null, 2).slice(0, 1500)}</pre>
            )}
            <p className="mt-3 text-[11px] text-slate-500">
              Projections model potential demand — they are not historical results and never support a promise of guaranteed work.
            </p>
          </div>
        </>
      )}
    </div>
  );
}