import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Star, MessageSquareQuote } from "lucide-react";

export default function CityReviews({ city }) {
  const [reviews, setReviews] = useState(null);

  useEffect(() => {
    (async () => {
      const { items } = await base44.entities.Review.filter(
        { city: city.name, approved: true },
        { sort: "-created_date", limit: 12 }
      );
      setReviews(items);
    })();
  }, [city.name]);

  if (!reviews || reviews.length === 0) return null;

  return (
    <section className="bg-[#f4f7f5] py-16 md:py-20">
      <div className="max-w-7xl mx-auto px-4">
        <div className="max-w-2xl mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1d9e56]/10 px-4 py-1.5 text-sm font-semibold text-[#0c3b24]">
            <MessageSquareQuote className="w-4 h-4 text-[#1d9e56]" />
            Reviews
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-bold text-[#0c3b24] tracking-tight">
            What {city.name} customers say
          </h2>
          <p className="mt-3 text-slate-600 text-lg">Real reviews from verified, completed pickups.</p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-3xl bg-white border border-slate-100 p-6 shadow-sm">
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`w-4 h-4 ${n <= (r.rating || 5) ? "text-[#1d9e56] fill-[#1d9e56]" : "text-slate-200"}`} />
                ))}
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">"{r.text}"</p>
              <p className="mt-4 text-sm font-bold text-[#0c3b24]">{r.customer_name}</p>
              <p className="text-xs text-slate-400">Verified customer · {r.city || city.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}