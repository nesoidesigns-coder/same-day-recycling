import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw, Check, X, Undo2, ShieldCheck, Sparkles, Activity, Search, DollarSign, AlertTriangle, ScrollText, Gauge as GaugeIcon } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Owner Command Centre: what the AI discovered, what it changed, what needs
// approval, website health, search performance and confirmed revenue impact.
// All data comes from verified platform records; actions run through the
// growthCoordinator function so every change stays auditable.

const money = (n) => "$" + Math.round(n || 0).toLocaleString("en-CA");
const day = (d) => (d ? String(d).slice(0, 10) : "—");

const STATUS_STYLE = {
  proposed: "bg-amber-100 text-amber-800",
  escalated: "bg-red-100 text-red-800",
  approved: "bg-blue-100 text-blue-800",
  monitoring: "bg-indigo-100 text-indigo-800",
  executed: "bg-emerald-100 text-emerald-800",
  reverted: "bg-orange-100 text-orange-800",
  declined: "bg-slate-100 text-slate-500",
};

export default function AdminGrowthCommand() {
  const [tab, setTab] = useState("approvals");
  const [decisions, setDecisions] = useState(null);
  const [stats, setStats] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(async () => {
    const [page, audits, snaps, fin, bookings] = await Promise.all([
      base44.entities.GrowthDecision.list({ sort: "-priority_score", limit: 200 }),
      base44.entities.PerformanceAudit.list({ sort: "-test_date", limit: 5 }),
      base44.entities.SeoPerformanceSnapshot.list({ sort: "-snapshot_date", limit: 10 }),
      base44.entities.JobFinancials.list({ limit: 500 }),
      base44.entities.Booking.count({ status: "completed" }),
    ]);
    setDecisions(page.items || page);
    const items = page.items || page;
    const revenue = fin.filter((f) => (f.job_status || "") === "completed" && f.expenses_verified).reduce((s, f) => s + (f.platform_profit || 0), 0);
    const revenueAll = fin.filter((f) => (f.job_status || "") === "completed").reduce((s, f) => s + (f.final_customer_price || 0), 0);
    setStats({
      awaiting: items.filter((d) => d.status === "proposed" || d.status === "escalated").length,
      active: items.filter((d) => d.status === "approved" || d.status === "executing" || d.status === "monitoring").length,
      executed: items.filter((d) => d.status === "executed").length,
      reverted: items.filter((d) => d.status === "reverted").length,
      latestAudit: audits[0], gsc: snaps,
      platformProfit: revenue, revenueAll, completedBookings: bookings,
    });
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (action, id, extra) => {
    setBusyId(id || action);
    setMessage("");
    try {
      const res = await base44.functions.invoke("growthCoordinator", { action, id, ...(extra || {}) });
      const d = res.data || {};
      if (d.error) setMessage(d.error);
      else if (action === "run") setMessage(`Scan complete: ${d.created || 0} new decisions from ${d.open || 0} open items.`);
      else if (action === "monitor") setMessage(`Monitoring checked ${d.monitored || 0} executed changes.`);
      else setMessage(action === "approve" && d.applied ? "Approved and applied — now monitoring outcomes." : "Done.");
      await load();
    } catch (e) {
      setMessage(e?.response?.data?.error || e?.message || "Action failed.");
    }
    setBusyId(null);
  };

  const run = async () => { setScanning(true); await act("run"); setScanning(false); };

  const open = (decisions || []).filter((d) => d.status === "proposed" || d.status === "escalated");
  const active = (decisions || []).filter((d) => d.status === "approved" || d.status === "executing" || d.status === "monitoring");
  const closed = (decisions || []).filter((d) => d.status === "executed" || d.status === "reverted").sort((a, b) => (b.executed_date || "").localeCompare(a.executed_date || ""));

  const TABS = [
    { key: "approvals", label: `Needs Approval (${open.length})` },
    { key: "active", label: `In Progress (${active.length})` },
    { key: "changelog", label: "Change Log" },
    { key: "health", label: "Health & Search" },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><ShieldCheck className="w-6 h-6 text-emerald-400" /> Owner Command Centre</h1>
          <p className="text-sm text-emerald-100/60 mt-1">What the AI discovered, changed, and needs your approval — one auditable queue for the whole growth system.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={run} disabled={scanning} className="flex items-center gap-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-sm font-bold disabled:opacity-50">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Run Scan Now
          </button>
          <button onClick={() => act("monitor")} disabled={busyId === "monitor"} className="flex items-center gap-2 rounded-lg border border-emerald-600/50 text-emerald-200 px-4 py-2 text-sm font-bold disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${busyId === "monitor" ? "animate-spin" : ""}`} /> Check Outcomes
          </button>
        </div>
      </div>

      {message && <div className="rounded-lg bg-emerald-900/40 border border-emerald-700/50 px-4 py-2.5 text-sm text-emerald-100">{message}</div>}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi icon={AlertTriangle} label="Awaiting approval" value={stats.awaiting} />
          <Kpi icon={Activity} label="Active / monitoring" value={stats.active} />
          <Kpi icon={ScrollText} label="Executed changes" value={stats.executed} />
          <Kpi icon={Undo2} label="Rollbacks" value={stats.reverted} />
          <Kpi icon={DollarSign} label="Completed jobs" value={stats.completedBookings ?? "—"} />
          <Kpi icon={DollarSign} label="Confirmed job revenue" value={money(stats.revenueAll)} />
          <Kpi icon={DollarSign} label="Verified platform profit" value={money(stats.platformProfit)} />
          <Kpi icon={GaugeIcon} label="Latest performance score" value={stats.latestAudit?.performance != null ? `${stats.latestAudit.performance}` : "no audit"} sub={stats.latestAudit?.strategy} />
        </div>
      )}

      <div className="flex gap-1 border-b border-emerald-900/60">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-bold ${tab === t.key ? "text-emerald-300 border-b-2 border-emerald-400" : "text-emerald-100/50 hover:text-emerald-100"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {decisions === null ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-emerald-400" /></div>
      ) : (
        <div className="space-y-3">
          {tab === "approvals" && open.map((d) => (
            <DecisionCard key={d.id} d={d} busyId={busyId} act={act}>
              <button onClick={() => act("approve", d.id)} disabled={busyId === d.id} className="flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold disabled:opacity-50"><Check className="w-3.5 h-3.5" /> {d.executable ? "Approve & Apply" : "Approve"}</button>
              <button onClick={() => act("decline", d.id)} disabled={busyId === d.id} className="flex items-center gap-1.5 rounded-lg border border-red-800 text-red-300 hover:bg-red-900/30 px-3.5 py-2 text-xs font-bold disabled:opacity-50"><X className="w-3.5 h-3.5" /> Decline</button>
            </DecisionCard>
          ))}
          {tab === "approvals" && open.length === 0 && <Empty text="Nothing waiting for approval. Run a scan to collect fresh opportunities." />}

          {tab === "active" && active.map((d) => (
            <DecisionCard key={d.id} d={d} busyId={busyId} act={act}>
              {d.executable && <button onClick={() => act("revert", d.id)} disabled={busyId === d.id} className="flex items-center gap-1.5 rounded-lg border border-orange-700 text-orange-300 hover:bg-orange-900/30 px-3.5 py-2 text-xs font-bold disabled:opacity-50"><Undo2 className="w-3.5 h-3.5" /> Roll Back</button>}
            </DecisionCard>
          ))}
          {tab === "active" && active.length === 0 && <Empty text="No changes are currently in progress or being monitored." />}

          {tab === "changelog" && closed.map((d) => (
            <DecisionCard key={d.id} d={d} busyId={busyId} act={act} />
          ))}
          {tab === "changelog" && closed.length === 0 && <Empty text="No completed or rolled-back changes yet." />}

          {tab === "health" && <HealthTab stats={stats} />}
        </div>
      )}
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub }) {
  return (
    <div className="rounded-xl bg-emerald-950/60 border border-emerald-900 p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-emerald-100/60"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="mt-1.5 text-xl font-bold text-white">{value}</div>
      {sub && <div className="text-[11px] text-emerald-100/40">{sub}</div>}
    </div>
  );
}

