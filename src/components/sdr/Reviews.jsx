import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { BadgeCheck, ChevronLeft, ChevronRight, MapPin, Star } from "lucide-react";

const ROTATE_MS = 6000;

export default function Reviews() {
  const [reviews, setReviews] = useState(null);
  const [placeId, setPlaceId] = useState(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.Review.filter(
        { approved: true },
        { sort: "-created_date", limit: 50 }
      );
      const meta = await base44.entities.GoogleReviewsMeta.filter({}, { limit: 1 });
      setPlaceId(meta?.items?.[0]?.place_id || null);
      setReviews(items);
    })();
  }, []);

  useEffect(() => {
    if (!reviews || reviews.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % reviews.length), ROTATE_MS);
    return () => clearInterval(t);
  }, [reviews, index]);

  if (reviews === null) {
    return (
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Reviews</div>
          <div className="mt-6 flex justify-center gap-1">
            {[...Array(5)].map((_, i) => <div key={i} className="w-2.5 h-2.5 rounded-full bg-slate-200 animate-pulse" />)}
          </div>
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Reviews</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">
            Reviews coming soon — be our first to review.
          </h2>
          <div className="mt-5 flex justify-center text-[#187B65]">
            {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6" />)}
          </div>
          <p className="mt-5 text-slate-600 max-w-md mx-auto">
            Loved your pickup? Call us at <a href="tel:+16048491745" className="font-semibold text-[#187B65] hover:underline">(604) 849-1745</a> and tell us about it.
          </p>
        </div>
      </section>
    );
  }

  const r = reviews[index % reviews.length];

  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-10">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Reviews</div>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">
            What our customers say
          </h2>
        </div>
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl bg-[#f4f7f5] border border-slate-100 p-8 md:p-12 text-center">
            <div className="flex justify-center gap-1 text-[#187B65]">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} className={`w-5 h-5 ${n <= (r.rating || 5) ? "fill-[#187B65]" : "text-slate-200"}`} />
              ))}
            </div>
            <p key={r.id} className="mt-6 text-lg md:text-xl text-[#102B2A] leading-relaxed animate-in fade-in duration-500">
              "{r.text}"
            </p>
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <span className="font-bold text-[#102B2A]">{r.customer_name}</span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65]/15 text-[#187B65] font-bold px-4 py-1.5 text-sm">
                <BadgeCheck className="w-4 h-4" />
                Customer review
              </span>
              {r.city && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65]/15 text-[#187B65] font-bold px-4 py-1.5 text-sm">
                  <MapPin className="w-4 h-4" />
                  {r.city}
                </span>
              )}

            </div>
            {reviews.length > 1 && (
              <>
                <button
                  onClick={() => setIndex((i) => (i - 1 + reviews.length) % reviews.length)}
                  aria-label="Previous review"
                  className="absolute left-3 md:left-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:border-[#187B65] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5 text-[#102B2A]" />
                </button>
                <button
                  onClick={() => setIndex((i) => (i + 1) % reviews.length)}
                  aria-label="Next review"
                  className="absolute right-3 md:right-5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center hover:border-[#187B65] transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-[#102B2A]" />
                </button>
              </>
            )}
          </div>
          {reviews.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {reviews.map((rev, i) => (
                <button
                  key={rev.id}
                  onClick={() => setIndex(i)}
                  aria-label={`Review ${i + 1}`}
                  className={`h-2.5 rounded-full transition-all ${i === index ? "w-7 bg-[#187B65]" : "w-2.5 bg-slate-200 hover:bg-slate-300"}`}
                />
              ))}
            </div>
          )}
          <div className="mt-8 text-center">
            <a
              href={placeId
                ? `https://search.google.com/local/reviews?placeid=${placeId}`
                : "https://www.google.com/search?q=Same+Day+Recycling+reviews"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#187B65] hover:underline"
            >
              Read more of our reviews on Google
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}