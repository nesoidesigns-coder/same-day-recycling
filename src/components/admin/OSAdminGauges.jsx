import MetricGauge from "@/components/os/MetricGauge";
import { OS_COLORS } from "@/components/os/gaugeCore";

// Master admin gauges — the shared OSIntelligenceGauge family. Percentage
// arcs are drawn only where a meaningful denominator exists (resolved
// dispatches, closed jobs, sessions); otherwise the instrument stays empty
// with an honest caption. No blended or decorative scores.
export default function OSAdminGauges({
  visits,
  completionRate,
  closed,
  acceptanceRate,
  dispatchedCount,
  dispatchSuccess,
}) {
  const w30 = visits?.windows?.["30d"] || visits?.windows?.thirty_day || null;
  const sessions = Number(w30?.sessions) || 0;
  const confirmed = Number(w30?.bookings?.confirmed) || 0;
  const conversion = sessions > 0 ? Math.round((confirmed / sessions) * 100) : null;

  const gauges = [
    {
      key: "conversion",
      label: "Conversion rate",
      span: conversion,
      color: OS_COLORS.green,
      caption: conversion != null
        ? `${confirmed} confirmed booking${confirmed === 1 ? "" : "s"} from ${sessions} sessions, 30 days`
        : "No sessions in the 30-day window yet.",
    },
    {
      key: "completion",
      label: "Job completion rate",
      span: completionRate,
      color: OS_COLORS.cyan,
      caption: completionRate != null
        ? `Of ${closed} closed job${closed === 1 ? "" : "s"} (completed vs cancelled)`
        : "No closed jobs yet — completes with the first completed or cancelled job.",
    },
    {
      key: "acceptance",
      label: "Contractor acceptance",
      span: acceptanceRate,
      color: OS_COLORS.blue,
      caption: dispatchedCount === 0
        ? "No dispatched jobs yet."
        : `${acceptanceRate}% of ${dispatchedCount} dispatched job${dispatchedCount === 1 ? "" : "s"}`,
    },
    {
      key: "dispatch",
      label: "Dispatch success",
      span: dispatchSuccess,
      color: OS_COLORS.amber,
      caption: dispatchedCount === 0
        ? "No dispatched jobs yet."
        : `${dispatchSuccess}% of dispatched job${dispatchedCount === 1 ? "" : "s"} completed`,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      {gauges.map((g) => (
        <div key={g.key} className="rounded-2xl border border-slate-200/70 bg-white shadow-sm p-4 text-center">
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-li-slate">{g.label}</div>
          <div className="mt-1">
            <MetricGauge value={g.span} display={g.span != null ? `${g.span}%` : undefined} label={g.label} color={g.color} appearance="light" size={150} />
          </div>
          <p className="mt-1 text-[10px] leading-snug text-li-slate">{g.caption}</p>
        </div>
      ))}
    </div>
  );
}