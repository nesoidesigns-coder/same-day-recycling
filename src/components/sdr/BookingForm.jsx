import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, CheckCircle2, Camera } from "lucide-react";
import { CITIES } from "@/lib/cities";

export default function BookingForm({ prefill }) {
  const [form, setForm] = useState({ city: "", name: "", email: "", phone: "", address: "", items_description: "", preferred_date: "" });
  const [photo, setPhoto] = useState(null);
  const [quoteNote, setQuoteNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (prefill?.items_text) {
      setForm((f) => ({ ...f, items_description: prefill.items_text }));
      setQuoteNote(prefill.estimate_text || "");
    }
    if (prefill?.city) {
      setForm((f) => ({ ...f, city: prefill.city }));
    }
  }, [prefill]);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      let photo_uri = "";
      if (photo) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: photo });
        photo_uri = file_uri;
      }
      await base44.functions.invoke('createBooking', { ...form, quote_estimate: quoteNote, photo_uri });
      base44.analytics.track({ eventName: 'booking_submitted' });
      if (typeof window.gtag === "function") {
        window.gtag("event", "booking_submitted", { city: form.city, currency: "CAD", value: 1 });
      }
      setDone(true);
    } catch (err) {
      setError("Something went wrong. Please call (604) 849-1745 and we'll take your booking over the phone.");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-3xl bg-white p-10 border border-slate-100 text-center">
        <CheckCircle2 className="w-14 h-14 text-[#1d9e56] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-[#0c3b24]">Thanks!</h3>
        <p className="mt-3 text-slate-600 max-w-sm mx-auto">
          We'll call you within 30 minutes to confirm your pickup window.
        </p>
        <button onClick={() => { setDone(false); setForm({ city: "", name: "", email: "", phone: "", address: "", items_description: "", preferred_date: "" }); setPhoto(null); }} className="mt-6 text-[#1d9e56] font-semibold hover:underline">
          Book another pickup
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 md:p-8 border border-slate-100 shadow-sm">
      <h3 className="text-2xl font-bold text-[#0c3b24]">Book your pickup</h3>
      <p className="text-sm text-slate-500 mt-1 mb-6">We'll call you back within 30 minutes.</p>
      <div className="space-y-4">
        <Field label="Your city" required>
          <select value={form.city} onChange={update("city")} required className="input">
            <option value="" disabled>Select your city</option>
            {CITIES.map((c) => <option key={c.slug} value={c.name}>{c.name}</option>)}
          </select>
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Name" required>
            <input value={form.name} onChange={update("name")} required className="input" placeholder="Your name" />
          </Field>
          <Field label="Phone number" required>
            <input value={form.phone} onChange={update("phone")} required type="tel" className="input" placeholder="(604) 000-0000" />
          </Field>
        </div>
        <Field label="Email" required>
          <input value={form.email} onChange={update("email")} required type="email" className="input" placeholder="you@email.com" />
        </Field>
        <Field label="Pickup address" required>
          <input value={form.address} onChange={update("address")} required className="input" placeholder="Street address, city" />
        </Field>
        <Field label="Description of items" required>
          <textarea value={form.items_description} onChange={update("items_description")} required rows={3} className="input resize-none" placeholder="e.g. one sofa, one mattress, a few boxes" />
        </Field>
        {quoteNote && (
          <div className="rounded-xl bg-[#1d9e56]/10 px-4 py-2.5 text-sm font-semibold text-[#0c3b24]">
            Instant quote: {quoteNote} — final price confirmed on arrival.
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Preferred pickup date">
            <input value={form.preferred_date} onChange={update("preferred_date")} type="date" className="input" />
          </Field>
          <Field label="Photo (optional)">
            <label className="flex items-center gap-2 input cursor-pointer hover:border-[#1d9e56] transition-colors">
              <Camera className="w-5 h-5 text-[#1d9e56]" />
              <span className="text-slate-500 truncate">{photo ? photo.name : "Add a photo"}</span>
              <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </Field>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button disabled={submitting} className="mt-6 w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 hover:bg-[#17a04c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : <><Upload className="w-5 h-5" /> Book my pickup</>}
      </button>
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