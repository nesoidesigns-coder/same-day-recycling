import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2, ListChecks, Play, Import, BrainCircuit, ChevronDown, ChevronUp,
  AlertTriangle, ShieldCheck, ExternalLink, CheckCircle2, ArrowRight, Monitor,
  TrendingUp, MapPin, Clock, X,
} from "lucide-react";

const FLOW = ["detected", "reviewed", "approved", "in_progress", "testing", "verified", "completed"];
const OPEN_FLOW = FLOW.slice(0, 6);

// Solid badges: white/charcoal text on solid fills, readable at 11px bold.
const SEVERITY_STYLE = {
  critical: "bg-red-600 text-white",
  major: "bg-amber-500 text-[#3b2303]",
  minor: "bg-slate-600 text-white",
};
const STATUS_STYLE = {
  detected: "bg-[#102B2A] text-white",
  reviewed: "bg-[#b45309] text-white",
  approved: "bg-[#187B65] text-white",
  in_progress: "bg-[#187B65] text-white",
  testing: "bg-[#54D9AE] text-[#102B2A]",
  verified: "bg-[#0f5c3f] text-white",
  completed: "bg-[#0f5c3f] text-white",
  declined: "bg-slate-200 text-slate-600",
};

const fmtDate = (d) => (d ? new Date(d).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "");

