import { ExternalLink, AlertOctagon } from "lucide-react";
import { fmtDate } from "./adaptiveData";

const SEV = {
  critical: "bg-red-100 text-red-700",
  major: "bg-amber-100 text-[#8f5d00]",
  minor: "bg-slate-200 text-slate-700",
};

const card = "rounded-2xl border border-li-steel bg-white p-4";

// What the platform actually observed. Every card carries the observation, the
// raw evidence and the page it was tested against — no evidence, no card.
export default function FindingsTab({ data }) {
  const integrityChecks = (data.lastRun?.checks || []).filter((c) => ["error", "warning"].includes(c.severity));
  const open = data.openFindings;
  const verifiedOpen = open.filter((f) => f.finding_kind !== "ai_estimate");
  const estimatedOpen = open.filter((f) => f.finding_kind === "ai_estimate");

  return (
    <div className="space-y-5">
      <div className={card}>
        <h3 className="text-sm font-bold text-li-carbon">Integrity sweep · {fmtDate(data.lastRun?.run_date)}</h3>
        {integrityChecks.length === 0 ? (
          <p className="mt-1 text-sm text-li-slate">The last sweep recorded no error or warning checks.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {integrityChecks.map((c) => (
              <li key={c.check} className="rounded-xl border border-li-steel/70 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <AlertOctagon className="h-3.5 w-3.5 text-li-amber" />
                  <span className="text-sm font-semibold text-li-carbon">{c.check}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${c.severity === "error" ? SEV.critical : SEV.major}`}>{c.severity}</span>
                </div>
                <p className="mt-1 text-xs text-li-slate">{c.summary || "No summary recorded."}</p>
                {(c.affected_pages || []).length > 0 && <p className="mt-1 text-[11px] text-li-slate">Affected: {c.affected_pages.join(", ")}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {[
        { label: "Verified findings", rows: verifiedOpen },
        { label: "Rex assessments (unconfirmed)", rows: estimatedOpen },
      ].map((group) => (
        <div key={group.label}>
          <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-li-slate">{group.label} · {group.rows.length}</h3>
          {group.rows.length === 0 ? (
            <div className={card}><p className="text-sm text-li-slate">Nothing open in this group.</p></div>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {group.rows.slice(0, 40).map((f) => (
                <div key={f.id} className={card}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${SEV[f.severity] || SEV.minor}`}>{f.severity}</span>
                    <span className="text-[11px] text-li-slate">Tested {fmtDate(f.tested_date)}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-li-carbon">{f.finding_text}</div>
                  <p className="mt-1 text-xs text-li-slate"><span className="font-semibold text-li-carbon">Evidence: </span>{f.actual_result || "No evidence recorded."}</p>
                  {f.proposed_fix && <p className="mt-1 text-xs text-li-slate"><span className="font-semibold text-li-carbon">Proposed fix: </span>{f.proposed_fix}</p>}
                  {f.source_url && (
                    <a href={f.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-li-infra underline">
                      Tested URL <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
      {open.length > 80 && <p className="text-xs text-li-slate">Showing the 40 most recent per group of {open.length} open findings.</p>}
    </div>
  );
}