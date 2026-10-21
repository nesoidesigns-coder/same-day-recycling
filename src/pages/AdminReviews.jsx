import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Star } from "lucide-react";

export default function AdminReviews() {
  const [reviews, setReviews] = useState(null);

  const load = async () => {
    const { items } = await base44.entities.Review.filter({}, { sort: "-created_date", limit: 100 });
    setReviews(items);
  };

  useEffect(() => { load().catch(() => setReviews([])); }, []);

  const setApproved = async (r, approved) => {
    await base44.entities.Review.update(r.id, { approved });
    load();
  };

  const remove = async (r) => {
    await base44.entities.Review.delete(r.id);
    load();
  };

  if (!reviews) return <Loader2 className="w-8 h-8 text-[#187B65] animate-spin mx-auto my-20" />;

  const pending = reviews.filter((r) => !r.approved).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-[#102B2A] tracking-tight">Reviews</h1>
        <p className="text-sm text-slate-500 mt-1">{pending > 0 ? `${pending} awaiting approval` : "All submitted reviews are moderated"} · approved reviews go live on the site</p>
      </div>
      {reviews.length === 0 ? (
        <p className="text-slate-500 text-sm rounded-2xl bg-white border border-slate-200/70 p-8 text-center">No reviews yet — reviews submitted at /review appear here for approval.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <div key={r.id} className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-[#102B2A]">{r.customer_name}</span>
                    <span className="rounded-full bg-slate-100 text-slate-600 px-2.5 py-0.5 text-[11px] font-bold">{r.city || "—"}</span>
                    {r.approved
                      ? <span className="rounded-full bg-[#187B65]/15 text-[#187B65] px-2.5 py-0.5 text-[11px] font-bold">Live</span>
                      : <span className="rounded-full bg-amber-100 text-amber-700 px-2.5 py-0.5 text-[11px] font-bold">Pending</span>}
                  </div>
                  <div className="flex gap-0.5 mt-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`w-3.5 h-3.5 ${n <= (r.rating || 5) ? "text-[#187B65] fill-[#187B65]" : "text-slate-200"}`} />
                    ))}
                  </div>
                  <p className="text-sm text-slate-600 mt-2 max-w-xl">{r.text}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {r.approved ? (
                    <button onClick={() => setApproved(r, false)} className="rounded-full border border-slate-200 text-slate-600 font-bold px-4 py-2 text-xs hover:border-[#187B65]">Unpublish</button>
                  ) : (
                    <button onClick={() => setApproved(r, true)} className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-4 py-2 text-xs hover:bg-[#125C4E]">Approve</button>
                  )}
                  <button onClick={() => remove(r)} className="rounded-full bg-red-50 text-red-600 font-bold px-4 py-2 text-xs hover:bg-red-100">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}