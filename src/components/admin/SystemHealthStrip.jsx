import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Activity } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Verified system health — every status comes from a real check performed by
// the systemHealth function. Green = verified healthy, amber = degraded,
// coral = confirmed error, neutral = unknown or still checking. Nothing is
// labelled healthy without a valid check behind it.
const STATUS = {
  pass: { dot: "bg-cine-green", text: "text-emerald-700", ring: "border-emerald-200 bg-emerald-50/60", label: "Healthy" },
  warning: { dot: "bg-amber-400", text: "text-amber-700", ring: "border-amber-200 bg-amber-50/60", label: "Degraded" },
  fail: { dot: "bg-red-400", text: "text-red-600", ring: "border-red-200 bg-red-50/60", label: "Error" },
  unknown: { dot: "bg-slate-300", text: "text-slate-500", ring: "border-slate-200 bg-white", label: "Unknown" },
};

export default function SystemHealthStrip() {
  const [systems, setSystems] = useState(null);
  const [checkedAt, setCheckedAt] = useState(null);

  useEffect(() => {
    let alive = true;
    base44.functions.invoke("systemHealth", {})
      .then((r) => {
        if (!alive) return;
        setSystems(r?.data?.systems || []);
        setCheckedAt(r?.data?.generated_at || null);
      })
      .catch(() => alive && setSystems([]));
    return () => { alive = false; };
  }, []);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.15em] text-li-carbon">
          <Activity className="w-4 h-4 text-li-infra" /> System health
        </h2>
        <span className="font-plex text-[10px] font-bold uppercase tracking-[0.16em] text-li-slate">
          {systems === null ? "Checking…" : checkedAt ? `Verified ${String(checkedAt).slice(0, 16).replace("T", " ")}` : "Checks unavailable"}
        </span>
      </div>
      {systems === null ? (
        <Loader2 className="w-5 h-5 text-li-infra animate-spin my-4" />
      ) : systems.length === 0 ? (
        <p className="py-2 text-sm text-li-slate">Health checks are unavailable right now — status stays unknown, not healthy.</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {systems.map((s) => {
            const meta = STATUS[s.status] || STATUS.unknown;
            return (
              <li key={s.system} className={`flex items-start gap-2.5 rounded-xl border px-3 py-2.5 ${meta.ring}`}>
                <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${meta.dot}`} aria-hidden="true" />
                <div className="min-w-0">
                  <div className={`text-xs font-bold ${meta.text}`}>{s.system} · {meta.label}</div>
                  <div className="mt-0.5 text-[11px] leading-snug text-li-slate">{s.detail}</div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <Link to="/admin/system" className="mt-3 inline-block text-xs font-bold text-li-infra hover:underline">
        Full system administration →
      </Link>
    </div>
  );
}