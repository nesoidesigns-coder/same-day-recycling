import { useEffect, useRef } from 'react';
import { Megaphone } from 'lucide-react';

// Google AdSense in-feed unit. The AdSense script is only injected while the
// owner has the network set to active — it never loads otherwise.
export default function AdSenseSlot({ publisherId, slotId }) {
  const insRef = useRef(null);

  useEffect(() => {
    if (!publisherId || !slotId || !insRef.current) return;
    let script = document.getElementById('adsbygoogle-script');
    if (!script) {
      script = document.createElement('script');
      script.id = 'adsbygoogle-script';
      script.async = true;
      script.crossOrigin = 'anonymous';
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(publisherId)}`;
      document.head.appendChild(script);
    }
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch { /* AdSense library not ready yet */ }
  }, [publisherId, slotId]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
        <Megaphone className="w-3 h-3" /> Sponsored
      </span>
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ display: 'block', marginTop: '8px' }}
        data-ad-client={publisherId}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}