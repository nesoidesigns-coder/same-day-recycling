import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";

// Adaptive OS data layer. It reads the records the platform already produces —
// integrity sweeps, Rex findings, improvement queue, growth decisions, SEO change
// log, demand sync log and performance audits — and derives an honest control
// picture. Nothing here invents a measurement: a missing source reads unavailable.

const DAY = 86400000;

export const fmtDate = (v) => (v ? new Date(v).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "—");
export const fmtDay = (v) => (v ? new Date(v).toLocaleDateString("en-CA", { dateStyle: "medium" }) : "—");

const t = (v) => { const n = v ? new Date(v).getTime() : NaN; return Number.isFinite(n) ? n : 0; };
const latest = (rows, field) => rows.reduce((a, r) => (t(r[field]) > t(a?.[field]) ? r : a), null);
const days = (v) => { const n = t(v); return n ? Math.floor((Date.now() - n) / DAY) : null; };

export const STAGES = ["observed", "diagnosed", "proposed", "approved", "implemented", "measured"];
const STAGE_EVENTS = {
  observed: ["created", "detected", "imported", "recorded"],
  diagnosed: ["reviewed", "diagnosed", "rex_diagnosed", "analyzed", "compared", "requeued"],
  proposed: ["proposed", "recommended", "queued"],
  approved: ["approved", "accepted"],
  implemented: ["in_progress", "applied", "executed", "implemented", "testing", "rex_applied", "reverted"],
  measured: ["verified", "rex_verified", "retest_passed", "retest_failed", "monitored", "completed"],
};
export const stageOf = (event) => Object.keys(STAGE_EVENTS).find((k) => STAGE_EVENTS[k].includes(String(event || "").toLowerCase())) || "observed";

const load = async () => {
  const page = (p) => p.then((r) => r.items || []).catch(() => []);
  const [improvements, decisions, findings, runs, changes, syncs, audits] = await Promise.all([
    page(base44.entities.Improvement.filter({}, { sort: "-created_date", limit: 200 })),
    page(base44.entities.GrowthDecision.filter({}, { sort: "-created_date", limit: 200 })),
    page(base44.entities.RexFinding.filter({}, { sort: "-created_date", limit: 200 })),
    page(base44.entities.IntegrityRun.filter({}, { sort: "-run_date", limit: 40 })),
    page(base44.entities.SeoChangeLog.filter({}, { sort: "-change_date", limit: 100 })),
    page(base44.entities.DemandSyncLog.filter({}, { sort: "-run_date", limit: 40 })),
    page(base44.entities.PerformanceAudit.filter({}, { sort: "-test_date", limit: 40 })),
  ]);
  return { improvements, decisions, findings, runs, changes, syncs, audits };
};

const derive = ({ improvements, decisions, findings, runs, changes, syncs, audits }) => {
  const lastRun = latest(runs, "run_date");
  const lastSync = latest(syncs, "run_date");
  const lastAudit = latest(audits, "test_date");

  const pending = [
    ...improvements.filter((i) => ["detected", "reviewed"].includes(i.status)).map((i) => ({ ...i, _kind: "improvement" })),
    ...decisions.filter((d) => d.status === "proposed").map((d) => ({ ...d, _kind: "decision" })),
  ];

  const sources = [
    {
      name: "Platform integrity sweep",
      detail: "Data-integrity checks across records, coverage and configuration",
      last: lastRun?.run_date,
      status: !lastRun ? "unavailable" : lastRun.error_count > 0 ? "errors" : lastRun.warning_count > 0 ? "warnings" : "operational",
      result: !lastRun ? "No run recorded" : `${lastRun.status} · ${lastRun.error_count || 0} errors · ${lastRun.warning_count || 0} warnings · ${(lastRun.checks || []).length} checks`,
      stale: days(lastRun?.run_date) > 3,
    },
    {
      name: "Demand source synchronisation",
      detail: "External search-volume and market observation collection",
      last: lastSync?.run_date,
      status: !lastSync ? "unavailable" : lastSync.status === "failed" ? "errors" : lastSync.status === "partial" ? "warnings" : "operational",
      result: !lastSync ? "No run recorded" : `${lastSync.status} · ${lastSync.records_upserted ?? 0} records · ${lastSync.source || ""}`,
      stale: days(lastSync?.run_date) > 45,
    },
    {
      name: "Performance audits",
      detail: "Page-speed and Core Web Vitals measurements",
      last: lastAudit?.test_date,
      status: !lastAudit ? "unavailable" : "operational",
      result: !lastAudit ? "No test recorded" : `${lastAudit.run_label || lastAudit.test_source} · performance ${lastAudit.performance ?? "—"}`,
      stale: days(lastAudit?.test_date) > 30,
    },
    {
      name: "Improvement detection",
      detail: "Findings from diagnostics, performance and brand scans",
      last: latest(improvements, "created_date")?.created_date,
      status: improvements.length ? "operational" : "unavailable",
      result: `${improvements.length} improvement records · ${improvements.filter((i) => i.status === "detected").length} awaiting review`,
      stale: false,
    },
    {
      name: "Search metadata changes",
      detail: "Approved title/description changes with before-and-after Search Console data",
      last: latest(changes, "change_date")?.change_date,
      status: changes.length ? "operational" : "unavailable",
      result: `${changes.length} applied changes · ${changes.filter((c) => c.gsc_after_measured).length} with post-change measurement`,
      stale: false,
    },
  ];

  const problems = [];
  if (lastRun?.error_count > 0) problems.push(`Integrity sweep reported ${lastRun.error_count} error${lastRun.error_count === 1 ? "" : "s"}.`);
  if (lastSync?.status === "failed") problems.push("The most recent demand source sync failed.");
  if (!lastRun) problems.push("No integrity sweep has been recorded yet.");
  else if (days(lastRun.run_date) > 3) problems.push(`Last integrity sweep was ${days(lastRun.run_date)} days ago.`);
  if (findings.filter((f) => f.status === "open" && f.severity === "critical").length) problems.push("Critical Rex findings are open.");

  return {
    sources,
    problems,
    health: lastRun?.error_count > 0 || lastSync?.status === "failed" ? "attention" : problems.length ? "degraded" : "healthy",
    pending,
    openFindings: findings.filter((f) => f.status === "open"),
    findings,
    improvements,
    decisions,
    verified: improvements.filter((i) => ["verified", "completed"].includes(i.status)),
    changes,
    lastRun,
    lastSync,
    lastAudit,
    runs,
  };
};

