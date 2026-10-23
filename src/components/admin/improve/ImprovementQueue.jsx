import { useCallback, useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2, ListChecks, Play, Import, BrainCircuit, ChevronDown, ChevronUp,
  AlertTriangle, ShieldCheck, ExternalLink, CheckCircle2, ArrowRight, Flag, Monitor, TrendingUp,
} from "lucide-react";

const FLOW = ["detected", "reviewed", "approved", "in_progress", "testing", "verified", "completed"];
const SEVERITY_STYLE = {
  critical: "bg-red-500/10 text-red-300 border-red-400/40",
  major: "bg-amber-400/10 text-amber-300 border-amber-400/40",
  minor: "bg-slate-400/10 text-slate-300 border-slate-400/40",
};
const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";
const label = "text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]/90";

// Evidence-driven Improvement Queue. Every audit finding carries its evidence,
// impact, recommendation, verification test and before/after results through a
// fixed lifecycle. Publishing changes, prices, customer data, contracts and
// payment/booking systems always require owner approval — the queue tracks,
// it never acts.
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
      setNotice("Scan failed: " + (e?.response?.data?.error || e?.message || "unknown error"));
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
      setNotice("Import failed: " + (e?.response?.data?.error || e?.message || "unknown error"));
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
      setNotice("Render test failed: " + (e?.response?.data?.error || e?.message || "unknown error"));
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
      setNotice("Measurement failed: " + (e?.response?.data?.error || e?.message || "unknown error"));
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
      setNotice("Rex diagnosis failed: " + (e?.response?.data?.error || e?.message || "unknown error"));
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
    return <div className={`${panel} p-10 text-center`}><Loader2 className="w-6 h-6 text-[#187B65] animate-spin mx-auto" /></div>;
  }

  const open = items.filter((i) => FLOW.slice(0, 6).includes(i.status));
  const done = items.filter((i) => i.status === "completed" || i.status === "declined");
  const byStatus = (s) => open.filter((i) => i.status === s).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <div className={`${label} flex items-center gap-2`}>
            <ListChecks className="w-3.5 h-3.5 text-[#187B65]" /> Improvement engine
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">Improvement Queue</h1>
          <p className="text-sm text-emerald-100/50 mt-1 max-w-xl">
            Every finding becomes a measurable opportunity: evidence, impact, recommended fix, verification test and before/after results. The queue never publishes changes — you approve each step.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={doScan} disabled={scanning} className="rounded-full bg-[#187B65] text-[#032015] font-bold px-4 py-2.5 text-xs hover:bg-[#1FA184] transition-colors disabled:opacity-60 flex items-center gap-2">
            {scanning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />} Run diagnostics
          </button>
          <button onClick={doImport} disabled={importing} className="rounded-full border border-[#187B65]/40 text-emerald-50 font-bold px-4 py-2.5 text-xs hover:border-[#187B65] transition-colors disabled:opacity-60 flex items-center gap-2">
            {importing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Import className="w-3.5 h-3.5" />} Import findings
          </button>
          <button onClick={doRenderTest} disabled={rendering} className="rounded-full border border-[#187B65]/40 text-emerald-50 font-bold px-4 py-2.5 text-xs hover:border-[#187B65] transition-colors disabled:opacity-60 flex items-center gap-2">
            {rendering ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Monitor className="w-3.5 h-3.5" />} Render test
          </button>
        </div>
      </div>

      {notice && <div className="rounded-xl border border-[#187B65]/30 bg-[#0a2b1e]/60 px-4 py-2.5 text-xs text-emerald-100/80 mb-4">{notice}</div>}

      {renderResults.length > 0 && (
        <div className={`${panel} p-5 mb-6`}>
          <div className={`${label} mb-3`}>Render test — what Google receives (existing pages only)</div>
          <div className="space-y-2">
            {renderResults.map((r) => (
              <div key={r.url} className="flex items-center justify-between gap-3 rounded-xl border border-[#187B65]/20 bg-[#0a2b1e]/40 px-3.5 py-2.5">
                <span className="text-xs text-emerald-100/70 font-mono truncate">{String(r.url).replace(/^https?:\/\/[^/]+/, "")}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${r.issues.length === 0 ? "bg-[#187B65]/15 text-[#187B65] border border-[#187B65]/30" : "bg-amber-400/10 text-amber-300 border border-amber-400/40"}`}>
                  {r.issues.length === 0 ? "renders clean" : `${r.issues.length} issue${r.issues.length === 1 ? "" : "s"}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-8">
        {FLOW.map((s) => (
          <div key={s} className={`${panel} p-3 text-center`}>
            <div className="text-2xl font-bold text-white tabular-nums">{byStatus(s)}</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 mt-1">{s.replace("_", " ")}</div>
          </div>
        ))}
      </div>

      {open.length === 0 ? (
        <div className={`${panel} p-8 text-center text-emerald-100/50 text-sm`}>
          Nothing open. Run diagnostics or import findings to populate the queue.
        </div>
      ) : (
        <div className="space-y-3">
          {open.map((item) => {
            const idx = FLOW.indexOf(item.status);
            const next = idx >= 0 && idx < FLOW.length - 1 ? FLOW[idx + 1] : null;
            const open_ = expanded === item.id;
            return (
              <div key={item.id} className={`${panel} p-5`}>
                <button onClick={() => { setExpanded(open_ ? "" : item.id); setAfterDraft({}); }} className="w-full text-left flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <Flag className={`w-4 h-4 mt-1 shrink-0 ${item.severity === "critical" ? "text-red-400" : item.severity === "major" ? "text-amber-300" : "text-slate-400"}`} />
                    <div className="min-w-0">
                      <div className="font-bold text-white text-sm">{item.title}</div>
                      <div className="text-[11px] text-emerald-100/40 mt-1">{item.source.replace("_", " ")} · {item.effort} effort · owner: {item.owner}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full border px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider ${SEVERITY_STYLE[item.severity]}`}>{item.severity}</span>
                    <span className="rounded-full bg-[#187B65]/15 border border-[#187B65]/30 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#187B65]">{item.status.replace("_", " ")}</span>
                    {open_ ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                {open_ && (
                  <div className="mt-4 border-t border-[#187B65]/20 pt-4 space-y-3">
                    <DetailRow icon={ShieldCheck} title="Evidence" body={item.evidence || "No evidence recorded yet."} link={item.evidence_url} />
                    <DetailRow icon={AlertTriangle} title="Business impact" body={item.business_impact || "Not yet assessed — ask Rex for a diagnosis."} />
                    <DetailRow icon={BrainCircuit} title="Recommended solution" body={item.recommendation || "Not yet proposed."} />
                    <DetailRow icon={CheckCircle2} title="Verification test" body={item.verification_test || "Not yet defined."} />
                    <div className="grid sm:grid-cols-2 gap-3">
                      <DetailRow title="Before" body={item.before_result || "Not recorded."} />
                      <DetailRow title="After" body={item.after_result || "Not recorded."} />
                    </div>

                    {(item.history || []).length > 0 && (
                      <div className="rounded-xl border border-[#187B65]/20 bg-[#0a2b1e]/40 px-3 py-2 text-[11px] text-emerald-100/60">
                        {(item.history || []).map((h, k) => (
                          <div key={k}>· {new Date(h.date).toLocaleString("en-CA")} — {h.event}{h.note ? `: ${h.note}` : ""}</div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      {!item.recommendation && (
                        <button onClick={() => diagnose(item.id)} disabled={diagId === item.id} className="rounded-full border border-[#187B65]/50 bg-[#187B65]/10 text-[#187B65] font-bold px-4 py-2 text-xs hover:bg-[#187B65]/20 disabled:opacity-60 flex items-center gap-2">
                          {diagId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BrainCircuit className="w-3.5 h-3.5" />} Ask Rex to diagnose
                        </button>
                      )}
                      {next && (
                        <button onClick={() => setStatus(item, next)} className="rounded-full bg-[#187B65] text-[#032015] font-bold px-4 py-2 text-xs hover:bg-[#1FA184] transition-colors flex items-center gap-2">
                          {next === "verified" ? "Mark verified" : `Advance to ${next.replace("_", " ")}`} <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {next === "verified" && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <input
                            value={afterDraft[item.id] ?? ""}
                            onChange={(e) => setAfterDraft((d) => ({ ...d, [item.id]: e.target.value }))}
                            placeholder="Measured after-result (required to verify)"
                            className="rounded-xl border border-[#187B65]/25 bg-white/95 px-3 py-2 text-xs text-[#102B2A] min-w-56"
                          />
                          <button
                            onClick={() => {
                              const val = (afterDraft[item.id] || "").trim();
                              if (!val) { setNotice("Enter a measured after-result before verifying — never claim a fix without a measurement."); return; }
                              base44.entities.Improvement.update(item.id, { after_result: val }).then(() => setStatus({ ...item, after_result: val }, "verified", "Verified with measured after-result: " + val));
                            }}
                            className="rounded-full bg-[#187B65] text-[#032015] font-bold px-4 py-2 text-xs hover:bg-[#1FA184] transition-colors"
                          >
                            Save &amp; verify
                          </button>
                        </div>
                      )}
                      {/samedayrecycling\.ca/.test(item.evidence_url || "") && (
                        <button onClick={() => measure(item)} disabled={measuringId === item.id} className="rounded-full border border-[#187B65]/40 text-emerald-50 font-bold px-4 py-2 text-xs hover:border-[#187B65] disabled:opacity-60 flex items-center gap-2">
                          {measuringId === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />} Measure GSC impact
                        </button>
                      )}
                      <button onClick={() => setStatus(item, "declined", "Owner declined this improvement.")} className="rounded-full border border-emerald-100/20 text-emerald-100/50 font-bold px-4 py-2 text-xs hover:border-red-400/40 hover:text-red-300 transition-colors">
                        Decline
                      </button>
                    </div>
                    {next === "verified" && !item.before_result && (
                      <p className="text-[10px] text-amber-300">Tip: record a before-result (edit after verification if needed) so the before/after comparison is real.</p>
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
          <h2 className="text-lg font-bold text-white tracking-tight mb-3">Completed &amp; declined</h2>
          <div className="space-y-2">
            {done.map((item) => (
              <div key={item.id} className={`${panel} px-4 py-3 flex items-center justify-between gap-3`}>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{item.title}</div>
                  {item.after_result && <div className="text-[11px] text-emerald-100/40 mt-0.5">After: {item.after_result}</div>}
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider shrink-0 ${item.status === "completed" ? "bg-[#187B65]/15 text-[#187B65] border border-[#187B65]/30" : "bg-slate-500/10 text-slate-300 border border-slate-400/30"}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[11px] text-slate-400 mt-8">
        Scores in this Command Centre are internal Same Day Recycling measurements and AI estimates — clearly labelled, never official Google authority metrics. Verified vs estimated data is marked on every panel.
      </p>
    </div>
  );
}

function DetailRow({ icon: Icon, title, body, link }) {
  return (
    <div className="flex items-start gap-2.5">
      {Icon ? <Icon className="w-3.5 h-3.5 text-[#187B65] mt-0.5 shrink-0" /> : <span className={`${label} shrink-0 mt-0.5`}>{title}</span>}
      <div className="min-w-0">
        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">{title}</div>
        <div className="text-xs text-emerald-100/70 mt-0.5 break-words">{body}</div>
        {link && (
          <a href={link} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#187B65] inline-flex items-center gap-1 mt-1 hover:underline">
            <ExternalLink className="w-3 h-3" /> open evidence
          </a>
        )}
      </div>
    </div>
  );
}