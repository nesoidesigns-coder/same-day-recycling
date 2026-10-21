import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, ShieldCheck, AlertTriangle, XCircle, ExternalLink, Check, Ban } from "lucide-react";

const DOC_LABELS = [
  ["business_license_uri", "Business licence"],
  ["insurance_uri", "Insurance"],
  ["wcb_uri", "WCB"],
  ["vehicle_registration_uri", "Vehicle reg."],
  ["drivers_license_uri", "Driver's licence"],
];

const STATUS_STYLES = {
  new: "bg-slate-700 text-slate-200",
  ai_reviewed: "bg-amber-500/20 text-amber-300",
  approved: "bg-[#1d9e56]/20 text-[#1d9e56]",
  declined: "bg-red-500/20 text-red-300",
};

const VERDICT_ICONS = {
  pass: { icon: ShieldCheck, cls: "text-[#1d9e56]" },
  needs_attention: { icon: AlertTriangle, cls: "text-amber-400" },
  fail: { icon: XCircle, cls: "text-red-400" },
};

export default function AdminApplications() {
  const [apps, setApps] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [openingUri, setOpeningUri] = useState(null);

  const load = async () => {
    const page = await base44.entities.ContractorApplication.filter({}, { sort: "-created_date", limit: 50 });
    setApps(page.items || []);
  };

  useEffect(() => {
    load();
  }, []);

  const viewDoc = async (uri) => {
    setOpeningUri(uri);
    try {
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: uri });
      if (signed_url) window.open(signed_url, "_blank", "noopener");
    } finally {
      setOpeningUri(null);
    }
  };

  const setStatus = async (app, status) => {
    setBusyId(app.id);
    try {
      await base44.entities.ContractorApplication.update(app.id, {
        status,
        reviewed_date: new Date().toISOString().slice(0, 10),
      });
      await load();
    } finally {
      setBusyId(null);
    }
  };

  if (!apps) {
    return (
      <div className="admin-console min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#1d9e56] animate-spin" />
      </div>
    );
  }

  return (
    <div className="admin-console min-h-screen text-emerald-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h1 className="admin-headline text-2xl md:text-3xl font-bold tracking-tight">Contractor Applications</h1>
            <p className="text-sm text-emerald-100/50 mt-1">AI pre-checked applications awaiting your approval.</p>
          </div>
          <div className="text-sm font-bold text-[#1d9e56]">{apps.length} total</div>
        </div>

        {apps.length === 0 && (
          <div className="rounded-2xl border border-[#1d9e56]/20 bg-[#0c3b24]/40 p-10 text-center text-sm text-emerald-100/50">
            No applications yet. New contractor signups from /contractor-onboarding appear here.
          </div>
        )}

        <div className="space-y-4">
          {apps.map((app) => {
            const verdict = VERDICT_ICONS[app.ai_verdict] || VERDICT_ICONS.needs_attention;
            const VerdictIcon = verdict.icon;
            return (
              <div key={app.id} className="rounded-2xl border border-[#1d9e56]/20 bg-[#0c3b24]/40 p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg font-bold text-white">{app.company}</h2>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${STATUS_STYLES[app.status] || STATUS_STYLES.new}`}>
                        {app.status.replace("_", " ")}
                      </span>
                    </div>
                    <div className="text-sm text-emerald-100/60 mt-1">
                      {app.owner_name} · {app.city} · {app.email}
                      {app.phone && ` · ${app.phone}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {busyId === app.id ? (
                      <Loader2 className="w-5 h-5 text-[#1d9e56] animate-spin" />
                    ) : (
                      <>
                        {app.status !== "approved" && (
                          <button onClick={() => setStatus(app, "approved")} className="rounded-full bg-[#1d9e56] text-[#032015] font-bold px-4 py-2 text-xs hover:bg-[#25b96b] transition-colors flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                        )}
                        {app.status !== "declined" && (
                          <button onClick={() => setStatus(app, "declined")} className="rounded-full border border-red-400/40 text-red-300 font-bold px-4 py-2 text-xs hover:bg-red-500/10 transition-colors flex items-center gap-1.5">
                            <Ban className="w-3.5 h-3.5" /> Decline
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {(app.ai_summary || app.ai_issues?.length > 0) && (
                  <div className="mt-4 rounded-xl border border-[#1d9e56]/20 bg-[#051511]/60 p-4">
                    <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-100/60">
                      <VerdictIcon className={`w-4 h-4 ${verdict.cls}`} /> AI document check · {app.ai_verdict?.replace("_", " ")}
                    </div>
                    {app.ai_summary && <p className="mt-2 text-sm text-emerald-100/70">{app.ai_summary}</p>}
                    {app.ai_issues?.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {app.ai_issues.map((issue, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-amber-300/80">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-2">
                  {DOC_LABELS.filter(([field]) => app[field]).map(([field, label]) => (
                    <button
                      key={field}
                      onClick={() => viewDoc(app[field])}
                      disabled={openingUri === app[field]}
                      className="rounded-full border border-[#1d9e56]/30 bg-[#051511]/60 px-3 py-1.5 text-xs font-semibold text-emerald-100/80 hover:border-[#1d9e56] transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {openingUri === app[field] ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                      {label}
                    </button>
                  ))}
                </div>

                {(app.equipment?.length > 0 || app.fleet_description) && (
                  <div className="mt-3 text-xs text-emerald-100/50">
                    {app.equipment?.length > 0 && <span>{app.equipment.join(" · ")}</span>}
                    {app.fleet_description && <span className="block mt-1">{app.fleet_description}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}