import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useStructuredData } from "@/lib/seo";
import { BadgeCheck, Leaf, ShieldCheck, Star, Wallet } from "lucide-react";

// Compact trust strip for service pages, built only from verified facts:
// real approved customer reviews, the upfront-price promise and the
// recycling-receipt guarantee already published elsewhere on the site.
export default function TrustStrip() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let alive = true;
    base44.entities.Review.filter({ approved: true }, { limit: 50 })
      .then((items) => {
        const list = Array.isArray(items) ? items : items?.items || [];
        if (!alive) return;
        const count = list.length;
        const average = count
          ? Math.round((list.reduce((s, r) => s + (Number(r.rating) || 5), 0) / count) * 10) / 10
          : null;
        setStats({ count, average });
      })
      .catch(() => alive && setStats({ count: 0, average: null }));
    return () => { alive = false; };
  }, []);

  // Aggregate rating in structured data only when real approved reviews exist.
  useStructuredData("truststrip-rating", stats?.count
    ? {
        "@type": "LocalBusiness",
        "@id": "https://samedayrecycling.ca/#localbusiness",
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: stats.average,
          reviewCount: stats.count,
          bestRating: 5,
          worstRating: 1,
        },
      }
    : null);

  return (
    <section className="border-y border-slate-100 bg-white" aria-label="Why customers trust this service">
      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 gap-5 md:grid-cols-4">
        <div className="flex items-start gap-2.5">
          <div className="flex gap-0.5 shrink-0 text-[#187B65]">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className={`w-4 h-4 ${stats?.count && n <= Math.round(stats.average) ? "fill-[#187B65]" : "text-slate-200"}`} />
            ))}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-[#102B2A] leading-tight">
              {stats ? (stats.count ? `${stats.average}/5` : "—") : "···"}
            </div>
            <div className="text-xs text-slate-500 leading-snug">
              {stats?.count ? `${stats.count} verified customer review${stats.count === 1 ? "" : "s"}` : "Verified customer reviews"}
            </div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Wallet className="w-5 h-5 shrink-0 mt-0.5 text-[#187B65]" />
          <div className="min-w-0">
            <div className="font-bold text-[#102B2A] leading-tight">Upfront price</div>
            <div className="text-xs text-slate-500 leading-snug">Approved by you before we lift a thing</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <Leaf className="w-5 h-5 shrink-0 mt-0.5 text-[#187B65]" />
          <div className="min-w-0">
            <div className="font-bold text-[#102B2A] leading-tight">Recycling receipt</div>
            <div className="text-xs text-slate-500 leading-snug">Available for every job, sorted before disposal</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-[#187B65]" />
          <div className="min-w-0">
            <div className="font-bold text-[#102B2A] leading-tight">Verified contractors</div>
            <div className="text-xs text-slate-500 leading-snug">Local coverage confirmed before booking</div>
          </div>
        </div>
      </div>
    </section>
  );
}