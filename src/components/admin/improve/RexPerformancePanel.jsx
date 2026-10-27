import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Activity, AlertTriangle, ArrowUpRight, BrainCircuit, CheckCircle2, Clock,
  Gauge, Loader2, Play, RefreshCw, ShieldCheck, Wand2, X,
} from "lucide-react";

const OPEN = ["detected", "reviewed", "approved", "in_progress", "testing"];

const SEVERITY = {
  critical: "bg-red-600 text-white",
  major: "bg-amber-500 text-[#3b2303]",
  minor: "bg-slate-600 text-white",
};
const STATUS = {
  detected: "bg-[#102B2A] text-white",
  in_progress: "bg-[#187B65] text-white",
  testing: "bg-[#54D9AE] text-[#102B2A]",
  verified: "bg-[#0f5c3f] text-white",
};

const fmt = (v, unit = "") => (v == null || v === "" ? "—" : `${v}${unit}`);

// Rex's performance loop, in one panel: measure with real PageSpeed Insights
// data, queue what the numbers show, prepare the exact fix, and re-measure to
// prove it. Nothing here reports a result that was not measured.
export default function RexPerformancePanel({ onChanged }) {
  const [audit, setAudit] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    const [a, i] = await Promise.all([
      base44.entities.PerformanceAudit.filter({ strategy: "mobile" }, { sort: "-created_date", limit: 1 }),
      base44.entities.Improvement.filter({ source: "performance_intelligence" }, { sort: "-created_date", limit: 25 }),
    ]);
    setAudit((a.items || [])[0] || null);
    setFindings(i.items || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const call = async (action, extra = {}) => {
    const res = await base44.functions.invoke("rexPerformance", { action, ...extra });
    return res.data;
  };

  const refresh = async () => {
    await load();
    if (onChanged) await onChanged();
  };

  const diagnose = async () => {
    setBusy("diagnose");
    setNotice("");
    try {
      const r = await call("diagnose");
      setNotice(
        `Rex measured the live site: performance ${r.audit?.performance} (mobile). ${r.new_findings?.length || 0} new finding(s) queued.`
      );
      await refresh();
    } catch (e) {
      setNotice("Diagnose failed: " + (e?.response?.data?.error || e?.message || "no details returned"));
    } finally {
      setBusy("");
    }
  };

  const monitor = async () => {
    setBusy("monitor");
    setNotice("");
    try {
      const r = await call("monitor");
      const now = r.current?.performance;
      setNotice(
        r.regression
          ? `Regression detected: performance ${r.previous?.performance} → ${now}. ${r.queued ? "Queued for review." : "Already queued."}`
          : `No regression. Measured performance ${now}${r.previous ? ` (previous ${r.previous.performance})` : ""}.`
      );
      await refresh();
    } catch (e) {
      setNotice("Monitor failed: " + (e?.response?.data?.error || e?.message || "no details returned"));
    } finally {
      setBusy("");
    }
  };

  const apply = async (item) => {
    setBusy("apply-" + item.id);
    setNotice("");
    try {
      await call("apply", { improvement_id: item.id });
      setNotice("Rex prepared the exact change — see the builder action on the finding below.");
      await refresh();
    } catch (e) {
      setNotice("Apply failed: " + (e?.response?.data?.error || e?.message || "no details returned"));
    } finally {
      setBusy("");
    }
  };

  const verify = async (item) => {
    setBusy("verify-" + item.id);
    setNotice("");
    try {
      const r = await call("verify", { improvement_id: item.id });
      setNotice(`${r.passed ? "Verified" : "Still testing"}: ${r.delta}`);
      await refresh();
    } catch (e) {
      setNotice("Verify failed: " + (e?.response?.data?.error || e?.message || "no details returned"));
    } finally {
      setBusy("");
    }
  };

  const open = findings.filter((f) => OPEN.includes(f.status));

  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 md:p-5 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#187B65] flex items-center gap-2">
            <BrainCircuit className="w-4 h-4" /> Rex performance
          </div>
          <h2 className="mt-1 text-lg md:text-xl font-extrabold text-[#102B2A] tracking-tight">
            Measure, fix, prove it
          </h2>
          <p className="mt-1 max-w-xl text-[13px] text-slate-600">
            Rex runs real PageSpeed Insights tests, queues only what the numbers show, prepares the exact
            change, then re-measures to prove it worked. Code edits are executed by the builder — Rex never
            reports a fix it did not measure.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto">
          <button
            onClick={diagnose}
            disabled={Boolean(busy)}
            className="min-h-[46px] rounded-full bg-[#187B65] text-white font-bold px-4 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy === "diagnose" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Diagnose
          </button>
          <button
            onClick={monitor}
            disabled={Boolean(busy)}
            className="min-h-[46px] rounded-full border-2 border-[#102B2A] text-[#102B2A] font-bold px-4 text-sm hover:bg-[#102B2A] hover:text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy === "monitor" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Check now
          </button>
        </div>
      </div>

      {notice && (
        <div className="mt-3 rounded-xl border border-[#187B65]/40 bg-[#eef6f2] px-3.5 py-2.5 text-sm text-[#102B2A] flex items-start justify-between gap-3">
          <span className="break-words">{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss" className="shrink-0 text-slate-500 hover:text-[#102B2A]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-4 py-6 text-center">
          <Loader2 className="w-5 h-5 text-[#187B65] animate-spin mx-auto" />
        </div>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-2">
            <Metric label="Performance" value={fmt(audit?.performance)} target={audit?.performance != null && audit.performance >= 90} icon={Gauge} />
            <Metric label="LCP" value={fmt(audit?.lcp_seconds, "s")} target={audit?.lcp_seconds != null && audit.lcp_seconds <= 2.5} icon={Clock} />
            <Metric label="FCP" value={fmt(audit?.fcp_seconds, "s")} target={audit?.fcp_seconds != null && audit.fcp_seconds <= 1.8} icon={Activity} />
            <Metric label="TBT" value={fmt(audit?.tbt_ms, "ms")} target={audit?.tbt_ms != null && audit.tbt_ms <= 200} icon={Activity} />
            <Metric label="CLS" value={fmt(audit?.cls)} target={audit?.cls != null && audit.cls <= 0.1} icon={Activity} />
          </div>
          <p className="mt-2 text-[12px] text-slate-500">
            {audit
              ? `Last measured run: ${audit.test_date} · ${audit.run_label || audit.test_source} · targets: 90 score, LCP 2.5 s, TBT 200 ms, CLS 0.1`
              : "No measured run on record yet. Run Diagnose to record the first real PageSpeed Insights test."}
          </p>

          <div className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Rex findings ({open.length} open)
            </div>
            {open.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">Nothing open from Rex's performance analysis.</p>
            ) : (
              <div className="mt-2 space-y-2">
                {open.map((item) => (
                  <div key={item.id} className="rounded-xl border border-slate-100 bg-[#f4f7f5] px-3.5 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${SEVERITY[item.severity] || SEVERITY.minor}`}>
                        {item.severity}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS[item.status] || "bg-slate-200 text-slate-600"}`}>
                        {String(item.status).replace("_", " ")}
                      </span>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                        {item.effort} effort
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm font-semibold text-[#102B2A] leading-snug">{item.title}</div>
                    {item.evidence && (
                      <p className="mt-1 text-[12.5px] text-slate-600 break-words">{item.evidence}</p>
                    )}
                    {item.builder_action && (
                      <div className="mt-2 rounded-lg bg-white border border-slate-200 px-3 py-2">
                        <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#187B65] flex items-center gap-1">
                          <Wand2 className="w-3 h-3" /> Rex prepared change
                        </div>
                        <p className="mt-1 text-[12.5px] text-[#102B2A] break-words">{item.builder_action}</p>
                      </div>
                    )}
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      <button
                        onClick={() => apply(item)}
                        disabled={Boolean(busy)}
                        className="min-h-[40px] rounded-full bg-[#187B65] text-white font-bold px-3.5 text-[13px] hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {busy === "apply-" + item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
                        {item.builder_action ? "Re-plan fix" : "Apply fix"}
                      </button>
                      <button
                        onClick={() => verify(item)}
                        disabled={Boolean(busy)}
                        className="min-h-[40px] rounded-full border-2 border-[#102B2A] text-[#102B2A] font-bold px-3.5 text-[13px] hover:bg-[#102B2A] hover:text-white transition-colors disabled:opacity-60 flex items-center gap-1.5"
                      >
                        {busy === "verify-" + item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                        Re-measure &amp; verify
                      </button>
                      {item.verification_test && (
                        <span className="inline-flex items-center gap-1 text-[12px] text-slate-500">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#187B65]" /> {item.verification_test}
                        </span>
                      )}
                    </div>
                    {item.after_result && (
                      <p className="mt-2 text-[12px] text-[#0f5c3f] flex items-start gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 shrink-0 mt-0.5" /> After: {item.after_result}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="mt-3 text-[12px] text-slate-500 flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-500" />
            Scheduled checks run weekly (Rex Performance Monitor). A real drop of 5+ score points or 0.5 s LCP
            queues a finding and emails the owner.
          </p>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, target, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-white px-3 py-2.5">
      <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Icon className="w-3 h-3 text-[#187B65]" /> {label}
      </div>
      <div className={`mt-0.5 text-xl font-extrabold tabular-nums ${target ? "text-[#0f5c3f]" : "text-[#102B2A]"}`}>
        {value}
      </div>
      <div className={`text-[10px] font-bold uppercase tracking-wider ${target ? "text-[#187B65]" : "text-slate-400"}`}>
        {target ? "on target" : "below target"}
      </div>
    </div>
  );
}