// Evidence-driven Improvement Queue, redesigned mobile-first: a compact
// operational summary up top, readable finding cards below, secondary statuses
// tucked into an expandable section. Every finding carries its evidence,
// impact, recommended fix, verification test and before/after results through a
// fixed lifecycle. The queue tracks — it never publishes changes; the owner
// approves each step.
export default function ImprovementQueue() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [diagId, setDiagId] = useState("");
  const [importing, setImporting] = useState(false);
  const [expanded, setExpanded] = useState("");
  const [notice, setNotice] = useState("");
  const [afterDraft, setAfterDraft] = useState({});
  const [rendering, setRendering] = useState(false);
  const [renderResults, setRenderResults] = useState([]);
  const [measuringId, setMeasuringId] = useState("");
  const [moreStatuses, setMoreStatuses] = useState(false);

  const load = useCallback(async () => {
    const page = await base44.entities.Improvement.filter({}, { sort: "-created_date", limit: 200 });
    setItems(page.items || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const run = async (action, extra = {}) => {
    const res = await base44.functions.invoke("improvementEngine", { action, ...extra });
    return res.data;
  };

  const doScan = async () => {
    setScanning(true);
    setNotice("");
    try {
      const r = await run("scan");
      setNotice(`Scan complete: ${r.checked} pages checked, ${r.new_findings?.length || 0} new findings (${r.critical_count || 0} critical).`);
      await load();
    } catch (e) {
      setNotice("Scan failed: " + (e?.response?.data?.error || e?.message || "no details returned — retry from this panel"));
    } finally {
      setScanning(false);
    }
  };

  const doImport = async () => {
    setImporting(true);
    setNotice("");
    try {
      const r = await run("import_findings");
      setNotice(`Imported ${r.imported} open finding(s) from the Evidence Inspector.`);
      await load();
    } catch (e) {
      setNotice("Import failed: " + (e?.response?.data?.error || e?.message || "no details returned — retry from this panel"));
    } finally {
      setImporting(false);
    }
  };

  const doRenderTest = async () => {
    setRendering(true);
    setNotice("");
    try {
      const r = await run("render_test");
      setRenderResults(r.results || []);
      setNotice(`Render test complete: ${r.tested} pages tested, ${r.new_findings?.length || 0} new findings queued.`);
      await load();
    } catch (e) {
      setNotice("Render test failed: " + (e?.response?.data?.error || e?.message || "no details returned — retry from this panel"));
    } finally {
      setRendering(false);
    }
  };

  // Change tracking: record real GSC impressions/clicks for this page in the
  // improvement's history, so before/after impact is measured, not claimed.
  const measure = async (item) => {
    setMeasuringId(item.id);
    setNotice("");
    try {
      const r = await base44.functions.invoke("searchAuthority", { action: "measure", page_url: item.evidence_url });
      const d = r.data || {};
      const note = `GSC 28d: ${d.current?.clicks ?? 0} clicks / ${d.current?.impressions ?? 0} impressions (previous 28d: ${d.previous?.clicks ?? 0} / ${d.previous?.impressions ?? 0})`;
      const history = [...(item.history || []), { date: new Date().toISOString(), event: "measured", note }];
      await base44.entities.Improvement.update(item.id, { history });
      setNotice("Measurement recorded: " + note);
      await load();
    } catch (e) {
      setNotice("Measurement failed: " + (e?.response?.data?.error || e?.message || "no details returned — retry from this panel"));
    } finally {
      setMeasuringId("");
    }
  };

  const diagnose = async (id) => {
    setDiagId(id);
    setNotice("");
    try {
      await run("diagnose", { improvement_id: id });
      setExpanded(id);
      await load();
    } catch (e) {
      setNotice("Rex diagnosis failed: " + (e?.response?.data?.error || e?.message || "no details returned — retry from this panel"));
    } finally {
      setDiagId("");
    }
  };

  const setStatus = async (item, status, note) => {
    const history = [...(item.history || []), { date: new Date().toISOString(), event: status, note: note || `Status moved to ${status}.` }];
    const patch = { status, history };
    if (status === "verified") {
      patch.verified_date = new Date().toISOString().slice(0, 10);
      patch.verified_by = "owner";
    }
    if (status === "completed" && item.status !== "verified") {
      patch.verified_date = item.verified_date || new Date().toISOString().slice(0, 10);
    }
    await base44.entities.Improvement.update(item.id, patch);
    setExpanded("");
    await load();
  };

  if (loading) {
    return <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-10 text-center"><Loader2 className="w-6 h-6 text-[#187B65] animate-spin mx-auto" /></div>;
  }

  const open = items.filter((i) => OPEN_FLOW.includes(i.status));
  const done = items.filter((i) => i.status === "completed" || i.status === "declined");
  const byStatus = (s) => items.filter((i) => i.status === s).length;
  const criticalOpen = open.filter((i) => i.severity === "critical").length;
  const awaitingApproval = byStatus("detected") + byStatus("reviewed");
  const inProgress = byStatus("approved") + byStatus("in_progress") + byStatus("testing");
  const verifiedFixes = byStatus("verified") + byStatus("completed");
  const resolved = verifiedFixes + byStatus("declined");
  const progressPct = items.length ? Math.round((resolved / items.length) * 100) : 0;

  return (
    <div>
      <div className="mb-6">
        <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#187B65] flex items-center gap-2">
          <ListChecks className="w-4 h-4" /> Improvement engine
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#102B2A] tracking-tight mt-1">Improvement Queue</h1>
        <p className="text-base text-slate-600 mt-2 max-w-2xl">
          Every finding becomes a measurable opportunity: evidence, impact, recommended fix, verification test and before/after results. The queue never publishes changes — you approve each step.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button onClick={doScan} disabled={scanning} className="min-h-[46px] rounded-full bg-[#187B65] text-white font-bold px-5 text-sm hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {scanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Run diagnostics
          </button>
          <button onClick={doImport} disabled={importing} className="min-h-[46px] rounded-full border-2 border-[#102B2A] text-[#102B2A] font-bold px-5 text-sm hover:bg-[#102B2A] hover:text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Import className="w-4 h-4" />} Import findings
          </button>
          <button onClick={doRenderTest} disabled={rendering} className="min-h-[46px] rounded-full border-2 border-[#102B2A] text-[#102B2A] font-bold px-5 text-sm hover:bg-[#102B2A] hover:text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
            {rendering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Monitor className="w-4 h-4" />} Render test
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-2xl border border-[#187B65]/40 bg-[#eef6f2] px-4 py-3 text-sm text-[#102B2A] mb-5 flex items-start justify-between gap-3">
          <span className="break-words">{notice}</span>
          <button onClick={() => setNotice("")} aria-label="Dismiss" className="shrink-0 text-slate-500 hover:text-[#102B2A]"><X className="w-4 h-4" /></button>
        </div>
      )}

      {renderResults.length > 0 && (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 mb-6">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#187B65] mb-3">Render test — what Google receives (existing pages only)</div>
          <div className="space-y-2">
            {renderResults.map((r) => (
              <div key={r.url} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#f4f7f5] px-3.5 py-2.5">
                <span className="text-xs text-slate-600 font-mono break-all">{String(r.url).replace(/^https?:\/\/[^/]+/, "")}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${r.issues.length === 0 ? "bg-[#187B65] text-white" : "bg-amber-500 text-[#3b2303]"}`}>
                  {r.issues.length === 0 ? "renders clean" : `${r.issues.length} issue${r.issues.length === 1 ? "" : "s"}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Compact operational summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mb-4">
        <StatCard label="Total findings" value={items.length} tone="text-[#102B2A]" />
        <StatCard label="Critical issues" value={criticalOpen} tone={criticalOpen ? "text-red-600" : "text-[#187B65]"} />
        <StatCard label="Awaiting approval" value={awaitingApproval} tone="text-[#b45309]" />
        <StatCard label="In progress" value={inProgress} tone="text-[#187B65]" />
        <StatCard label="Verified fixes" value={verifiedFixes} tone="text-[#187B65]" />
        <StatCard label="Closed / declined" value={byStatus("declined")} tone="text-slate-500" />
      </div>

      {/* Progress bar: resolved share of all findings */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3.5 mb-6">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="font-semibold text-[#102B2A] flex items-center gap-2"><TrendingUp className="w-4 h-4 text-[#187B65]" /> Queue progress</span>
          <span className="font-bold text-[#102B2A] tabular-nums">{progressPct}% resolved ({resolved} of {items.length})</span>
        </div>
        <div className="mt-2 h-2.5 rounded-full bg-slate-100 overflow-hidden">
          <div className="h-full rounded-full bg-[#187B65] transition-all" style={{ width: `${progressPct}%` }} />
        </div>
        <button onClick={() => setMoreStatuses(!moreStatuses)} className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#187B65] min-h-[44px]">
          {moreStatuses ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} All statuses &amp; lifecycle
        </button>
        {moreStatuses && (
          <>
            <div className="mt-2 flex flex-wrap gap-2">
              {FLOW.concat(["declined"]).map((s) => (
                <span key={s} className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLE[s] || "bg-slate-200 text-slate-600"}`}>
                  {s.replace("_", " ")}: {byStatus(s)}
                </span>
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-600">Lifecycle: detected → reviewed → approved → in progress → testing (awaiting verification) → verified → completed. Declined removes a finding from the open queue.</p>
          </>
        )}
      </div>

      {open.length === 0 ? (
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-8 text-center text-base text-slate-600">
          Nothing open. Run diagnostics or import findings to populate the queue.
        </div>
      ) : (
        <div className="space-y-3">
          {open.map((item) => {
            const idx = FLOW.indexOf(item.status);
            const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
            const open_ = expanded === item.id;
            return (
              <div key={item.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-4 md:p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.minor}`}>{item.severity}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLE[item.status] || "bg-slate-200 text-slate-600"}`}>{item.status.replace("_", " ")}</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600">{item.effort} effort</span>
                    {item.verified_date && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[#eef6f2] px-2.5 py-1 text-[11px] font-bold text-[#0f5c3f]"><Clock className="w-3 h-3" /> verified {fmtDate(item.verified_date)}</span>
                    )}
                  </div>

                  {item.evidence_url && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-[13px] font-mono text-slate-600 break-all">
                      <MapPin className="w-3.5 h-3.5 text-[#187B65] shrink-0 mt-0.5" /> {item.evidence_url.replace(/^https?:\/\//, "")}
                    </div>
                  )}

                  <h3 className="mt-2 text-base font-bold text-[#102B2A] leading-snug">{item.title}</h3>

                  <div className="mt-1.5 text-[13px] text-slate-600">{item.source.replace("_", " ")} · owner: {item.owner} · recorded {fmtDate(item.created_date)}</div>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button onClick={() => { setExpanded(open_ ? "" : item.id); setAfterDraft({}); }} className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full border-2 border-[#102B2A] text-[#102B2A] font-bold px-4 text-sm hover:bg-[#102B2A] hover:text-white transition-colors">
                      {open_ ? "Hide details" : "Details & actions"} {open_ ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {next && (
                      <button onClick={() => setStatus(item, next)} className="min-h-[44px] inline-flex items-center gap-1.5 rounded-full bg-[#187B65] text-white font-bold px-4 text-sm hover:bg-[#125C4E] transition-colors">
                        {next === "verified" ? "Mark verified" : `Advance to ${next.replace("_", " ")}`} <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {open_ && (
                  <div className="border-t border-slate-100 bg-[#f4f7f5] p-4 md:p-5 space-y-3.5">
                    <DetailBlock icon={ShieldCheck} title="Evidence" body={item.evidence || "No evidence recorded yet."} link={item.evidence_url} />
                    <DetailBlock icon={AlertTriangle} title="Expected impact (business)" body={item.business_impact || "Not yet assessed — ask Rex for a diagnosis."} />
                    <DetailBlock icon={BrainCircuit} title="Recommended correction" body={item.recommendation || "Not yet proposed."} />
                    <DetailBlock icon={CheckCircle2} title="Verification test" body={item.verification_test || "Not yet defined."} />
                    <div className="grid md:grid-cols-2 gap-3">
                      <DetailBlock title="Before result" body={item.before_result || "Not recorded."} />
                      <DetailBlock title="After result" body={item.after_result || "Not recorded."} />
                    </div>

                    {(item.history || []).length > 0 && (
                      <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-[13px] text-slate-600 space-y-1">
                        {(item.history || []).map((h, k) => (
                          <div key={k} className="break-words">· {fmtDate(h.date)} — {h.event}{h.note ? `: ${h.note}` : ""}</div>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {!item.recommendation && (
                        <button onClick={() => diagnose(item.id)} disabled={diagId === item.id} className="min-h-[46px] rounded-full border-2 border-[#187B65] bg-[#eef6f2] text-[#0f5c3f] font-bold px-4 text-sm hover:bg-[#187B65] hover:text-white disabled:opacity-60 flex items-center justify-center gap-2">
                          {diagId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />} Ask Rex to diagnose
                        </button>
                      )}
                      {next === "verified" && (
                        <>
                          <input
                            value={afterDraft[item.id] ?? ""}
                            onChange={(e) => setAfterDraft((d) => ({ ...d, [item.id]: e.target.value }))}
                            placeholder="Measured after-result (required to verify)"
                            className="min-h-[46px] rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-base text-[#102B2A] placeholder:text-slate-500 sm:col-span-2"
                          />
                          <button
                            onClick={() => {
                              const val = (afterDraft[item.id] || "").trim();
                              if (!val) { setNotice("Enter a measured after-result before verifying — never claim a fix without a measurement."); return; }
                              base44.entities.Improvement.update(item.id, { after_result: val }).then(() => setStatus({ ...item, after_result: val }, "verified", "Verified with measured after-result: " + val));
                            }}
                            className="min-h-[46px] rounded-full bg-[#187B65] text-white font-bold px-4 text-sm hover:bg-[#125C4E] transition-colors"
                          >
                            Save &amp; verify
                          </button>
                        </>
                      )}
                      {/samedayrecycling\.ca/.test(item.evidence_url || "") && (
                        <button onClick={() => measure(item)} disabled={measuringId === item.id} className="min-h-[46px] rounded-full border-2 border-slate-300 text-[#102B2A] font-bold px-4 text-sm hover:border-[#187B65] disabled:opacity-60 flex items-center justify-center gap-2">
                          {measuringId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <TrendingUp className="w-4 h-4" />} Measure GSC impact
                        </button>
                      )}
                      <button onClick={() => setStatus(item, "declined", "Owner declined this improvement.")} className="min-h-[46px] rounded-full border-2 border-slate-300 text-slate-600 font-bold px-4 text-sm hover:border-red-500 hover:text-red-600 transition-colors">
                        Decline
                      </button>
                    </div>
                    {next === "verified" && !item.before_result && (
                      <p className="text-sm text-[#92400e] flex items-start gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> Tip: record a before-result (edit after verification if needed) so the before/after comparison is real.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {done.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-extrabold text-[#102B2A] tracking-tight mb-3">Completed &amp; declined</h2>
          <div className="space-y-2">
            {done.map((item) => (
              <div key={item.id} className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-[#102B2A] min-w-0">{item.title}</div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLE[item.status] || "bg-slate-200 text-slate-600"}`}>{item.status}</span>
                </div>
                {item.after_result && <div className="text-[13px] text-slate-600 mt-1 break-words">After: {item.after_result}</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[13px] text-slate-600 mt-8">
        Scores in this Command Centre are internal Same Day Recycling measurements and AI estimates — clearly labelled, never official Google authority metrics. Verified vs estimated data is marked on every panel.
      </p>
    </div>
  );
}

function StatCard({ label, value, tone }) {
  return (
    <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-4 py-3.5">
      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold tabular-nums ${tone}`}>{value}</div>
    </div>
  );
}

function DetailBlock({ icon: Icon, title, body, link }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {Icon && <Icon className="w-3.5 h-3.5 text-[#187B65]" />} {title}
      </div>
      <div className="text-base text-[#102B2A] mt-1 break-words">{body}</div>
      {link && (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#187B65] inline-flex items-center gap-1 mt-1 hover:underline break-all">
          <ExternalLink className="w-3.5 h-3.5 shrink-0" /> open evidence
        </a>
      )}
    </div>
  );
}