import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CITIES, cityLabel } from "@/lib/cities";
import { CheckCircle2, Loader2, CalendarCheck, Zap } from "lucide-react";

export default function SubSignup() {
  const [form, setForm] = useState({ company: "", name: "", email: "", phone: "", city: "" });
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await base44.entities.Subscription.create(form);
      setDone(true);
    } catch {
      setError("Couldn't submit right now — please call (604) 849-1745.");
    } finally {
      setSaving(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl bg-white border border-slate-100 p-8 text-center">
        <CheckCircle2 className="w-12 h-12 text-[#187B65] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-[#102B2A]">You're on the list</h3>
        <p className="mt-3 text-slate-600">
          Thanks {form.name}! We'll reach out within one business day to activate your plan, set up billing, and book your first priority pickup.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-3xl bg-white border border-slate-100 p-6 md:p-8 space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Company / property</span>
          <input required value={form.company} onChange={set("company")} className="input" placeholder="Brampton Living Ltd." />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Your name</span>
          <input required value={form.name} onChange={set("name")} className="input" placeholder="Jane Smith" />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Email</span>
          <input required type="email" value={form.email} onChange={set("email")} className="input" placeholder="jane@company.ca" />
        </label>
        <label className="block">
          <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Phone</span>
          <input required type="tel" value={form.phone} onChange={set("phone")} className="input" placeholder="(604) 555-1234" />
        </label>
      </div>
      <label className="block">
        <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Primary city</span>
        <select value={form.city} onChange={set("city")} className="input">
          <option value="">Select a city</option>
          {CITIES.map((c) => <option key={c.slug} value={c.name}>{cityLabel(c)}</option>)}
        </select>
      </label>
      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-4 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <CalendarCheck className="w-5 h-5" />}
        {saving ? "Submitting…" : "Start my $299/month plan"}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <p className="text-xs text-slate-500 flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-[#187B65]" />
        No contract — cancel anytime. Extra pickups beyond 4 billed at member rates.
      </p>
    </form>
  );
}