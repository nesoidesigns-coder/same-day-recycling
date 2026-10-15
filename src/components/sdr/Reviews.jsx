import { Star } from "lucide-react";

export default function Reviews() {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 text-center">
        <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Reviews</div>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">
          Reviews coming soon — be our first to review.
        </h2>
        <div className="mt-5 flex justify-center text-[#1d9e56]">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-6 h-6" />)}
        </div>
        <p className="mt-5 text-slate-600 max-w-md mx-auto">
          Loved your pickup? Call us at <a href="tel:+16048491745" className="font-semibold text-[#1d9e56] hover:underline">(604) 849-1745</a> and tell us about it.
        </p>
      </div>
    </section>
  );
}