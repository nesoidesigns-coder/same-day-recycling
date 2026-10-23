import PulseRing, { formatCount, useCountUp, prefersReducedMotion } from "./PulseRing";

// Same Day Recycling's own measured capture, rendered with the same circular
// gauge design but in GOLD — deliberately a different palette from the green
// market-estimate gauges so industry demand and our own numbers can never be
// mistaken for each other. Values come from the verified DemandSnapshot
// (aggregates only — never raw visitor or customer data).
function CaptureRing({ label, value, sub }) {
  const ready = value !== null && value !== undefined;
  const animate = ready && !prefersReducedMotion();
  const display = useCountUp(Number(value) || 0, { animate });
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-[#F2D48A]/25 bg-white/[0.03] px-4 py-5 text-center">
      <PulseRing value={ready ? Number(value) : 1} size={104} kind="activity" palette="gold" spin={ready}>
        {ready ? (
          <>
            <span className="text-lg font-extrabold text-white tabular-nums">{formatCount(display)}</span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-white/50">measured</span>
          </>
        ) : (
          <>
            <span className="text-lg font-bold text-white/60">—</span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider text-white/50">pending</span>
          </>
        )}
      </PulseRing>
      <div className="text-sm font-bold text-white/90">{label}</div>
      <div className="text-[10px] text-white/40">{sub}</div>
    </div>
  );
}

export default function CaptureGauges({ capture }) {
  if (!capture) return null;
  const gsc = capture.gsc || {};
  const ga = capture.ga || {};
  const os = capture.recycling_os || {};
  return (
    <div className="mt-8 rounded-3xl border border-[#F2D48A]/25 bg-white/[0.03] p-5 sm:p-6">
      <div className="mb-2 flex flex-wrap items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#F2D48A]">
        Same Day Recycling verified capture
        <span className="rounded-full border border-[#F2D48A]/40 px-2 py-0.5 text-[9px] tracking-wider">our numbers — not market demand</span>
      </div>
      <p className="mb-4 text-center text-xs text-white/50">
        Our own measured performance, shown in gold. The green gauges above are industry-wide market estimates.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <CaptureRing label="Search clicks" value={gsc.clicks} sub="28 days · Google Search Console" />
        <CaptureRing label="Site sessions" value={ga.sessions} sub="28 days · Google Analytics" />
        <CaptureRing label="Completed pickups" value={os.completed_pickups} sub="Verified platform records" />
      </div>
    </div>
  );
}