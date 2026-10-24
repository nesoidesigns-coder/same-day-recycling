import { useEffect, useState } from "react";
import { Loader2, RefreshCw, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const fmtPct = (v) => (v === null || v === undefined ? "—" : `${v}%`);

const PERIODS = [
  { key: 7, label: "7 days" },
  { key: 30, label: "30 days" },
  { key: 90, label: "90 days" },
];

export default function AdminConversion() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("conversionFunnel", { days });
      setData(res.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [days]);

  const f = data?.funnel;
  const r = data?.rates;
  const m = data?.money;
  const stages = f && [
    { label: "Site visits", value: f.visits.current, prev: f.visits.previous, sub: "Page-loads, customer & contractor traffic — rates below use visitor sessions" },
    { label: "Quote leads", value: f.quote_leads.current, prev: f.quote_leads.previous, sub: `${f.quote_leads.booked} booked directly from a quote`, records: data.samples?.quote_leads },
    { label: "Booking requests", value: f.booking_requests.current, prev: f.booking_requests.previous, sub: `Submitted pickup requests${f.booking_requests.cancelled_excluded ? ` · ${f.booking_requests.cancelled_excluded} cancelled excluded` : ""}`, records: data.samples?.booking_requests },
    { label: "Confirmed", value: f.confirmed.current, prev: f.confirmed.previous, sub: "Accepted and scheduled jobs", records: data.samples?.confirmed },
    { label: "Completed", value: f.completed.current, prev: f.completed.previous, sub: "Jobs finished on site", records: data.samples?.completed },
    { label: "Paid", value: f.paid.platform + f.paid.external, prev: f.paid.previous, sub: `${f.paid.platform} platform · ${f.paid.external} external settled`, records: data.samples?.paid },
  ];
  const rates = r && [
    { cur: fmtPct(r.visit_to_lead_pct), prev: data.rates_prev?.visit_to_lead_pct, conf: data.confidence?.visit_to_lead },
    { cur: fmtPct(r.lead_to_booking_pct), prev: data.rates_prev?.lead_to_booking_pct, conf: data.confidence?.lead_to_booking },
    { cur: fmtPct(r.booking_to_confirmed_pct), prev: data.rates_prev?.booking_to_confirmed_pct, conf: data.confidence?.booking_to_confirmed },
    { cur: fmtPct(r.confirmed_to_completed_pct), prev: data.rates_prev?.confirmed_to_completed_pct, conf: data.confidence?.confirmed_to_completed },
    null,
  ];
  const maxVal = stages ? Math.max(...stages.map((s) => s.value), 1) : 1;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#102B2A]">Conversion Funnel</h1>
          <p className="text-sm text-slate-600 mt-1 max-w-xl">
            Proof that traffic becomes paying jobs — counted from live booking and payment records, never estimated.
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

      {loading && !data ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading the funnel…
        </div>
      ) : error ? (
        <div className="mt-8 rounded-2xl bg-white border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>
      ) : data ? (
        <>
          <div className="mt-6 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
            {stages.map((s, i) => (
              <div key={s.label} className={i > 0 ? "mt-5 pt-5 border-t border-slate-100" : ""}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-sm font-bold text-[#102B2A]">{s.label}</span>
                  <span className="text-lg font-extrabold text-[#187B65]">{s.value.toLocaleString("en-CA")}</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                  <div className="rounded-full bg-[#187B65] h-full transition-all duration-500" style={{ width: `${Math.max((s.value / maxVal) * 100, s.value > 0 ? 2 : 0)}%` }} />
                </div>
                {s.records && s.records.length > 0 && (
                  <button onClick={() => setDetail({ label: s.label, rows: s.records })} className="mt-1.5 text-[11px] font-bold text-[#187B65] hover:underline">
                    View underlying records
                  </button>
                )}
                <div className="mt-1.5 flex flex-wrap justify-between gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-500">
                  <span>{s.sub}</span>
                  <span className="inline-flex flex-wrap items-center gap-3">
                    {rates[i] && (
                      <>
                        <span className="font-bold text-[#187B65]">{rates[i].cur} from previous stage</span>
                        {(rates[i].prev === 0 || rates[i].prev) && <span>prev period: {rates[i].prev}</span>}
                        {rates[i].conf && rates[i].conf !== "high" && (
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${rates[i].conf === "medium" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-500"}`}>{rates[i].conf} confidence</span>
                        )}
                      </>
                    )}
                    {s.prev !== undefined && <span>prev period: {s.prev.toLocaleString("en-CA")}</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {f.visits.by_class && (
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <ClassCard label="Customer traffic" value={f.visits.by_class.customer} note="Exploring services & quotes" />
              <ClassCard label="Contractor traffic" value={f.visits.by_class.contractor} note="Partnership & software pages" />
              <ClassCard label="Owner activity" value={f.visits.by_class.owner} note="Your testing & admin" />
              <ClassCard label="Bot traffic" value={f.visits.by_class.bot} note="Crawlers & automated" />
              <ClassCard label="Unclassified (historical)" value={f.visits.by_class.unclassified} note="Excluded from the funnel" />
            </div>
          )}

          {data.journeys && (
            <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
              <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">Journey attribution — visit origin behind this period's conversions</h2>
              <p className="mt-1 text-xs text-slate-500 mb-4">Each booking and quote lead is linked back to the visit that started its session (traffic source, visitor country, service page viewed) via an anonymous browser-session key. "unlinked" = submitted before session tracking existed.</p>
              <div className="grid sm:grid-cols-2 gap-4">
                <JourneyList title="Bookings by traffic source" rows={data.journeys.bookings_by_source} />
                <JourneyList title="Bookings by visitor country" rows={data.journeys.bookings_by_country} />
                <JourneyList title="Quote leads by traffic source" rows={data.journeys.quote_leads_by_source} />
                <div className="rounded-2xl bg-slate-50 px-4 py-4 text-xs text-slate-600 leading-relaxed">
                  Linked journeys this period: <strong>{data.journeys.linked_bookings}</strong> of {f.booking_requests.current} bookings ({fmtPct(data.journeys.linked_booking_pct)}) and <strong>{data.journeys.linked_quote_leads}</strong> of {f.quote_leads.current} quote leads ({fmtPct(data.journeys.linked_lead_pct)}). Country is inferred from device timezone (Canada vs outside Canada), not precise geolocation.
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <MoneyCard label="Completed job value" value={money(m.completed_job_value)} note="All completed jobs, incl. externally settled" />
            <MoneyCard label="Platform-processed" value={money(m.platform_paid_value)} note="Paid through this platform" />
            <MoneyCard label="Externally settled" value={money(m.external_paid_value)} note={m.external_unverified_value > 0 ? `${money(m.external_unverified_value)} awaiting reconciliation` : "All reconciled by the owner"} />
            <MoneyCard label="Platform commission earned" value={money(m.commission_earned)} note="From completed platform jobs" />
          </div>

          <div className="mt-5 rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500 mb-4">Geographic demand — top cities this period</h2>
            {data.cities.length === 0 ? (
              <p className="text-sm text-slate-500">No booking requests in this period yet.</p>
            ) : (
              <div className="overflow-x-auto">
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
                    {data.cities.map((c) => (
                      <tr key={c.city} className="border-t border-slate-100">
                        <td className="py-2.5 pr-4 font-semibold text-[#102B2A]">{c.city}</td>
                        <td className="py-2.5 pr-4">{c.requests}</td>
                        <td className="py-2.5 pr-4">{c.completed}</td>
                        <td className="py-2.5 font-semibold text-[#187B65]">{money(c.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-5 rounded-2xl bg-[#eef4f0] border border-[#187B65]/20 px-5 py-4 text-xs text-[#102B2A] leading-relaxed">
            <strong>How each stage is counted:</strong> visits from the visit tracker; quote leads from captured quote requests;
            bookings from real booking records (internal test records excluded); paid jobs split between platform-processed
            payments and payments settled outside the platform (cash, e-transfer, contractor checkout), which stay pending
            owner reconciliation until verified. Live event-level activity (quote calculations, booking submissions) streams
            into Analytics alongside this page.
          </div>
          {data.freshness && (
            <p className="mt-3 text-xs text-slate-500">
              Data freshness: report generated {new Date(data.generated_at).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })}
              {data.freshness.session_tracking_started ? ` · anonymous session tracking live since ${new Date(data.freshness.session_tracking_started).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" })} — earlier page-loads are historical records without session keys.` : ""}
            </p>
          )}
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <Users className="w-3.5 h-3.5" /> Partner-level conversion stats for contractors live in the Partner portal —
            <Link to="/admin/partners" className="font-bold text-[#187B65] hover:underline">open Partners</Link>
          </div>
          {data.truncated && (
            <p className="mt-3 text-xs font-semibold text-amber-700">Period volume exceeds one data page — older records in this range may be omitted.</p>
          )}
        </>
      ) : null}

      {detail && <StageModal detail={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

function StageModal({ detail, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-[#102B2A]/40 sm:p-4" onClick={onClose} role="dialog" aria-label={`${detail.label} records`}>
      <div className="w-full sm:max-w-lg max-h-[80vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#102B2A]">{detail.label} — underlying records</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-[#102B2A]" aria-label="Close">✕</button>
        </div>
        <p className="mt-1 text-[11px] text-slate-500">Newest real records behind this stage in the selected period. Test bookings and cancelled requests are never counted in stage totals.</p>
        <div className="mt-3 space-y-2">
          {detail.rows.map((row) => (
            <div key={row.ref} className="rounded-xl border border-slate-100 px-3 py-2 text-xs">
              <div className="flex justify-between gap-2">
                <span className="font-bold text-[#102B2A]">{row.label || "(no name captured)"}</span>
                <span className="text-slate-500">{(row.at || "").slice(0, 10)}</span>
              </div>
              <div className="mt-0.5 text-[11px] text-slate-500">Ref …{String(row.ref).slice(-8)}{row.city ? ` · ${row.city}` : ""} · status: {row.status || "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ClassCard({ label, value, note }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-[#102B2A]">{(Number(value) || 0).toLocaleString("en-CA")}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{note}</div>
    </div>
  );
}

function JourneyList({ title, rows }) {
  const max = Math.max(...(rows || []).map(([, n]) => n), 1);
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</div>
      {(rows || []).length === 0 ? (
        <p className="mt-2 text-xs text-slate-500">No records in this period.</p>
      ) : (
        <div className="mt-2 space-y-1.5">
          {rows.map(([k, n]) => (
            <div key={k}>
              <div className="flex justify-between text-xs"><span className="font-semibold text-[#102B2A]">{k}</span><span>{n}</span></div>
              <div className="mt-0.5 h-1.5 rounded-full bg-slate-200 overflow-hidden"><div className="h-full rounded-full bg-[#187B65]" style={{ width: `${Math.max((n / max) * 100, 3)}%` }} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MoneyCard({ label, value, note }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-[#102B2A]">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{note}</div>
    </div>
  );
}