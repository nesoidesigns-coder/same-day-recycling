import { useLayoutEffect, useRef } from "react";

// Sums float too high for screen readers and count-up flicker resets their
// context — this keeps an accurate value announced without cluttering the UI.
export default function SummaryNumber({ value, suffix, className, animate = true, approx = false }) {
  const ref = useRef(null);
  const text = approx ? `about ${Math.round(value).toLocaleString('en-CA')}` : Math.round(value).toLocaleString('en-CA');
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !animate || prefersReduced()) return;
    el.textContent = '0';
    let raf; const t0 = performance.now(); const target = Number(value) || 0;
    const step = (t) => { const p = Math.min((t - t0) / 1200, 1); el.textContent = `${approx ? 'about ' : ''}${Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString('en-CA')}`; if (p < 1) raf = requestAnimationFrame(step); };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [value, animate]);
  const prefersReduced = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return (
    <span ref={ref} className={className} role="status">
      {text}
      {suffix}
    </span>
  );
}