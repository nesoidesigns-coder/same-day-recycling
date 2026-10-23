import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

// Private admin table: nine tracked systems, each with a real-test status
// (pass / warning / fail) and technical detail from the systemHealth endpoint.
const BADGE = {
  pass: { label: "Pass", cls: "bg-[#187B65]/10 text-[#187B65] border-[#187B65]/30", icon: ShieldCheck },
  warning: { label: "Warning", cls: "bg-amber-50 text-amber-700 border-amber-200", icon: ShieldQuestion },
  fail: { label: "Fail", cls: "bg-red-50 text-red-600 border-red-200", icon: ShieldAlert },
};

export default function SystemsStatusTable({ systems }) {
  if (!systems?.length) return null;
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm mb-6">
      <h2 className="text-lg font-bold text-[#102B2A] mb-3">System status (live test results)</h2>
      <div className="space-y-2">
        {systems.map((s) => {
          const b = BADGE[s.status] || BADGE.warning;
          const Icon = b.icon;
          return (
            <div key={s.system} className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 border-b border-slate-50 pb-2 last:border-0">
              <div className="flex items-center gap-2 sm:w-52 shrink-0">
                <Icon className={`w-4 h-4 shrink-0 ${s.status === "pass" ? "text-[#187B65]" : s.status === "fail" ? "text-red-500" : "text-amber-500"}`} />
                <span className="text-sm font-semibold text-[#102B2A]">{s.system}</span>
              </div>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${b.cls}`}>{b.label}</span>
              <span className="text-xs text-slate-500 leading-relaxed">{s.detail}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}