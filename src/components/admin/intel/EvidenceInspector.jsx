import { useEffect, useState } from "react";
import { Loader2, ChevronDown, ChevronUp, Microscope, CheckCircle2, XCircle, ClipboardCheck, RotateCcw, ExternalLink, Globe } from "lucide-react";
import { base44 } from "@/api/base44Client";

const SEVERITY_STYLE = {
  critical: "bg-red-50 border-red-200 text-red-700",
  major: "bg-amber-50 border-amber-200 text-amber-700",
  minor: "bg-slate-50 border-slate-200 text-slate-600",
};
const STATUS_META = {
  open: { label: "Awaiting approval", tone: "bg-slate-50 border-slate-200 text-slate-600" },
  approved: { label: "Fix approved", tone: "bg-sky-50 border-sky-200 text-sky-700" },
  resolved: { label: "Retest: resolved", tone: "bg-[#187B65]/10 border-[#187B65]/30 text-[#187B65]" },
  not_resolved: { label: "Retest: not resolved", tone: "bg-red-50 border-red-200 text-red-700" },
};

// Evidence Inspector: click any Rex finding to see the tested URL, test date,
// actual observed result, severity and proposed fix. Approve the fix, and once
// it's implemented, Rex retests the live page and reports resolved or not.
// Findings come from two sources: brand scans and Rex's deep research passes.
export default function EvidenceInspector({ scanId }) {
  const [findings, setFindings] = useState(null);
  const [research, setResearch] = useState([]);
  const [openId, setOpenId] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("evidenceInspector", { action: "sync", scan_id: scanId || undefined });
      setFindings(res.data?.findings || []);
      setResearch(res.data?.research || []);
    } catch {
      setFindings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* once per visit; classifications are cached in records */ }, [scanId]);

  const act = async (finding, action) => {
    setBusyId(finding.id + action);
    try {
      await base44.functions.invoke("evidenceInspector", { action, id: finding.id });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  const shared = { openId, setOpenId, busyId, act };

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <div className="flex items-center gap-2 mb-1">
        <Microscope className="w-4 h-4 text-[#187B65]" />
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">Rex Evidence Inspector</h2>
      </div>
      <p className="text-xs text-slate-500 mb-4">Select a finding to see the tested URL, test date, actual result, severity and Rex's proposed fix. Approve a fix, implement it, then retest — Rex verifies on the live site and reports resolved or not resolved.</p>

      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" /> Opening the evidence inspector…
        </div>
      ) : (
        <>
          {!findings.length && research.length === 0 ? (
            <p className="text-sm text-slate-600 py-4">No findings tracked yet — run a brand scan above and its findings will appear here for inspection.</p>
          ) : (
            <div className="space-y-5">
              {findings.length > 0 && (
                <div className="space-y-2">
                  {findings.map((f) => <FindingCard key={f.id} f={f} {...shared} />)}
                </div>
              )}
              {research.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2 pt-2 border-t border-slate-100">
                    <Globe className="w-3.5 h-3.5 text-[#187B65]" />
                    <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Deep research findings</h3>
                    <span className="text-[10px] text-slate-400">from Rex's web research</span>
                  </div>
                  <div className="space-y-2">
                    {research.map((f) => <FindingCard key={f.id} f={f} {...shared} />)}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FindingCard({ f, openId, setOpenId, busyId, act }) {
  const open = openId === f.id;
  const busy = busyId !== null;
  return (
    <div className="rounded-2xl border border-slate-100 overflow-hidden">
      <button
        onClick={() => setOpenId(open ? null : f.id)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left bg-[#f4f7f5] hover:bg-[#eef4f0] transition-colors"
      >
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${SEVERITY_STYLE[f.severity] || SEVERITY_STYLE.minor}`}>{f.severity}</span>
        <span className="flex-1 min-w-0 text-xs font-bold text-[#102B2A] truncate">{f.finding_text}</span>
        <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider hidden sm:inline ${STATUS_META[f.status]?.tone || ""}`}>{STATUS_META[f.status]?.label || f.status}</span>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-4 py-4 bg-white space-y-3 text-xs">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Tested URL">
              <a href={f.source_url} target="_blank" rel="noopener" className="font-semibold text-[#187B65] hover:underline break-all inline-flex items-center gap-1">
                {f.source_url} <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </Field>
            <Field label="Test date"><span className="font-semibold text-[#102B2A]">{f.tested_date}</span></Field>
            <Field label="Basis">
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase ${f.finding_kind === "verified" ? "bg-[#187B65]/10 border-[#187B65]/30 text-[#187B65]" : "bg-amber-50 border-amber-200 text-amber-700"}`}>
                {f.finding_kind === "verified" ? "Verified against live content" : "AI estimate — not verified"}
              </span>
            </Field>
            <Field label="Severity"><span className="font-semibold text-[#102B2A] capitalize">{f.severity}</span></Field>
          </div>

          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Actual result at test time</div>
            <p className="text-[#102B2A] leading-relaxed bg-[#f4f7f5] rounded-xl px-3 py-2">{f.actual_result || "—"}</p>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Proposed fix</div>
            <p className="text-[#102B2A] leading-relaxed bg-[#eef4f0] rounded-xl px-3 py-2">{f.proposed_fix}</p>
          </div>

          {f.retest_date && (
            <div className={`rounded-xl border px-3 py-2.5 ${f.status === "resolved" ? "bg-[#187B65]/10 border-[#187B65]/30" : "bg-red-50 border-red-200"}`}>
              <div className={`font-bold uppercase tracking-wider text-[10px] inline-flex items-center gap-1.5 ${f.status === "resolved" ? "text-[#187B65]" : "text-red-700"}`}>
                {f.status === "resolved" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                Retest {String(f.retest_date)}: {f.status === "resolved" ? "Resolved" : "Not resolved"}
              </div>
              <p className="mt-1 text-[#102B2A] leading-relaxed">{f.retest_evidence}</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {f.status === "open" && (
              <button
                onClick={() => act(f, "approve")}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] text-white font-bold px-4 py-2 hover:bg-[#125C4E] transition-colors disabled:opacity-60"
              >
                {busyId === f.id + "approve" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ClipboardCheck className="w-3.5 h-3.5" />}
                Approve fix
              </button>
            )}
            {f.status === "approved" && (
              <span className="text-[11px] text-slate-500">Approved {f.approved_date} by {f.approved_by} — implement the fix, then retest.</span>
            )}
            {(f.status === "approved" || f.status === "resolved" || f.status === "not_resolved") && (
              <button
                onClick={() => act(f, "retest")}
                disabled={busy}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-[#187B65] text-[#187B65] font-bold px-4 py-2 hover:bg-[#eef4f0] transition-colors disabled:opacity-60"
              >
                {busyId === f.id + "retest" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                {f.retest_date ? "Retest again" : "Retest now"}
              </button>
            )}
          </div>

          {(f.history || []).length > 0 && (
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-100">
              {f.history.map((h, i) => <span key={i} className="mr-3">{String(h.date || "").slice(0, 10)} · {h.event}</span>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</div>
      <div>{children}</div>
    </div>
  );
}