function DecisionCard({ d, children }) {
  const badge = STATUS_STYLE[d.status] || "bg-slate-100 text-slate-600";
  return (
    <div className="rounded-xl bg-emerald-950/60 border border-emerald-900 p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${badge}`}>{d.status}</span>
            <span className="rounded-full bg-emerald-900/60 px-2 py-0.5 text-[10px] font-bold text-emerald-200">{d.risk_tier} risk</span>
            <span className="text-[11px] font-bold text-emerald-100/60">priority {d.priority_score}</span>
          </div>
          <h3 className="mt-1.5 font-bold text-white text-sm">{d.title}</h3>
          <p className="mt-1 text-xs text-emerald-100/60 line-clamp-3">{d.summary}</p>
          {d.measured_effect?.click_change_pct != null && (
            <p className="mt-1.5 text-xs font-bold text-emerald-300">Measured: {d.measured_effect.click_change_pct > 0 ? "+" : ""}{d.measured_effect.click_change_pct}% clicks, {d.measured_effect.impression_change_pct != null ? (d.measured_effect.impression_change_pct > 0 ? "+" : "") + d.measured_effect.impression_change_pct + "% impressions" : "impressions n/a"}</p>
          )}
          {d.revert_reason && <p className="mt-1.5 text-xs text-orange-300">{d.revert_reason}</p>}
        </div>
        <div className="flex gap-2 shrink-0">{children}</div>
      </div>
      {d.changelog?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-emerald-900/70 space-y-1">
          {d.changelog.slice(-4).map((c, i) => (
            <div key={i} className="text-[11px] text-emerald-100/40"><span className="font-bold text-emerald-100/60">{day(c.date)} · {c.event}</span>{c.note ? ` — ${c.note}` : ""}</div>
          ))}
        </div>
      )}
    </div>
  );
}

