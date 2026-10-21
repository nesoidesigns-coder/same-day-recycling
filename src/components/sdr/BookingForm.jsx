import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2, CheckCircle2, Camera } from "lucide-react";
import { CITIES, cityLabel } from "@/lib/cities";
import { cityByName, isCityActive } from "@/lib/coverage";
import ReviewInvite from "@/components/sdr/ReviewInvite";
import PayPalButtons from "@/components/pay/PayPalButtons";

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
  const [bookingId, setBookingId] = useState(null);
  const [payDone, setPayDone] = useState(false);
  const [error, setError] = useState("");
  const [waitlisted, setWaitlisted] = useState(false);

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Availability rule shared by every booking surface: only active
  // territories can confirm a booking — anywhere else submits as a
  // service waitlist so the customer is saved for launch day.
  const notLive = !!form.city && !isCityActive(form.city);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (notLive) {
        await base44.entities.ServiceWaitlist.create({
          name: form.name,
          email: form.email,
          phone: form.phone,
          city: form.city,
          address: form.address,
          notes: form.items_description,
          source: "booking_form",
        });
        base44.analytics.track({ eventName: "service_waitlist_joined", properties: { city: form.city } });
        setWaitlisted(true);
        setDone(true);
        return;
      }
      let photo_uri = "";
      if (photo) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: photo });
        photo_uri = file_uri;
      }
      const res = await base44.functions.invoke('createBooking', { ...form, quote_estimate: quoteNote, photo_uri });
      setBookingId(res?.data?.booking_id || null);
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
    const m = String(quoteNote || '').replace(/,/g, '').match(/\$\s?(\d+(?:\.\d{1,2})?)/);
    const quoteAmount = m ? parseFloat(m[1]) : 0;
    return (
      <div className="rounded-3xl bg-white p-10 border border-slate-100 text-center">
        <CheckCircle2 className="w-14 h-14 text-[#187B65] mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-[#102B2A]">{waitlisted ? "You're on the waitlist!" : "Thanks!"}</h3>
        <p className="mt-3 text-slate-600 max-w-sm mx-auto">
          {waitlisted
            ? `We've saved your request for ${form.city} and we'll contact you as soon as a verified partner launches there.`
            : "We'll call you within 30 minutes to confirm your pickup window."}
        </p>
        {!waitlisted && bookingId && !payDone && quoteAmount > 0 && (
          <div className="mt-6 rounded-2xl bg-[#f4f7f5] border border-slate-100 p-5 text-left">
            <div className="text-sm font-bold text-[#102B2A]">Pay your estimated quote now</div>
            <p className="text-xs text-slate-500 mt-1 mb-3">Secure payment through PayPal. The final price is confirmed by the crew on arrival.</p>
            <PayPalButtons createPayload={{ kind: 'booking', booking_id: bookingId }} onPaid={() => setPayDone(true)} />
          </div>
        )}
        {payDone && (
          <p className="mt-6 font-semibold text-[#187B65] flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Payment received — thank you!
          </p>
        )}
        <button onClick={() => { setDone(false); setWaitlisted(false); setForm({ city: "", name: "", email: "", phone: "", address: "", items_description: "", preferred_date: "" }); setPhoto(null); }} className="mt-6 text-[#187B65] font-semibold hover:underline">
          Book another pickup
        </button>
        <ReviewInvite />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 md:p-8 border border-slate-100 shadow-sm">
      <h3 className="text-2xl font-bold text-[#102B2A]">Book your pickup</h3>
      <p className="text-sm text-slate-500 mt-1 mb-6">We'll call you back within 30 minutes.</p>
      <div className="space-y-4">
        <Field label="Your city" required>
          <select value={form.city} onChange={update("city")} required className="input">
            <option value="" disabled>Select your city</option>
            {CITIES.map((c) => <option key={c.slug} value={c.name}>{cityLabel(c)}</option>)}
          </select>
        </Field>
        {notLive && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-800">
            Service isn't live in {form.city} yet. Submitting this form joins the {form.city} waitlist — we'll contact you when a verified partner launches there.
            <span className="mt-1 block font-normal text-amber-800/80">
              Need service sooner? <Link to="/request-service" className="underline">Submit a national service request</Link> — we match local providers across Canada (provider confirmation required).
            </span>
          </div>
        )}
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
          <div className="rounded-xl bg-[#187B65]/10 px-4 py-2.5 text-sm font-semibold text-[#102B2A]">
            Instant quote: {quoteNote} — final price confirmed on arrival.
          </div>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Preferred pickup date">
            <input value={form.preferred_date} onChange={update("preferred_date")} type="date" className="input" />
          </Field>
          <Field label="Photo (optional)">
            <label className="flex items-center gap-2 input cursor-pointer hover:border-[#187B65] transition-colors">
              <Camera className="w-5 h-5 text-[#187B65]" />
              <span className="text-slate-500 truncate">{photo ? photo.name : "Add a photo"}</span>
              <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="hidden" />
            </label>
          </Field>
        </div>
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <button disabled={submitting} className="mt-6 w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-4 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
        {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Sending…</> : <><Upload className="w-5 h-5" /> Book my pickup</>}
      </button>
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