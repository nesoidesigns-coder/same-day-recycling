import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import { Star, Loader2, CheckCircle2 } from "lucide-react";

export default function ReviewPage() {
  const [form, setForm] = useState({ customer_name: "", phone: "", city: "", text: "" });
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await base44.functions.invoke("submitReview", { ...form, rating });
      setDone(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Something went wrong. Please call (604) 849-1745 for help.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#f4f7f5] flex items-center justify-center px-4">
        <div className="rounded-3xl bg-white p-10 border border-slate-100 text-center max-w-md">
          <CheckCircle2 className="w-14 h-14 text-[#1d9e56] mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-[#0c3b24]">Thanks for the review!</h1>
          <p className="mt-3 text-slate-600">We'll take a look and post it to our service pages shortly.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f7f5] py-12 px-4">
      <form onSubmit={handleSubmit} className="max-w-lg mx-auto rounded-3xl bg-white p-6 md:p-8 border border-slate-100 shadow-sm">
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} star${n === 1 ? "" : "s"}`}>
              <Star className={`w-8 h-8 ${n <= rating ? "text-[#1d9e56] fill-[#1d9e56]" : "text-slate-300"}`} />
            </button>
          ))}
        </div>
        <h1 className="text-2xl font-bold text-[#0c3b24]">Leave a review</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">For completed pickups — we verify each review against your booking.</p>
        <div className="space-y-4">
          <label className="block">
            <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Your name<span className="text-[#1d9e56]"> *</span></span>
            <input value={form.customer_name} onChange={update("customer_name")} required className="input" placeholder="Your name" />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Phone you booked with<span className="text-[#1d9e56]"> *</span></span>
            <input value={form.phone} onChange={update("phone")} required type="tel" className="input" placeholder="(604) 000-0000" />
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">City</span>
            <select value={form.city} onChange={update("city")} className="input">
              <option value="">Select your city</option>
              {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Your review<span className="text-[#1d9e56]"> *</span></span>
            <textarea value={form.text} onChange={update("text")} required rows={4} className="input resize-none" placeholder="How did we do?" />
          </label>
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        <button disabled={submitting} className="mt-6 w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 hover:bg-[#17a04c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
          {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : "Submit review"}
        </button>
      </form>
    </div>
  );
}