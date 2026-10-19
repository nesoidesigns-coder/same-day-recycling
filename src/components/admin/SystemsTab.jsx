import { useState, useEffect } from "react";
import { Activity, RefreshCw, AlertTriangle, CheckCircle2, Clock, DollarSign, CalendarCheck, Star, Users, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

function StatCard({ icon, label, value, sub }) {
  return (
    <div className="rounded-2xl bg-[#f4f7f5] px-4 py-4">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
        {icon} {label}
      </div>
      <span className="text-2xl font-bold text-[#0c3b24]">{value}</span>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}

function fmtDate(iso) {
  if (!iso) return "Never";
  const d = new Date(iso);
  const hrs = (Date.now() - d.getTime()) / 3600000;
  if (hrs < 1) return `${Math.max(1, Math.round(hrs * 60))} min ago`;
  if (hrs < 48) return `${Math.round(hrs)} h ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

function AutomationRow({ label, lastIso, healthyAfterH }) {
  const never = !lastIso;
  const hrs = never ? Infinity : (Date.now() - new Date(lastIso).getTime()) / 3600000;
  const ok = hrs <= healthyAfterH;
  return (
    <div className="px-4 py-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-700 truncate">{label}</p>
        <p className="text-xs text-slate-400 flex items-center gap-1">
          <Clock className="w-3 h-3" /> {never ? "No activity yet" : fmtDate(lastIso)}
        </p>
      </div>
      <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${ok ? "bg-[#e7f6ee] text-[#0c3b24]" : "bg-amber-100 text-amber-800"}`}>
        {ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        {ok ? "Healthy" : "Stale"}
      </span>
    </div>
  );
}

export default function SystemsTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("systemsAnalysis", {});
      setData(res.data);
      setError("");
    } catch {
      setError("Could not load systems analysis right now.");
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const b = data?.business;
  const a = data?.automations;
  const errs = data?.errors;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="font-bold text-[#0c3b24] flex items-center gap-2">
          <Activity className="w-5 h-5 text-[#1d9e56]" /> Systems Analysis
        </h2>
        <button
          onClick={load}
          disabled={loading}
          className="rounded-full bg-slate-100 text-slate-700 font-medium px-4 py-2 text-sm hover:bg-slate-200 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {!data && !error && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#1d9e56] rounded-full animate-spin"></div>
        </div>
      )}

      {data && (
        <div className="space-y-8">
          <section>
            <h3 className="font-bold text-[#0c3b24] mb-3 text-sm">Business metrics</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <StatCard icon={<CalendarCheck className="w-3.5 h-3.5" />} label="Bookings total" value={(b?.bookings_total || 0).toLocaleString()} sub={`${b?.bookings_7d || 0} in last 7 days`} />
              <StatCard icon={<DollarSign className="w-3.5 h-3.5" />} label="Completed revenue" value={`$${(b?.completed_revenue || 0).toLocaleString()}`} />
              <StatCard icon={<Globe className="w-3.5 h-3.5" />} label="Visits last 7d" value={(b?.visits_7d || 0).toLocaleString()} sub={(() => {
                const s = b?.visits_by_source || {};
                return `FB ${s.facebook || 0} · Search ${s.search || 0} · Direct ${s.direct || 0}`;
              })()} />
              <StatCard icon={<Users className="w-3.5 h-3.5" />} label="Realtor leads" value={Object.values(b?.realtor_leads || {}).reduce((x, y) => x + y, 0)} sub={`New: ${b?.realtor_leads?.new || 0}`} />
              <StatCard icon={<Users className="w-3.5 h-3.5" />} label="Subscriptions" value={Object.values(b?.subscriptions || {}).reduce((x, y) => x + y, 0)} sub={`Active: ${b?.subscriptions?.active || 0}`} />
              <StatCard icon={<Star className="w-3.5 h-3.5" />} label="Reviews" value={`${b?.reviews_approved || 0} live`} sub={`${b?.reviews_pending || 0} pending approval`} />
            </div>
            <div className="mt-3 rounded-2xl bg-[#f4f7f5] px-4 py-3 text-xs text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
              {(b?.bookings || {}).new != null && <span>Bookings: new {b.bookings.new} · confirmed {b.bookings.confirmed || 0} · scheduled {b.bookings.scheduled || 0} · completed {b.bookings.completed || 0} · cancelled {b.bookings.cancelled || 0}</span>}
            </div>
          </section>

          <section>
            <h3 className="font-bold text-[#0c3b24] mb-3 text-sm">Automation health</h3>
            <div className="rounded-2xl border border-slate-100 divide-y divide-slate-50">
              <AutomationRow label="Latest booking received" lastIso={a?.latest_booking} healthyAfterH={168} />
              <AutomationRow label="AI blog publishing (AI Content Sync)" lastIso={a?.latest_blog_post} healthyAfterH={168} />
              <AutomationRow label="Facebook AI auto-post" lastIso={a?.latest_fb_post} healthyAfterH={72} />
              <AutomationRow label="Facebook AI auto-reply" lastIso={a?.latest_fb_message} healthyAfterH={336} />
              <AutomationRow label="Review requests" lastIso={a?.latest_review} healthyAfterH={336} />
              <AutomationRow label="Recycling center AI sync" lastIso={a?.latest_recycling_sync} healthyAfterH={336} />
              <AutomationRow label="AI research reports" lastIso={a?.latest_research} healthyAfterH={336} />
              <AutomationRow label="Subscription signups" lastIso={a?.latest_subscription} healthyAfterH={720} />
            </div>
            {a?.blog_published_count != null && (
              <p className="text-xs text-slate-400 mt-2 px-1">{a.blog_published_count} blog posts published{a.latest_blog_title ? ` · latest: "${a.latest_blog_title}"` : ""}</p>
            )}
          </section>

          <section>
            <h3 className="font-bold text-[#0c3b24] mb-3 text-sm flex items-center gap-2">
              <AlertTriangle className={`w-4 h-4 ${errs?.total_fb_errors ? "text-amber-600" : "text-[#1d9e56]"}`} /> Error log
              <span className="text-xs font-medium text-slate-400">{errs?.total_fb_errors || 0} total</span>
            </h3>
            {(errs?.recent || []).length === 0 ? (
              <div className="rounded-2xl bg-[#f4f7f5] px-4 py-4 flex items-center gap-2 text-sm text-[#0c3b24]">
                <CheckCircle2 className="w-4 h-4 text-[#1d9e56]" /> No errors logged. All automation replies are clean.
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 divide-y divide-slate-50">
                {errs.recent.map((e) => (
                  <div key={e.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700 truncate">{e.sender_name || "Unknown sender"}</p>
                      <span className="text-xs text-slate-400 shrink-0">{fmtDate(e.created_date)}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{e.message_text}</p>
                    <p className="text-xs text-red-600 mt-0.5">{e.error}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}