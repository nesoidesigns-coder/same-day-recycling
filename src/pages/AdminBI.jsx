import { useState, useEffect } from "react";
import { Loader2, RefreshCw, Users, Target, TrendingUp, Wrench, Activity, Globe, Bot, ShieldCheck, UserCheck, MousePointerClick, CalendarCheck, CircleDollarSign, Truck, AlertTriangle, CheckCircle2, Info, Wallet, MapPin, Repeat2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

// Live Business Intelligence — one dashboard, one shared calculation layer.
// Every number comes from real records; uncertain values are labelled as such.
// Mobile-first, tabbed: Acquisition / Traffic / Performance / Development.

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");
const num = (n) => (Number(n) || 0).toLocaleString("en-CA");
const pctLabel = (v) => (v === null || v === undefined ? "—" : `${v}%`);

const TABS = [
  { key: "acquisition", label: "Acquisition", icon: Users },
  { key: "traffic", label: "Traffic", icon: Globe },
  { key: "performance", label: "Performance", icon: TrendingUp },
  { key: "development", label: "Development", icon: Wrench },
];

const SOURCE_LABELS = {
  direct: "Direct / unknown",
  search: "Search (Google/Bing)",
  facebook: "Facebook & Instagram",
  ai_search: "AI search referrals",
  google_business: "Google Business Profile",
  other: "External referrals",
};

export default function AdminBI() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("acquisition");

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("businessIntel", {});
      setData(res.data);
      setError("");
    } catch (e) {
      setError(e?.message || "Could not load business intelligence.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const a = data?.acquisition;
  const t = data?.traffic;
  const p = data?.performance;
  const dev = data?.development;
  const integrity = data?.integrity;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#102B2A] flex items-center gap-2"><Activity className="w-6 h-6 text-[#187B65]" /> Live Business Intelligence</h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">One consistent calculation layer behind every analytics dashboard. Real records only — browsing, intent, bookings and payments are never mixed up, and uncertain traffic is labelled rather than guessed.</p>
        </div>
        <button onClick={load} disabled={loading} className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors disabled:opacity-60">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && <div className="rounded-2xl bg-white border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>}

      {loading && !data ? (
        <div className="flex items-center justify-center py-20 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2 text-[#187B65]" /> Loading business intelligence…
        </div>
      ) : data && (
        <>
          {/* Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
            {TABS.map((tb) => (
              <button key={tb.key} onClick={() => setTab(tb.key)}
                className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition-colors ${tab === tb.key ? "bg-[#102B2A] text-white" : "bg-white border border-slate-200 text-slate-600 hover:text-[#102B2A]"}`}>
                <tb.icon className="w-3.5 h-3.5" /> {tb.label}
              </button>
            ))}
          </div>

          {tab === "acquisition" && a && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                <Metric icon={Users} label="Visitor sessions (30d)" value={num(t.sessions)} sub={`${num(a.human_visits)} page-loads — historical page-loads without a session key are excluded from visitor counts`} />
                <Metric icon={Target} label="Customer-intent visits" value={num(a.intent_visits)} sub={`${num(a.intent_sessions)} intent session(s)`} tone="text-[#187B65]" />
                <Metric icon={UserCheck} label="Qualified leads" value={num(a.qualified_leads)} sub="Captured quote requests" />
                <Metric icon={CalendarCheck} label="Confirmed bookings" value={num(a.confirmed_bookings)} sub="Counted once · tests & cancels excluded" />
                <Metric icon={CircleDollarSign} label="Completed payments" value={num(a.completed_payments)} sub={`${money(a.revenue_collected)} collected`} />
                <Metric icon={TrendingUp} label="Conversion rate" value={pctLabel(a.conversion.visit_to_booking_pct)} sub={`Per visitor session · ${pctLabel(a.conversion.intent_session_to_booking_pct)} of intent sessions book`} />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-[#102B2A]">Browsing vs buying intent</h2>
                <p className="mt-1 text-[11px] text-slate-500">A visit alone is never counted as customer activity. Intent = service pages, availability, pricing, quote/booking start or job tracking.</p>
                <div className="mt-3 h-3 rounded-full bg-slate-100 overflow-hidden flex" role="img" aria-label={`Browsing ${num(a.browsing_vs_intent.browsing)}, intent ${num(a.browsing_vs_intent.intent)}`}>
                  <div className="bg-[#187B65] h-full" style={{ width: `${(a.browsing_vs_intent.intent / Math.max(a.human_visits, 1)) * 100}%` }} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
                  <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-[#187B65] mr-1.5"></span>Buying intent: <strong className="tabular-nums">{num(a.browsing_vs_intent.intent)}</strong></span>
                  <span><span className="inline-block w-2.5 h-2.5 rounded-sm bg-slate-200 mr-1.5"></span>Browsing only: <strong className="tabular-nums">{num(a.browsing_vs_intent.browsing)}</strong></span>
                </div>
              </div>
            </div>
          )}

          {tab === "traffic" && t && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Metric icon={Globe} label="Page views (30d, all)" value={num(t.pageviews_30d)} sub={`${num(t.pageviews_all_time)} all time`} />
                <Metric icon={UserCheck} label="Sessions (≈ visitors)" value={num(t.sessions)} sub="Anonymous session keys, no cookies" />
                <Metric icon={Repeat2} label="Returning visitors" value={num(t.returning_visitors)} sub="Sessions with 2+ visits" />
                <Metric icon={ShieldCheck} label="Attribution coverage" value={pctLabel(t.attributed_pct)} sub="Visits with a known source" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-[#102B2A]">Visitors by day (14d)</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={t.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="date" fontSize={10} interval={1} tickMargin={6} />
                    <YAxis fontSize={11} allowDecimals={false} width={30} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="human" fill="#187B65" radius={[4, 4, 0, 0]} name="Human visits" />
                    <Bar dataKey="intent" fill="#102B2A" radius={[4, 4, 0, 0]} name="Customer-intent visits" />
                    <Bar dataKey="owner" fill="#cbd5e1" radius={[4, 4, 0, 0]} name="Your visits" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h2 className="text-sm font-bold text-[#102B2A]">Acquisition sources (30d human)</h2>
                  {(t.sources || []).length === 0 ? (
                    <p className="mt-2 text-xs text-slate-500">No source data in this window.</p>
                  ) : (
                    <div className="mt-3 space-y-2.5">
                      {t.sources.map((s) => (
                        <div key={s.source}>
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold text-[#102B2A]">{SOURCE_LABELS[s.source] || s.source}</span>
                            <span className="tabular-nums text-slate-600">{num(s.count)} · {Math.round((s.count / Math.max(t.sources_total, 1)) * 100)}%</span>
                          </div>
                          <div className="mt-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-[#187B65]" style={{ width: `${Math.max((s.count / Math.max(t.sources_total, 1)) * 100, 2)}%` }} />
                          </div>
                        </div>
                      ))}
                      <p className="text-[10px] text-slate-400 pt-1">"Direct / unknown" = the browser sent no referrer. Never re-labelled without evidence; organic search performance stays verified in Search Console.</p>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h2 className="text-sm font-bold text-[#102B2A]">Most visited services (30d)</h2>
                    <table className="mt-2 w-full text-xs">
                      <tbody>
                        {(t.top_services || []).map((s) => (
                          <tr key={s.service} className="border-t border-slate-50">
                            <td className="py-2 capitalize text-slate-600">{s.service}</td>
                            <td className="py-2 text-right font-bold tabular-nums text-[#102B2A]">{num(s.count)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4">
                    <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><MapPin className="w-4 h-4 text-[#187B65]" /> City-level demand (bookings, 30d)</h2>
                    {(t.city_demand || []).length === 0 ? (
                      <p className="mt-2 text-xs text-slate-500">No booking requests in this window yet.</p>
                    ) : (
                      <div className="mt-2 space-y-1.5">
                        {t.city_demand.map((c) => (
                          <div key={c.city} className="flex justify-between text-xs">
                            <span className="text-slate-600">{c.city}</span>
                            <span className="font-bold tabular-nums text-[#102B2A]">{num(c.count)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Metric icon={ShieldCheck} label="Owner visits (30d)" value={num(t.owner_bot.owner_30d)} sub="Excluded from customer metrics" />
                <Metric icon={Bot} label="Bot visits (30d)" value={num(t.owner_bot.bot_30d)} sub="Crawlers & automated" />
                <Metric icon={AlertTriangle} label="Unclassified (all time)" value={num(t.owner_bot.unclassified_all_time)} sub="Historical — never counted as customers" tone="text-amber-600" />
              </div>
            </div>
          )}

          {tab === "performance" && p && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Metric icon={CalendarCheck} label="Booking completion rate" value={pctLabel(p.booking_completion_pct)} sub="Completed of confirmed" />
                <Metric icon={Truck} label="Contractor-matched jobs" value={num(p.contractor_matched_jobs)} sub="Assigned to a verified partner" />
                <Metric icon={Wallet} label="Commission earned" value={money(p.revenue.commission_earned)} sub="From completed platform jobs" />
                <Metric icon={AlertTriangle} label="Unfulfilled requests" value={num(p.unfulfilled_requests)} sub="Open national dispatch requests" />
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <Money label="Completed job value" value={money(p.revenue.completed_job_value)} note="All completed jobs, incl. externally settled" />
                <Money label="Platform-processed" value={money(p.revenue.platform_paid_value)} note="Paid through this platform" />
                <Money label="Externally settled" value={money(p.revenue.external_paid_value)} note={p.revenue.external_unverified_value > 0 ? `${money(p.revenue.external_unverified_value)} awaiting your reconciliation` : "All reconciled"} />
                <Money label="Collected revenue" value={money(p.revenue_collected ?? 0)} note="Platform + owner-verified external" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-[#102B2A]">Bookings by service (30d)</h2>
                <p className="mt-1 text-[11px] text-slate-500">Category inferred from each booking's items text — not a recorded attribute.</p>
                {(p.bookings_by_service || []).length === 0 ? (
                  <p className="mt-3 text-xs text-slate-500">No booking requests in this window yet.</p>
                ) : (
                  <table className="mt-3 w-full text-xs">
                    <thead>
                      <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2 pr-3">Service</th><th className="py-2 pr-3">Bookings</th><th className="py-2 pr-3">Completed</th><th className="py-2 text-right">Value</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-600">
                      {p.bookings_by_service.map((s) => (
                        <tr key={s.service} className="border-t border-slate-100">
                          <td className="py-2 pr-3 capitalize font-semibold text-[#102B2A]">{s.service}</td>
                          <td className="py-2 pr-3 tabular-nums">{s.bookings}</td>
                          <td className="py-2 pr-3 tabular-nums">{s.completed}</td>
                          <td className="py-2 text-right font-bold text-[#187B65] tabular-nums">{money(s.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <p className="mt-3 text-[11px] text-slate-500">{p.cancelled_bookings} cancelled booking(s) this window — tracked, never counted in conversions. {p.revenue.note}</p>
              </div>
            </div>
          )}

          {tab === "development" && dev && integrity && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <Metric icon={Wrench} label="Your visits (30d)" value={num(dev.owner_visits_30d)} sub="Testing & administration" />
                <Metric icon={Activity} label="Internal test bookings" value={num(dev.internal_test_bookings)} sub={`${num(dev.stale_test_bookings)} older than 7 days`} />
                <Metric icon={ShieldCheck} label="Automated testing" value={integrity.last_integrity_run ? integrity.last_integrity_run.status : "none"} sub={dev.automated_testing} />
                <Metric icon={Bot} label="Bot traffic (30d)" value={num(dev.bot_traffic_30d)} sub="Crawlers & automated requests" />
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-[#102B2A]">Your page activity (30d)</h2>
                {(dev.owner_paths || []).length === 0 ? (
                  <p className="mt-2 text-xs text-slate-500">No owner visits recorded in this window.</p>
                ) : (
                  <div className="mt-2 space-y-1.5">
                    {dev.owner_paths.map((r) => (
                      <div key={r.path} className="flex justify-between text-xs">
                        <span className="text-slate-600 truncate max-w-[70%] font-mono">{r.path}</span>
                        <span className="font-bold tabular-nums text-[#102B2A]">{num(r.count)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#187B65]" /> Analytics integrity checks</h2>
                <p className="mt-1 text-[11px] text-slate-500">Report-only — causes and affected metrics are shown; records are never silently altered.</p>
                <div className="mt-3 space-y-2.5">
                  {integrity.checks.map((c) => {
                    const tone = c.severity === "pass" ? "text-[#187B65]" : c.severity === "warning" ? "text-amber-600" : c.severity === "error" ? "text-red-600" : "text-slate-500";
                    const chip = c.severity === "pass" ? "bg-[#187B65]/10 text-[#187B65]" : c.severity === "warning" ? "bg-amber-100 text-amber-800" : c.severity === "error" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600";
                    return (
                      <div key={c.check} className="rounded-xl border border-slate-100 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {c.severity === "pass" ? <CheckCircle2 className={`w-3.5 h-3.5 ${tone}`} /> : c.severity === "warning" ? <AlertTriangle className={`w-3.5 h-3.5 ${tone}`} /> : <Info className={`w-3.5 h-3.5 ${tone}`} />}
                          <span className="text-xs font-bold text-[#102B2A]">{c.check.replace(/_/g, " ")}</span>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${chip}`}>{c.severity}</span>
                        </div>
                        <p className="mt-1 text-[11px] text-slate-600">{c.summary}</p>
                        {(c.affected_metrics || []).length > 0 && (
                          <p className="mt-1 text-[10px] text-slate-400">Affected metrics: {c.affected_metrics.join(", ")}</p>
                        )}
                        {(c.details || []).length > 0 && (
                          <ul className="mt-1 space-y-0.5 text-[10px] text-slate-400">
                            {c.details.map((d, i) => <li key={i}>· {d}</li>)}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Definitions footer — always visible for consistency */}
          <div className="rounded-2xl bg-[#eef4f0] border border-[#187B65]/20 px-5 py-4 text-xs text-[#102B2A] leading-relaxed">
            <strong>Definitions (shared by every dashboard):</strong> {data.definitions?.metrics ? Object.entries(data.definitions.metrics).map(([k, v]) => <span key={k} className="block mt-0.5"><strong className="capitalize">{k.replace(/_/g, " ")}:</strong> {v}</span>) : null}
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value, sub, tone = "text-[#102B2A]" }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <Icon className="w-4 h-4 text-[#187B65]" />
      <p className={`mt-2 text-xl font-bold tabular-nums leading-tight ${tone}`}>{value}</p>
      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">{label}</p>
      {sub && <p className="mt-0.5 text-[10px] text-slate-400">{sub}</p>}
    </div>
  );
}

function Money({ label, value, note }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-extrabold text-[#102B2A] tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-500">{note}</div>
    </div>
  );
}