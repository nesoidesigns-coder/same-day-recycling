import { useEffect, useRef, useState } from "react";

const R = 80;
const CX = 110;
const CY = 110;
const L = Math.PI * R;

const pointAt = (deg) => {
  const rad = (deg * Math.PI) / 180;
  return { x: CX - R * Math.cos(rad), y: CY - R * Math.sin(rad) };
};

export function speedoStatus(value, target, warning) {
  if (target == null) return "ok";
  if (value >= target) return "ok";
  if (warning != null && value >= warning) return "warn";
  return "bad";
}

const COLORS = { ok: "#10b981", warn: "#f59e0b", bad: "#ef4444" };
const STATUS_TEXT = { ok: "On target", warn: "Needs attention", bad: "Critical" };

export default function SpeedometerGauge({ value, min = 0, max = 100, unit = "%", target, warning, display }) {
  const [drawn, setDrawn] = useState(min);
  const raf = useRef(null);

  useEffect(() => {
    raf.current = requestAnimationFrame(() => setDrawn(Number(value) || 0));
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  const clamped = Math.max(min, Math.min(max, Number(value) || 0));
  const frac = Math.max(0, Math.min(1, (drawn - min) / (max - min || 1)));
  const status = speedoStatus(clamped, target, warning);
  const color = COLORS[status];

  let marker = null;
  if (target != null) {
    const tDeg = (180 * (target - min)) / (max - min || 1);
    const outer = pointAt(tDeg);
    const innerR = 62;
    const inner = { x: CX - innerR * Math.cos((tDeg * Math.PI) / 180), y: CY - innerR * Math.sin((tDeg * Math.PI) / 180) };
    marker = (
      <line x1={outer.x} y1={outer.y} x2={inner.x} y2={inner.y} stroke="#1e293b" strokeWidth="2.5" strokeLinecap="round" />
    );
  }

  return (
    <div>
      <svg viewBox="0 0 220 132" className="w-full" role="img" aria-label={`${STATUS_TEXT[status]}: ${display || clamped} ${unit}`}>
        <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} fill="none" stroke="#e5e7eb" strokeWidth="14" strokeLinecap="round" />
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={L}
          strokeDashoffset={L * (1 - frac)}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
        />
        {marker}
        <text x={CX} y={CY - 14} textAnchor="middle" fontSize="30" fontWeight="700" className="fill-slate-900">
          {display != null ? display : Math.round(clamped)}
        </text>
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize="11" className="fill-slate-400" fontWeight="600">{unit}</text>
        <text x={CX - R} y={CY + 20} textAnchor="middle" fontSize="9" className="fill-slate-400">{min}{unit}</text>
        <text x={CX + R} y={CY + 20} textAnchor="middle" fontSize="9" className="fill-slate-400">{max}{unit}</text>
        {target != null && (
          <text x={CX} y={CY + 20} textAnchor="middle" fontSize="9" className="fill-slate-500" fontWeight="700">target {target}{unit}</text>
        )}
      </svg>
      <div className="mt-1 text-center text-[11px] font-semibold" style={{ color }}>
        <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: color }} />
        {target == null ? "No target set" : STATUS_TEXT[status]}
      </div>
    </div>
  );
}