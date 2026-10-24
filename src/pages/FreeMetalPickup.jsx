import { useState } from "react";
import { useSEO } from "@/lib/seo";
import { useServiceMeta } from "@/components/seo/useServiceMeta";
import { base44 } from "@/api/base44Client";
import { getSessionId } from "@/lib/visitSession";
import RexBanner from "@/components/sdr/RexBanner";
import { CheckCircle2, Loader2, Phone, Wrench } from "lucide-react";
import { CITIES, cityLabel } from "@/lib/cities";
import { isCityActive } from "@/lib/coverage";

export default function FreeMetalPickup() {
  const meta = useServiceMeta("/free-metal-pickup", {
    title: "Free Scrap Metal Pickup | Same Day Recycling",
    description: "Check free scrap metal pickup in confirmed service areas. Describe your metal items, request collection and confirm eligibility with the team.",
  });
  useSEO({ ...meta, path: "/free-metal-pickup" });
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", city: "", metal: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [waitlisted, setWaitlisted] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      // Nationwide inquiry model: only operator cities confirm a booking;
      // every other market becomes a national inquiry (never discarded).
      if (!isCityActive(form.city)) {
        await base44.functions.invoke('nationalRequest', {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          service_type: 'metal_pickup',
          items_description: `FREE METAL PICKUP — ${form.metal}`,
        });
        base44.analytics.track({ eventName: "national_request_submitted", properties: { city: form.city, service: "metal_pickup" } });
        setWaitlisted(true);
        setDone(true);
        return;
      }
      await base44.functions.invoke('createBooking', {
        name: form.name,
        email: form.email,
        phone: form.phone,
        address: form.address,
        city: form.city,
        items_description: `FREE METAL PICKUP — ${form.metal}`,
        quote_estimate: "Free-pickup eligibility and price pending confirmation",
        sid: getSessionId(),
      });
      base44.analytics.track({ eventName: 'booking_submitted' });
      if (typeof window.gtag === "function") {
        window.gtag("event", "booking_submitted", { currency: "CAD", value: 1 });
      }
      setDone(true);
    } catch {
      setError("Couldn't submit right now — please call (604) 849-1745.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white">
      <RexBanner message="Tell me about your scrap metal and city. We'll check free-pickup eligibility and contractor availability before confirming." />
      <section className="bg-[#102B2A] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Free Metal Pickup</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            FREE Metal Pickup —<br />
            <span className="text-[#187B65]">Check eligibility before pickup</span>
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-xl leading-relaxed">
            Submit a scrap metal pickup request from anywhere in Canada. Free-pickup eligibility depends on your items and location; charges may apply outside Vancouver. A provider listing does not guarantee a free or same-day pickup: contractor acceptance, your price approval and a confirmed arrival window are required.
          </p>
          <a
            href="tel:+16048491745"
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-8 py-4 hover:bg-[#125C4E] transition-colors"
          >
            <Phone className="w-5 h-5" />
            Text or Call (604) 849-1745
          </a>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Or book online</div>
        <h2 className="text-3xl font-bold tracking-tight text-[#102B2A] mb-8">Tell us what metal you've got</h2>
        {done ? (
          <div className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-8 text-center">
            <CheckCircle2 className="w-12 h-12 text-[#187B65] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#102B2A]">Request received!</h3>
            <p className="mt-3 text-slate-600">
              {waitlisted
                ? `Free metal pickup eligibility in ${form.city} is confirmed after your request — we've saved your inquiry and will contact you once a local provider is matched.`
                : "Your request is saved, not a confirmed appointment. We will contact you to confirm eligibility, price and an arrival window after a qualified contractor accepts."}
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-6 md:p-8 space-y-4">
            <label className="block">
              <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Your name</span>
              <input required value={form.name} onChange={set("name")} className="input" placeholder="Jane Smith" />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Email</span>
              <input required type="email" value={form.email} onChange={set("email")} className="input" placeholder="you@email.com" />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Phone</span>
              <input required type="tel" value={form.phone} onChange={set("phone")} className="input" placeholder="(604) 555-1234" />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">City</span>
              <select required value={form.city} onChange={set("city")} className="input">
                <option value="" disabled>Select your city</option>
                {CITIES.map((c) => <option key={c.slug} value={c.name}>{cityLabel(c)}</option>)}
                <option value="Other city">Other city (not listed yet)</option>
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Pickup address</span>
              <input required value={form.address} onChange={set("address")} className="input" placeholder="123 Main St, Toronto" />
            </label>
            <label className="block">
              <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">What metal do you have?</span>
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
              className="w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-4 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Wrench className="w-5 h-5" />}
              {saving ? "Submitting…" : "Request a metal pickup"}
            </button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </form>
        )}
      </section>
    </div>
  );
}