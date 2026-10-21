export default function HoloGauge({ value, label, sub }) {
  const deg = Math.max(0, Math.min(100, Number(value) || 0)) * 3.6;
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-32 h-32 rounded-full transition-all duration-1000"
        style={{ background: `conic-gradient(#1d9e56 ${deg}deg, rgba(29,158,86,0.12) ${deg}deg)` }}
      >
        <div className="absolute inset-2 rounded-full bg-[#06251b] holo-panel-deep flex flex-col items-center justify-center">
          <div className="text-2xl font-bold text-[#a8f0cc] holo-glow-text">{value}%</div>
        </div>
      </div>
      <div className="text-center">
        <div className="text-sm font-bold text-[#a8f0cc]">{label}</div>
        {sub && <div className="text-[11px] text-emerald-200/50">{sub}</div>}
      </div>
    </div>
  );
}