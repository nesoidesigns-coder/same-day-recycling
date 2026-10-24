import { useState, useEffect } from "react";
import { Radio, Activity, Globe, Users, CalendarCheck, MousePointerClick, Facebook, Search, Link2, HelpCircle, Truck, ShieldCheck, Bot, Scale, UserCheck } from "lucide-react";
import { base44 } from "@/api/base44Client";
import EngagementSection from "@/components/admin/EngagementSection";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

function SourceCard({ icon, label, value, total }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="rounded-2xl bg-[#f4f7f5] px-4 py-4">
      <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
        {icon} {label}
      </div>
      <div className="flex items-end gap-2">
        <span className="text-2xl font-bold text-[#102B2A]">{value.toLocaleString()}</span>
        <span className="text-xs text-slate-400 mb-1">{pct}%</span>
      </div>
    </div>
  );
}

export default function LiveTrackerTab() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const load = async () => {
    try {
      const res = await base44.functions.invoke("visitStats", {});
      setStats(res.data);
      setError("");
      setLastUpdated(new Date());
    } catch {
      setError("Could not load live traffic right now.");
    }
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  const v24 = stats?.visits_24h;
  const v30 = stats?.visits_30d;
  const cls = stats?.traffic_classes?.["30d"] || {};

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="font-bold text-[#102B2A] flex items-center gap-2">
          <span className="relative flex w-2.5 h-2.5">
            <span className="absolute inline-flex w-full h-full rounded-full bg-[#187B65] opacity-60 animate-ping"></span>
            <span className="relative inline-flex w-2.5 h-2.5 rounded-full bg-[#187B65]"></span>
          </span>
          Live Web Tracker
          <Radio className="w-4 h-4 text-[#187B65]" />
        </h2>
        {lastUpdated && (
          <span className="text-xs text-slate-400">
            Updated {lastUpdated.toLocaleTimeString()} · auto-refreshes every 60s
          </span>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {!stats && !error && (
        <div className="flex items-center justify-center py-10">
          <div className="w-8 h-8 border-4 border-slate-200 border-t-[#187B65] rounded-full animate-spin"></div>
        </div>
      )}

      {stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-[#102B2A] px-4 py-4">
              <div className="flex items-center gap-2 text-[#187B65] text-xs font-semibold mb-1">
                <Activity className="w-4 h-4" /> Visits 24h (real traffic)
              </div>
              <span className="text-2xl font-bold text-white">{(v24?.total || 0).toLocaleString()}</span>
            </div>
            <div className="rounded-2xl bg-[#f4f7f5] px-4 py-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Globe className="w-4 h-4" /> Visits last 30d
              </div>
              <span className="text-2xl font-bold text-[#102B2A]">{(v30?.total || 0).toLocaleString()}</span>
            </div>
            <div className="rounded-2xl bg-[#f4f7f5] px-4 py-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <CalendarCheck className="w-4 h-4" /> Bookings this week
              </div>
              <span className="text-2xl font-bold text-[#102B2A]">{Number(stats.bookings_7d || 0).toLocaleString()}</span>
            </div>
            <div className="rounded-2xl bg-[#f4f7f5] px-4 py-4">
              <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
                <Users className="w-4 h-4" /> Top city (30d)
              </div>
              <span className="text-2xl font-bold text-[#102B2A] truncate block">{stats.top_city || "—"}</span>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-[#102B2A] mb-3 text-sm">Last 24 hours by source</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <SourceCard icon={<Facebook className="w-3.5 h-3.5" />} label="Facebook" value={v24?.facebook || 0} total={v24?.total || 0} />
              <SourceCard icon={<Search className="w-3.5 h-3.5" />} label="Search" value={v24?.search || 0} total={v24?.total || 0} />
              <SourceCard icon={<Link2 className="w-3.5 h-3.5" />} label="Direct" value={v24?.direct || 0} total={v24?.total || 0} />
              <SourceCard icon={<HelpCircle className="w-3.5 h-3.5" />} label="Other" value={v24?.other || 0} total={v24?.total || 0} />
            </div>
          </div>

          {stats.traffic_classes && (
            <div>
              <h3 className="font-bold text-[#102B2A] mb-3 text-sm">Traffic classification (30d)</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <SourceCard icon={<Users className="w-3.5 h-3.5" />} label="Customer" value={cls.customer || 0} total={cls.total || 0} />
                <SourceCard icon={<Truck className="w-3.5 h-3.5" />} label="Contractor" value={cls.contractor || 0} total={cls.total || 0} />
                <SourceCard icon={<ShieldCheck className="w-3.5 h-3.5" />} label="Owner (you)" value={cls.owner || 0} total={cls.total || 0} />
                <SourceCard icon={<Bot className="w-3.5 h-3.5" />} label="Bot" value={cls.bot || 0} total={cls.total || 0} />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                Who the visits are: customers exploring services, contractors exploring partnerships and software,
                your own admin activity, and automated crawlers. Visitor totals exclude owner and bot traffic.
              </p>
            </div>
          )}

          {stats.reconciliation && (() => {
            const rec = stats.reconciliation;
            const t = rec.totals || {};
            const genuine = (t.customer || 0) + (t.contractor || 0);
            const rows = [
              { label: "Genuine customer traffic", value: genuine, tone: "text-[#187B65]" },
              { label: "Confirmed customers (converted sessions)", value: rec.confirmed_visits || 0, tone: "text-[#102B2A]" },
              { label: "Owner (you)", value: t.owner || 0, tone: "text-slate-500" },
              { label: "Bot", value: t.bot || 0, tone: "text-slate-500" },
              { label: "Unverified (pre-classification)", value: t.unverified || 0, tone: "text-amber-600" },
            ];
            return (
              <div>
                <h3 className="font-bold text-[#102B2A] mb-1 text-sm flex items-center gap-2">
                  <Scale className="w-4 h-4 text-[#187B65]" /> Traffic reconciliation (all time)
                </h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  {t.total?.toLocaleString()} visits on record: {genuine.toLocaleString()} genuine customer/contractor visits,
                  {(t.owner || 0).toLocaleString()} owner visits and {(t.bot || 0).toLocaleString()} bot visits excluded from visitor totals,
                  and {(t.unverified || 0).toLocaleString()} historical records with no classification (counted separately, never as customers).
                </p>
                <div className="rounded-2xl border border-slate-100 divide-y divide-slate-50 mb-4">
                  {rows.map((r) => (
                    <div key={r.label} className="px-4 py-3 flex items-center justify-between gap-3">
                      <span className="text-sm text-slate-600">{r.label}</span>
                      <span className={`text-sm font-bold tabular-nums ${r.tone}`}>{r.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 mb-3 flex items-start gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 mt-0.5 text-[#187B65] shrink-0" />
                  Confirmed customers are visits whose session went on to a quote request or booking ({rec.confirmed_sessions || 0} session(s) confirmed).
                  All other visits stay unverified until their session converts.
                </p>
                <h3 className="font-bold text-[#102B2A] mb-3 text-sm">Genuine customer activity by day (14 days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={rec.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                    <XAxis dataKey="date" fontSize={10} interval={1} tickMargin={6} />
                    <YAxis fontSize={11} allowDecimals={false} width={30} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="visits" fill="#187B65" radius={[4, 4, 0, 0]} name="Genuine customer visits" />
                    <Bar dataKey="confirmed" fill="#102B2A" radius={[4, 4, 0, 0]} name="Confirmed customers" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}

          <div>
            <h3 className="font-bold text-[#102B2A] mb-3 text-sm">Top pages (24h)</h3>
            <div className="rounded-2xl border border-slate-100 divide-y divide-slate-50">
              {(stats.top_paths_24h || []).length === 0 && (
                <p className="text-sm text-slate-500 px-4 py-3">No page visits recorded in the last 24 hours.</p>
              )}
              {(stats.top_paths_24h || []).map((p) => (
                <div key={p.path} className="px-4 py-3 flex items-center justify-between gap-3">
                  <span className="text-sm text-slate-700 truncate font-medium">{p.path}</span>
                  <span className="flex items-center gap-1.5 text-sm font-bold text-[#102B2A] shrink-0">
                    <MousePointerClick className="w-4 h-4 text-[#187B65]" /> {p.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-bold text-[#102B2A] mb-3 text-sm flex items-center gap-2">
              <Facebook className="w-4 h-4 text-[#187B65]" /> Facebook tracking
            </h3>
            <EngagementSection />
          </div>
        </div>
      )}
    </div>
  );
}