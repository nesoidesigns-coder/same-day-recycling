import { Link } from "react-router-dom";
import { Star } from "lucide-react";

export default function ReviewInvite() {
  return (
    <div className="mt-8 rounded-2xl bg-[#f4f7f5] border border-[#1d9e56]/20 p-6 text-center">
      <div className="flex justify-center gap-1 mb-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star key={n} className="w-6 h-6 text-[#1d9e56] fill-[#1d9e56]" />
        ))}
      </div>
      <h4 className="text-lg font-bold text-[#0c3b24]">Rate your service</h4>
      <p className="text-sm text-slate-600 mt-1">
        Once your pickup is complete, we'd love a quick rating and a short comment — it helps neighbours find us.
      </p>
      <Link
        to="/review"
        className="mt-4 inline-block rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-6 py-2.5 hover:bg-[#17a04c] transition-colors text-sm"
      >
        Leave a review
      </Link>
    </div>
  );
}