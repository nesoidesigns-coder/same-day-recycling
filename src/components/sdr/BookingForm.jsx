import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { getSessionId } from "@/lib/visitSession";
import { Upload, Loader2, CheckCircle2, Camera, Lock } from "lucide-react";
import { CITIES, cityLabel } from "@/lib/cities";
import { isCityActive } from "@/lib/coverage";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { provinceForCity, taxFor } from "@/lib/canadaTax";
import { normalizePostal, isValidPostal, provinceFromFsa, provinceName } from "@/lib/geo";
import ReviewInvite from "@/components/sdr/ReviewInvite";
import PayPalButtons from "@/components/pay/PayPalButtons";

export default function BookingForm({ prefill }) {
  const [form, setForm] = useState({ city: "", postal_code: "", name: "", email: "", phone: "", address: "", items_description: "", preferred_date: "", curbside: false });
  const [photo, setPhoto] = useState(null);
  const [quoteNote, setQuoteNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  // Uniform scheduling: First Available (default), Same-Day and Next-Day.
  // Same-day is only selectable where the live coverage feed shows a verified
  // provider; the noon Vancouver cut-off is explained, never faked.
  const { statusFor, loaded: coverageLoaded } = useCoverageStatus();
  const [scheduleMode, setScheduleMode] = useState("first");
  const vancouverHour = () => parseInt(new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", hour: "numeric", hour12: false }).format(new Date()), 10);

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
  const [refCode, setRefCode] = useState("");
  const [payDone, setPayDone] = useState(false);
  const [error, setError] = useState("");
  const [waitlisted, setWaitlisted] = useState(false);
  const [payNeedsLogin, setPayNeedsLogin] = useState(false);

  // Pay-an-existing-booking mode (?pay_booking=<id>): loads the booking so the
  // PayPal button can run for it. Read access is admin-only, so this surface
  // is only reachable for the owner/admin.
  useEffect(() => {
    const payId = new URLSearchParams(window.location.search).get('pay_booking');
    if (!payId) return;
    document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' });
    (async () => {
      try {
        const b = await base44.entities.Booking.get(payId);
        if (!b || !b.id) { setPayNeedsLogin(true); return; }
        setBookingId(b.id);
        setQuoteNote(b.quote_estimate || '');
        setForm((f) => ({ ...f, city: b.city || '', email: b.email || '', curbside: !!b.curbside_discount }));
        setPayDone(b.payment_status === 'paid');
        setDone(true);
      } catch {
        // Not readable (non-admin or bad id): explain instead of silently
        // falling through to the normal form.
        setPayNeedsLogin(true);
      }
    })();
  }, []);

  if (payNeedsLogin) {
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search);
    return (
      <div className="rounded-3xl bg-white p-8 border border-slate-100 text-center">
        <Lock className="w-10 h-10 text-[#187B65] mx-auto mb-3" />
        <h3 className="text-xl font-bold text-[#102B2A]">Payment link</h3>
        <p className="mt-2 text-slate-600 text-sm">This payment link can only be opened while logged in to the admin account.</p>
        <a href={`/login?returnTo=${returnTo}`} className="mt-5 inline-block rounded-full bg-[#187B65] text-white font-bold px-6 py-3 text-sm hover:bg-[#125C4E] transition-colors">
          Log in to continue
        </a>
      </div>
    );
  }

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // Availability rule shared by every booking surface: coverage is
  // national — active cities book directly, anywhere else submits as a
  // nationwide service request so dispatch sources the local contractor.
  const notLive = !!form.city && !isCityActive(form.city);

  // Live postal-code validation: a valid Canadian FSA instantly identifies the
  // province/territory and the availability tier we operate at there.
  const fsa = normalizePostal(form.postal_code);
  const postalProvince = provinceFromFsa(fsa);
  const postalProvinceName = fsa ? (postalProvince ? provinceName(postalProvince) : "the Northwest Territories or Nunavut") : "";
  const postalTyping = form.postal_code.trim().length > 2 && !isValidPostal(form.postal_code) && !fsa;
  const provCities = fsa ? CITIES.filter((c) => c.province === postalProvince) : [];
  const postalStatus = !fsa
    ? ""
    : provCities.some((c) => statusFor(c.name) === "same_day")
      ? "same_day"
      : provCities.some((c) => statusFor(c.name) === "matching")
        ? "matching"
        : "recruiting";
  const citySameDay = coverageLoaded && !!form.city && statusFor(form.city) === "same_day";
  const beforeNoon = vancouverHour() < 12;
  const vancouverDate = (offset) => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Vancouver", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(Date.now() + offset * 86400000));
  const scheduleDate = scheduleMode === "today" && citySameDay ? vancouverDate(0) : scheduleMode === "next" ? form.preferred_date : "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      if (notLive) {
        const natRes = await base44.functions.invoke('nationalRequest', {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          postal_code: form.postal_code,
          service_type: 'junk_removal',
          items_description: form.items_description,
          preferred_date: scheduleDate,
          notes: form.curbside ? "Customer requested curbside pickup ($25 discount)." : "",
        });
        setRefCode(natRes?.data?.reference_code || "");
        base44.analytics.track({ eventName: "national_request_submitted", properties: { city: form.city, source: "booking_form" } });
        setWaitlisted(true);
        setDone(true);
        return;
      }
      let photo_uri = "";
      if (photo) {
        try {
          const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: photo });
          photo_uri = file_uri;
        } catch (uploadErr) {
          // A photo attachment must never block the booking itself.
          console.error("Photo upload failed, submitting without it:", uploadErr);
          setQuoteNote((q) => q || "");
        }
      }
      const res = await base44.functions.invoke('createBooking', { ...form, preferred_date: scheduleDate, quote_estimate: quoteNote, photo_uri, curbside: !!form.curbside, sid: getSessionId() });
      setBookingId(res?.data?.booking_id || null);
      setRefCode(res?.data?.reference_code || "");
      base44.analytics.track({ eventName: 'booking_submitted' });
      if (typeof window.gtag === "function") {
        window.gtag("event", "booking_submitted", { city: form.city, currency: "CAD", value: 1 });
      }
      setDone(true);
    } catch (err) {
      // Surface the actual failure (rate limit, auth, validation, network)
      // instead of a generic message, so failed submissions are diagnosable.
      console.error("Booking submission failed:", err);
      const serverMsg = err?.response?.data?.message || err?.response?.data?.error || err?.message;
      setError(
        serverMsg
          ? `Your booking wasn't submitted: ${serverMsg}. Please call (604) 849-1745 and we'll take it over the phone.`
          : "Something went wrong. Please call (604) 849-1745 and we'll take your booking over the phone."
      );
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
        <h3 className="text-2xl font-bold text-[#102B2A]">{waitlisted ? "Request received!" : "Thanks!"}</h3>
        <p className="mt-3 text-slate-600 max-w-sm mx-auto">
          {waitlisted
            ? `Your request for ${form.city} is in our system. We operate in every Canadian city — our dispatch team is arranging your local contractor and will call you with pricing and your pickup window.`
            : "Your booking is in — dispatch confirms your pickup window and upfront price with you before anything is scheduled."}
        </p>
        <p className="mt-2 text-xs text-slate-500 max-w-sm mx-auto">
          Your approved quote is the price you pay. Any additional items are priced as a separate change order and only added with your approval — <Link to="/terms" className="font-semibold text-[#187B65]">see terms</Link>.
        </p>
        {!waitlisted && bookingId && !payDone && quoteAmount > 0 && (() => {
          // Province-appropriate tax breakdown, shown before payment. The
          // server applies the same rate at order creation (authoritative).
          const discount = form.curbside ? 25 : 0;
          const subtotal = Math.max(0, quoteAmount - discount);
          const tax = taxFor(provinceForCity(form.city), subtotal);
          return (
            <div className="mt-6 rounded-2xl bg-[#f4f7f5] border border-slate-100 p-5 text-left">
              <div className="text-sm font-bold text-[#102B2A]">Pay your estimated quote now</div>
              <p className="text-xs text-slate-500 mt-1 mb-3">Secure payment through PayPal. The final price is confirmed by the crew on arrival.</p>
              <div className="rounded-xl bg-white border border-slate-100 px-4 py-3 mb-3 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">Subtotal{discount ? " (incl. $25 curbside discount)" : ""}</span><span className="font-semibold text-[#102B2A]">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Estimated taxes{tax.estimated ? " (estimate)" : ""} — {tax.label}</span><span className="font-semibold text-[#102B2A]">${tax.tax.toFixed(2)}</span></div>
                <div className="flex justify-between border-t border-slate-100 pt-1"><span className="font-bold text-[#102B2A]">Total</span><span className="font-bold text-[#102B2A]">${tax.total.toFixed(2)} CAD</span></div>
              </div>
              <PayPalButtons createPayload={{ kind: 'booking', booking_id: bookingId }} onPaid={() => setPayDone(true)} />
            </div>
          );
        })()}
        {payDone && (
          <p className="mt-6 font-semibold text-[#187B65] flex items-center justify-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Payment received — thank you!
          </p>
        )}
        {refCode && (
          <div className="mt-6 rounded-2xl bg-[#f4f7f5] border border-slate-100 px-5 py-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]">Your reference code</div>
            <div className="font-mono text-xl font-bold tracking-[0.2em] text-[#102B2A] mt-1">{refCode}</div>
            <p className="text-xs text-slate-500 mt-1.5">Save this code to check your status any time.</p>
            <Link to="/request-status" className="mt-3 inline-block rounded-full bg-[#187B65] text-white font-bold px-5 py-2 text-sm hover:bg-[#125C4E] transition-colors">
              Track your request
            </Link>
          </div>
        )}
        <button onClick={() => { setDone(false); setWaitlisted(false); setForm({ city: "", postal_code: "", name: "", email: "", phone: "", address: "", items_description: "", preferred_date: "", curbside: false }); setPhoto(null); }} className="mt-6 text-[#187B65] font-semibold hover:underline">
          Book another pickup
        </button>
        <ReviewInvite />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white p-6 md:p-8 border border-slate-100 shadow-sm">
      <h3 className="text-2xl font-bold text-[#102B2A]">Book your pickup</h3>
      <p className="text-sm text-slate-500 mt-1 mb-6">Submit your request — we confirm the window and price with you before anything is scheduled.</p>
      <div className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Postal code" required>
            <input
              value={form.postal_code}
              onChange={(e) => setForm((f) => ({ ...f, postal_code: e.target.value.toUpperCase() }))}
              className="input"
              placeholder="e.g. V6B 1A1"
              inputMode="text"
              autoCapitalize="characters"
            />
          </Field>
          <Field label="Your city" required>
            <select value={form.city} onChange={update("city")} required className="input">
              <option value="" disabled>Select your city</option>
              {CITIES.map((c) => <option key={c.slug} value={c.name}>{cityLabel(c)}</option>)}
            </select>
          </Field>
        </div>
        {postalTyping && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-800">
            Enter a valid Canadian postal code (letter-number-letter, e.g. V6B 1A1).
          </div>
        )}
        {fsa && (
          <div className={`rounded-xl px-4 py-2.5 text-xs font-semibold border ${
            postalStatus === "same_day"
              ? "bg-[#f4f7f5] border-[#187B65]/30 text-[#102B2A]"
              : postalStatus === "matching"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-slate-50 border-slate-200 text-slate-600"
          }`}>
            {postalStatus === "same_day"
              ? `Verified providers are active in ${postalProvinceName} — same-day pickup is available in our listed cities; we confirm your window before anything is scheduled.`
              : postalStatus === "matching"
                ? `Requests are open in ${postalProvinceName} — dispatch matches your local contractor and confirms pricing before anything is scheduled.`
                : `We're building coverage in ${postalProvinceName} — submit below and dispatch sources your local contractor.`}
          </div>
        )}
        {notLive && (
          <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-800">
            We operate in every Canadian city — submitting below creates a nationwide service request. Our dispatch team arranges your local contractor and confirms pricing and your pickup window before anything is scheduled.
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
        <label className="flex items-start gap-3 rounded-xl bg-[#f4f7f5] border border-[#187B65]/30 px-4 py-3 cursor-pointer">
          <input
            type="checkbox"
            checked={form.curbside}
            onChange={(e) => setForm((f) => ({ ...f, curbside: e.target.checked }))}
            className="mt-0.5 accent-[#187B65] w-4 h-4"
          />
          <span className="text-sm text-[#102B2A]">
            <span className="font-semibold">Leave it curbside — save $25.</span>{" "}
            Stage your items in the driveway, lane or garage front; no need to be home. Applied once per job to your final invoice.
          </span>
        </label>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="When do you need it?">
            <div className="grid grid-cols-3 gap-2" role="group" aria-label="Scheduling options">
              {[
                { key: "first", label: "First available" },
                { key: "today", label: "Same-day" },
                { key: "next", label: "Next-day" },
              ].map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setScheduleMode(o.key)}
                  aria-pressed={scheduleMode === o.key}
                  disabled={o.key === "today" && !citySameDay}
                  className={`rounded-xl px-2 py-2.5 text-sm font-bold border transition-colors ${
                    scheduleMode === o.key
                      ? "bg-[#187B65] text-[#102B2A] border-[#187B65]"
                      : o.key === "today" && !citySameDay
                        ? "bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed"
                        : "bg-white text-[#102B2A] border-slate-200 hover:border-[#187B65]"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-slate-500">
              {!coverageLoaded
                ? "Checking live provider availability…"
                : scheduleMode === "today"
                  ? citySameDay && beforeNoon
                    ? "Verified provider active in your city — your arrival window is confirmed with you before anything is scheduled."
                    : citySameDay
                      ? "The noon cut-off has passed, so First Available or Next-day is the surer bet."
                      : "Same-day unlocks once a verified provider serves your city."
                  : scheduleMode === "next"
                    ? "Pick any date — dispatch confirms the window with you."
                    : "Dispatch matches the earliest window and confirms it with you."}
            </p>
            {scheduleMode === "next" && (
              <input value={form.preferred_date} onChange={update("preferred_date")} type="date" min={vancouverDate(1)} className="input mt-2" aria-label="Preferred pickup date" />
            )}
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