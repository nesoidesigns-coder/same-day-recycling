import { useEffect, useRef, useState } from "react";

const C = 2 * Math.PI * 50;

export default function ProgressRing({ value, target, display, targetDisplay, label }) {
  const [drawn, setDrawn] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    raf.current = requestAnimationFrame(() => setDrawn(Number(value) || 0));
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  const pct = target > 0 ? (Number(value) || 0) / target * 100 : 0;
  const capped = Math.max(0, Math.min(100, pct));
  const over = pct > 100;
  const color = over ? "hsl(var(--li-infra))" : "hsl(var(--li-btn))";

  return (
    <div>
      <svg viewBox="0 0 120 120" className="w-full max-w-[180px] mx-auto" role="img" aria-label={`${label || "Progress"}: ${capped.toFixed(0)}% of target`}>
        <circle cx="60" cy="60" r="50" fill="none" strokeWidth="10" style={{ stroke: "hsl(var(--li-steel))" }} />
        <circle
          cx="60"
          cy="60"
          r="50"
          fill="none"
          strokeWidth="10"
          strokeLinecap="round"
          transform="rotate(-90 60 60)"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - capped / 100)}
          className="transition-[stroke-dashoffset] duration-700 ease-out motion-reduce:transition-none"
          style={{ stroke: color }}
        />
        <text x="60" y="58" textAnchor="middle" fontSize="18" fontWeight="700" className="fill-li-carbon">{display}</text>
        <text x="60" y="74" textAnchor="middle" fontSize="9" className="fill-li-slate" fontWeight="600">
          {targetDisplay ? `of ${targetDisplay}` : ""}
        </text>
      </svg>
      <div className="mt-1 text-center text-[11px] font-semibold" style={{ color }}>
        {over ? `Over target by ${Math.round(pct - 100)}%` : `${capped.toFixed(0)}% of target`}
      </div>
    </div>
  );
}