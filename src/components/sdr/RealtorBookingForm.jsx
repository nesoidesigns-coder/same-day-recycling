import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2 } from "lucide-react";
import { CITIES } from "@/lib/cities";

export default function RealtorBookingForm() {
  const [form, setForm] = useState({ city: "", name: "", email: "", phone: "", address: "", items_description: "", preferred_date: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await base44.functions.invoke("createBooking", {
        ...form,
        items_description: `[Realtor listing cleanout] ${form.items_description}`,
      });
      base44.analytics.track({ eventName: "booking_submitted", properties: { source: "realtor_page" } });
      setDone(true);
    } catch {
      setError("Something went wrong. Please call (604) 849-1745 and we'll book it for you over the phone.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl bg-white p-10 border border-slate-100 text-center">
        <CheckCircle2 className="w-14 h-14 text-[#1d9e56] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-[#0c3b24]">Listing cleanout requested</h3>
        <p className="mt-3 text-slate-600 max-w-sm mx-auto">
          We'll call you within 30 minutes to confirm the window and upfront price. If it's urgent, call (604) 849-1745 and mention it's for a listing.
        </p>
        <button onClick={() => { setDone(false); setForm({ city: "", name: "", email: "", phone: "", address: "", items_description: "", preferred_date: "" }); }} className="mt-6 text-[#1d9e56] font-semibold hover:underline">
          Book another property
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 md:p-8 border border-slate-100 shadow-sm">
      <h3 className="text-2xl font-bold text-[#0c3b24]">Book a listing cleanout</h3>
      <p className="text-sm text-slate-500 mt-1 mb-6">Two minutes. We call you back within 30 minutes with an upfront price.</p>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Your name" required>
            <input value={form.name} onChange={update("name")} required className="input" placeholder="First and last name" />
          </Field>
          <Field label="Brokerage (optional)">
            <input className="input" placeholder="e.g. REMAX / Oakwyn" onBlur={(e) => setForm((f) => ({ ...f, name: f.name + (f.name && e.target.value ? ` (${e.target.value})` : e.target.value ? ` (${e.target.value})` : "") }))} />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Phone" required>
            <input value={form.phone} onChange={update("phone")} required type="tel" className="input" placeholder="(604) 000-0000" />
          </Field>
          <Field label="Email" required>
            <input value={form.email} onChange={update("email")} required type="email" className="input" placeholder="you@brokerage.com" />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Listing city" required>
            <select value={form.city} onChange={update("city")} required className="input">
              <option value="" disabled>Select city</option>
              {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Property address" required>
            <input value={form.address} onChange={update("address")} required className="input" placeholder="Street address" />
          </Field>
        </div>
        <Field label="What needs to go?" required>
          <textarea value={form.items_description} onChange={update("items_description")} required rows={3} className="input resize-none" placeholder="e.g. seller's furniture from estate, appliances in basement, garage full of boxes" />
        </Field>
        <Field label="Cleanout date (optional)">
          <input value={form.preferred_date} onChange={update("preferred_date")} type="date" className="input" />
        </Field>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button disabled={submitting} className="mt-6 w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 hover:bg-[#17a04c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : "Request the cleanout"}
      </button>
      <p className="mt-3 text-xs text-slate-500 text-center">Upfront flat pricing, approved before we lift a thing. One invoice — bill the estate, the seller, or yourself.</p>
    </form>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">{label}{required && <span className="text-[#1d9e56]"> *</span>}</span>
      {children}
    </label>
  );
}