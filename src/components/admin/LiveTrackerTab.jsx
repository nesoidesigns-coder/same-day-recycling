import { useState, useEffect } from "react";
import { Radio, Activity, Globe, Users, CalendarCheck, MousePointerClick, Facebook, Search, Link2, HelpCircle, Truck, ShieldCheck, Bot } from "lucide-react";
import { base44 } from "@/api/base44Client";
import EngagementSection from "@/components/admin/EngagementSection";

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