function HealthTab({ stats }) {
  return (
    <>
      <div className="rounded-xl bg-emerald-950/60 border border-emerald-900 p-4">
        <h3 className="font-bold text-white text-sm flex items-center gap-2 mb-3"><Search className="w-4 h-4 text-emerald-400" /> Search performance (verified GSC snapshots)</h3>
        {stats.gsc.length === 0 ? <Empty text="No verified snapshots recorded yet." /> : (
          <div className="space-y-2">
            {stats.gsc.map((s, i) => (
              <div key={i} className="flex flex-wrap items-baseline justify-between gap-2 text-xs border-b border-emerald-900/50 pb-2">
                <span className="font-bold text-emerald-100">{s.page_path}</span>
                <span className="text-emerald-100/60">{day(s.snapshot_date)} · {s.clicks} clicks · {s.impressions} impressions · pos {s.avg_position || "—"}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl bg-emerald-950/60 border border-emerald-900 p-4">
        <h3 className="font-bold text-white text-sm mb-3">Website health context</h3>
        <p className="text-xs text-emerald-100/60">Latest audit: {stats.latestAudit ? `${day(stats.latestAudit.test_date)} — performance ${stats.latestAudit.performance ?? "n/a"}, accessibility ${stats.latestAudit.accessibility ?? "n/a"}, SEO ${stats.latestAudit.seo ?? "n/a"} (${stats.latestAudit.test_source || "admin_imported"})` : "No performance audit recorded yet."}</p>
        <p className="mt-2 text-xs text-emerald-100/40">Scheduled integrity sweeps, platform audits and SEO engines keep running on their own workflows; this centre consolidates their verified outcomes.</p>
      </div>
    </>
  );
}

function Empty({ text }) {
  return <div className="rounded-xl border border-dashed border-emerald-900 p-8 text-center text-sm text-emerald-100/40">{text}</div>;
}