import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

// Prominent ranked next actions, each with what/why/do/measure. Only actions
// backed by live data appear here.
export default function NextActions({ actions, loading }) {
  if (loading) return null;
  if (!actions.length) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
        <div className="text-sm font-bold text-[#102B2A]">Recommended next actions</div>
        <p className="text-sm text-slate-500 mt-2">No data-backed actions right now — connect or refresh the data sources to surface opportunities.</p>
      </div>
    );
  }
  return (
    <div className="rounded-3xl bg-[#102B2A] text-emerald-50 p-5 md:p-6">
      <div className="text-sm font-bold text-[#54D9AE] uppercase tracking-[0.15em] mb-4">Recommended next actions</div>
      <ol className="space-y-4">
        {actions.map((a, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-[#54D9AE] text-[#102B2A] font-extrabold text-xs flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
            <div className="min-w-0">
              <div className="font-bold text-white text-sm">{a.what}</div>
              <div className="text-xs text-emerald-100/80 mt-0.5"><span className="font-semibold text-[#54D9AE]">Why:</span> {a.why}</div>
              <div className="text-xs text-emerald-100/80"><span className="font-semibold text-[#54D9AE]">Do:</span> {a.do}</div>
              <div className="text-xs text-emerald-100/80"><span className="font-semibold text-[#54D9AE]">Measure:</span> {a.measure}</div>
              {a.to && (
                <Link to={a.to} className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-[#54D9AE] hover:underline">
                  Open {a.module} <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}