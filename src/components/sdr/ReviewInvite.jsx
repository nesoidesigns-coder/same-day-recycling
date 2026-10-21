import { Link } from "react-router-dom";
import { Star } from "lucide-react";

export default function ReviewInvite() {
  return (
    <div className="mt-8 rounded-2xl bg-[#f4f7f5] border border-[#187B65]/20 p-6 text-center">
      <div className="flex justify-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className="w-6 h-6 text-[#187B65] fill-[#187B65]" />
        ))}
      </div>
      <h4 className="text-lg font-bold text-[#102B2A]">Rate your service</h4>
      <p className="text-sm text-slate-600 mt-1">
        Once your pickup is complete, we'd love a quick rating and a short comment — it helps neighbours find us.
      </p>
      <Link
        to="/review"
        className="mt-4 inline-block rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-2.5 hover:bg-[#125C4E] transition-colors text-sm"
      >
        Leave a review
      </Link>
    </div>
  );
}