export const buildTimeline = (d) => {
  const rows = [];
  for (const i of d.improvements) {
    rows.push({ key: i.id, title: i.title, kind: "Improvement", date: i.created_date, event: "detected", note: i.source ? `Detected by ${i.source}` : "" });
    for (const h of i.history || []) rows.push({ key: `${i.id}-${h.date}-${h.event}`, title: i.title, kind: "Improvement", date: h.date, event: h.event, note: h.note });
  }
  for (const g of d.decisions) {
    rows.push({ key: g.id, title: g.title, kind: "Decision", date: g.created_date, event: "proposed", note: g.summary });
    for (const h of g.changelog || []) rows.push({ key: `${g.id}-${h.date}-${h.event}`, title: g.title, kind: "Decision", date: h.date, event: h.event, note: h.note });
  }
  for (const f of d.findings) {
    rows.push({ key: f.id, title: f.finding_text, kind: "Rex finding", date: f.tested_date || f.created_date, event: "detected", note: f.severity });
    for (const h of f.history || []) rows.push({ key: `${f.id}-${h.date}-${h.event}`, title: f.finding_text, kind: "Rex finding", date: h.date, event: h.event, note: h.note });
  }
  for (const c of d.changes) {
    rows.push({ key: c.id, title: `${c.page_path} metadata applied`, kind: "Applied change", date: c.change_date, event: "applied", note: c.target_keyword ? `Target: ${c.target_keyword}` : "" });
    if (c.gsc_after_measured) rows.push({ key: `${c.id}-after`, title: `${c.page_path} measured after change`, kind: "Applied change", date: c.change_date, event: "verified", note: `Clicks ${c.gsc_before_clicks} → ${c.gsc_after_clicks}` });
  }
  return rows.filter((r) => r.date).sort((a, b) => t(b.date) - t(a.date)).slice(0, 250);
};

export const buildExperiments = (d) => {
  const fromImprovements = d.improvements
    .filter((i) => i.before_result || i.after_result)
    .map((i) => ({
      id: i.id,
      title: i.title,
      metric: i.verification_test || "Verification test not stated",
      before: i.before_result || "Not recorded",
      after: i.after_result || "Not recorded",
      status: i.status,
      verified: Boolean(i.after_result),
      basis: i.after_result
        ? "Before/after readings recorded on this record."
        : "No post-change measurement recorded — effect not demonstrated.",
      date: i.verified_date || i.updated_date,
    }));

  const fromSearch = d.changes
    .filter((c) => c.gsc_after_measured)
    .map((c) => ({
      id: c.id,
      title: `${c.page_path} metadata change`,
      metric: `Search Console, ${c.gsc_window_days || 28}-day window`,
      before: `${c.gsc_before_clicks} clicks · ${c.gsc_before_impressions} impressions · avg position ${c.gsc_before_position}`,
      after: `${c.gsc_after_clicks} clicks · ${c.gsc_after_impressions} impressions · avg position ${c.gsc_after_position}`,
      status: "applied",
      verified: true,
      basis: "Search Console readings before and after the change. Other factors may contribute; this is correlation unless the change was the only variable.",
      date: c.change_date,
    }));

  return [...fromImprovements, ...fromSearch];
};

export function useAdaptive() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const reload = useCallback(async () => {
    try {
      setData(derive(await load()));
      setError("");
    } catch (e) {
      setError(e?.message || "Could not load the audit record.");
      setData(null);
    }
  }, []);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, reload };
}