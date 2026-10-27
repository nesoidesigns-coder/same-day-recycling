import { AlertTriangle, Clock, Database, MapPin, ShieldCheck } from "lucide-react";

// Provenance block for a Rex demand analysis. Every value is read from the
// stored record; when a value is missing it says so instead of guessing.
export default function InsightProvenance({ insight }) {
  const generated = insight.generated_at || insight.created_date;
  const dataPeriod = insight.data_period || insight.period;
  const geo = insight.geo_coverage || {};
  const missing = insight.missing_data || [];
  const sources = insight.sources_used || [];

  const rows = [
    ["Generated", generated ? new Date(generated).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : "unavailable"],
    ["Last source refresh", insight.last_source_refresh ? new Date(insight.last_source_refresh).toLocaleString("en-CA", { dateStyle: "medium" }) : "not recorded"],
    ["Sources used", sources.length ? sources.join(", ") : "not recorded"],
    ["Underlying records", insight.record_count ? Number(insight.record_count).toLocaleString("en-CA") : "not recorded"],
    ["Geographic coverage", geo.provinces || geo.cities ? `${geo.provinces || 0} provinces · ${geo.cities || 0} cities${geo.unresolved ? ` · ${geo.unresolved} unresolved` : ""}` : "not recorded"],
    ["Evidence confidence", insight.confidence || "not recorded"],
  ];

  return (
    <div className="rounded-2xl bg-[#f6f9f8] border border-slate-100 p-4 mb-5">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65] flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5" /> Report provenance
        </span>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase text-amber-900">AI analysis, not verified data</span>
      </div>

      <div className={`rounded-xl px-3 py-2 mb-3 text-xs font-semibold ${dataPeriod ? "bg-white text-[#102B2A]" : "bg-amber-50 text-amber-900 border border-amber-200"}`}>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {dataPeriod
            ? <>Data period: <span className="font-bold">{dataPeriod}</span></>
            : "Historical analysis — data period unavailable."}
        </span>
      </div>

      <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="text-xs">
            <dt className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</dt>
            <dd className="text-slate-700 font-semibold break-words">{value}</dd>
          </div>
        ))}
      </dl>

      {missing.length > 0 && (
        <div className="mt-3 rounded-xl bg-white border border-amber-200 p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-900 flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5" /> Not available when this analysis ran
          </div>
          <ul className="space-y-1">
            {missing.map((m) => (
              <li key={m} className="text-xs text-slate-600 flex items-start gap-1.5">
                <Database className="w-3 h-3 mt-0.5 shrink-0 text-slate-400" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {insight.basis && (
        <p className="mt-3 text-[11px] text-slate-500 flex items-start gap-1.5">
          <MapPin className="w-3 h-3 mt-0.5 shrink-0" /> {insight.basis}
        </p>
      )}
    </div>
  );
}