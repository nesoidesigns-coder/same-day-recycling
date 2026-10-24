import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Image } from '@/components/ui/image';
import { Megaphone } from 'lucide-react';
import AdSenseSlot from '@/components/community/AdSenseSlot';

// In-feed promotional card. Always clearly labelled; opens links in a new
// tab; counts only real renders and clicks.
const gaEvent = (name, ad) => {
  if (typeof window.gtag === 'function') {
    window.gtag('event', name, { ad_id: ad.id, ad_kind: ad.kind, advertiser: ad.advertiser_name || '' });
  }
};

export default function FeedAdCard({ ad }) {
  const tracked = useRef(false);

  useEffect(() => {
    if (ad.kind === 'adsense' || tracked.current) return;
    tracked.current = true;
    base44.functions.invoke('communityAds', { action: 'track', id: ad.id, event: 'impression' }).catch(() => {});
    gaEvent('community_ad_impression', ad);
  }, [ad]);

  if (ad.kind === 'adsense') return <AdSenseSlot publisherId={ad.publisher_id} slotId={ad.slot_id} />;

  const onClick = () => {
    base44.functions.invoke('communityAds', { action: 'track', id: ad.id, event: 'click' }).catch(() => {});
    gaEvent('community_ad_click', ad);
    window.open(ad.link_url, '_blank', 'noopener');
  };

  return (
    <article className="rounded-2xl border border-[#187B65]/25 bg-[#f4f7f5] p-4">
      <span className="inline-flex items-center gap-1 rounded-full bg-[#187B65]/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#187B65]">
        <Megaphone className="w-3 h-3" /> {ad.kind === 'sponsored' ? `Sponsored${ad.advertiser_name ? ` · ${ad.advertiser_name}` : ''}` : 'Promoted'}
      </span>
      <button onClick={onClick} className="mt-2 block w-full text-left">
        {ad.image_url && (
          <div className="mb-3 overflow-hidden rounded-xl border border-slate-100">
            <Image src={ad.image_url} alt="" className="max-h-56 w-full" fittingType="fill" />
          </div>
        )}
        <h3 className="text-base font-bold text-[#102B2A] leading-snug">{ad.headline}</h3>
        {ad.body && <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{ad.body}</p>}
        <span className="mt-2.5 inline-block rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white">{ad.cta_label || 'Learn more'}</span>
      </button>
    </article>
  );
}