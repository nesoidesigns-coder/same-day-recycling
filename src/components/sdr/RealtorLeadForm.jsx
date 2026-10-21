import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, CheckCircle2 } from "lucide-react";
import { CITIES } from "@/lib/cities";

export default function RealtorLeadForm() {
  const [form, setForm] = useState({ agent_name: "", brokerage: "", email: "", phone: "", city: "", property_address: "", items_description: "", preferred_date: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await base44.functions.invoke("realtorLead", form);
      base44.analytics.track({ eventName: "realtor_lead_submitted", properties: { source: "realtor_page" } });
      setDone(true);
    } catch {
      setError("Something went wrong. Please call (604) 849-1745 and we'll take the details over the phone.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl bg-white p-10 border border-slate-100 text-center">
        <CheckCircle2 className="w-14 h-14 text-[#187B65] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-[#102B2A]">Got it — we'll be in touch</h3>
        <p className="mt-3 text-slate-600 max-w-sm mx-auto">
          We'll call you within 30 minutes with an upfront quote for the cleanout. Urgent listing? Call (604) 849-1745 and mention it's for a listing.
        </p>
        <button onClick={() => { setDone(false); setForm({ agent_name: "", brokerage: "", email: "", phone: "", city: "", property_address: "", items_description: "", preferred_date: "" }); }} className="mt-6 text-[#187B65] font-semibold hover:underline">
          Submit another property
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 md:p-8 border border-slate-100 shadow-sm">
      <h3 className="text-2xl font-bold text-[#102B2A]">Tell us about the cleanout</h3>
      <p className="text-sm text-slate-500 mt-1 mb-6">Two minutes. We call you back within 30 minutes with an upfront price.</p>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Your name" required>
            <input value={form.agent_name} onChange={update("agent_name")} required className="input" placeholder="First and last name" />
          </Field>
          <Field label="Brokerage">
            <input value={form.brokerage} onChange={update("brokerage")} className="input" placeholder="e.g. REMAX / Oakwyn" />
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
          <Field label="Listing city">
            <select value={form.city} onChange={update("city")} className="input">
              <option value="">Select city</option>
              {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Property address" required>
            <input value={form.property_address} onChange={update("property_address")} required className="input" placeholder="Street address" />
          </Field>
        </div>
        <Field label="What needs to go?">
          <textarea value={form.items_description} onChange={update("items_description")} rows={3} className="input resize-none" placeholder="e.g. seller's furniture from estate, appliances in basement, garage full of boxes" />
        </Field>
        <Field label="Cleanout date (optional)">
          <input value={form.preferred_date} onChange={update("preferred_date")} type="date" className="input" />
        </Field>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button disabled={submitting} className="mt-6 w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-4 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : "Send the lead"}
      </button>
      <p className="mt-3 text-xs text-slate-500 text-center">Upfront flat pricing, approved before we lift a thing. One invoice — bill the estate, the seller, or yourself.</p>
    </form>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">{label}{required && <span className="text-[#187B65]"> *</span>}</span>
      {children}
    </label>
  );
}