// Load-size visualization for the pricing page: where each published tier
// sits on the eight-eighths truck-space scale. Pure CSS/SVG, animates once
// when it enters view, static under reduced motion.
import { useEffect, useRef, useState } from "react";

const TIER_POS = [
  { key: "minimum_pickup", label: "Minimum pickup", eighths: 0.5 },
  { key: "eighth_truck", label: "1/8 truck", eighths: 1 },
  { key: "quarter_truck", label: "1/4 truck", eighths: 2 },
  { key: "half_truck", label: "1/2 truck", eighths: 4 },
  { key: "three_quarter_truck", label: "3/4 truck", eighths: 6 },
  { key: "full_truck", label: "Full truck", eighths: 8 },
];

export default function LoadSizeScale() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect(); } },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="rounded-2xl border border-slate-200 bg-white p-6" aria-label="Truck-space scale from minimum pickup to full truck">
      <div className="flex items-center justify-between text-xs font-bold text-[#102B2A]">
        <span>Minimum pickup</span>
        <span>Full truck</span>
      </div>
      <div className="relative mt-3">
        <div className="h-3 rounded-full bg-[#f4f7f5] border border-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-[#187B65] transition-[width] duration-500 ease-out"
            style={{ width: visible ? "100%" : "0%" }}
          />
        </div>
        {TIER_POS.map((t) => (
          <div key={t.key} className="absolute -top-1" style={{ left: `${(t.eighths / 8) * 100}%` }}>
            <div className="w-0.5 h-5 -translate-x-1/2 bg-[#102B2A]/30" />
            <div className="mt-1 -translate-x-1/2 whitespace-nowrap font-plex text-[10px] font-semibold text-[#102B2A]">
              {t.label}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-10 text-xs text-slate-600 leading-relaxed">
        Every load is measured in eighths of a truck. Smaller loads pay only for the space they fill — the price you approve on arrival is based on the measured space, never on a flat minimum.
      </p>
    </div>
  );
}