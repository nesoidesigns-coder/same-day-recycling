import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CheckCircle2, Loader2, Phone, Wrench } from "lucide-react";

export default function FreeMetalPickup() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", metal: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await base44.functions.invoke('createBooking', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        items_description: `FREE METAL PICKUP — ${form.metal}`,
        quote_estimate: "Free",
      });
      setDone(true);
    } catch {
      setError("Couldn't submit right now — please call (604) 849-1745.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white">
      <section className="bg-[#0c3b24] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Free Metal Pickup</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            FREE Metal Pickup —<br />
            <span className="text-[#1d9e56]">We haul it, you pay $0</span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-xl leading-relaxed">
            Old or broken appliances, car parts, bikes — anything metal. Free same-day pickup across Vancouver and the Lower Mainland. We recycle every load.
          </p>
          <a
            href="tel:+16048491745"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-8 py-4 hover:bg-[#17a04c] transition-colors"
          >
            <Phone className="w-5 h-5" />
            Text or Call (604) 849-1745
          </a>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Or book online</div>
        <h2 className="text-3xl font-bold tracking-tight text-[#0c3b24] mb-8">Tell us what metal you've got</h2>
        {done ? (
          <div className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-[#1d9e56] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#0c3b24]">You're booked!</h3>
            <p className="mt-3 text-slate-600">
              We'll text or call you shortly to confirm your free same-day pickup.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-6 md:p-8 space-y-4">
            <label className="block">
              <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Your name</span>
              <input required value={form.name} onChange={set("name")} className="input" placeholder="Jane Smith" />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Email</span>
              <input required type="email" value={form.email} onChange={set("email")} className="input" placeholder="you@email.com" />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Phone</span>
              <input required type="tel" value={form.phone} onChange={set("phone")} className="input" placeholder="(604) 555-1234" />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Pickup address</span>
              <input required value={form.address} onChange={set("address")} className="input" placeholder="123 Main St, Vancouver" />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">What metal do you have?</span>
              <textarea
                required
                value={form.metal}
                onChange={set("metal")}
                rows={3}
                className="input resize-none"
                placeholder="e.g. old fridge, washer and a couple of rusty bikes"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 hover:bg-[#17a04c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
              {saving ? "Booking…" : "Book my free pickup"}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        )}
      </section>
    </div>
  );
}