import { useState } from "react";
import { useSEO } from "@/lib/seo";
import { base44 } from "@/api/base44Client";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import Footer from "@/components/sdr/Footer";
import { Search, Loader2, CheckCircle2, MapPin, CalendarDays, Clock, Wrench, SearchX } from "lucide-react";

const STATUS_META = {
  new: { label: "Received", tone: "bg-sky-500/15 text-sky-300 border-sky-400/30", copy: "We've received your request and our national dispatch team is taking it from here." },
  provider_matching: { label: "Arranging a contractor", tone: "bg-amber-500/15 text-amber-300 border-amber-400/30", copy: "We operate nationwide — our dispatch team is arranging your local contractor." },
  recruiting: { label: "Sourcing a contractor", tone: "bg-amber-500/15 text-amber-300 border-amber-400/30", copy: "Your request is saved. We operate in every Canadian city — our dispatch team is sourcing your local contractor and will contact you as soon as one accepts. Nothing is scheduled or charged before a contractor accepts." },
  matched: { label: "Contractor matched", tone: "bg-[#187B65]/20 text-[#187B65] border-[#187B65]/40", copy: "A local contractor has been matched. They'll confirm scheduling and pricing with you directly." },
  confirmed: { label: "Confirmed", tone: "bg-[#187B65]/20 text-[#187B65] border-[#187B65]/40", copy: "Your pickup is confirmed. Dispatch has locked in your appointment." },
  completed: { label: "Completed", tone: "bg-[#187B65]/20 text-[#187B65] border-[#187B65]/40", copy: "This request is complete. Thanks for recycling with the network!" },
  confirmed: { label: "Confirmed", tone: "bg-[#187B65]/20 text-[#187B65] border-[#187B65]/40", copy: "Your pickup is confirmed." },
  contacted: { label: "Contacted", tone: "bg-amber-500/15 text-amber-300 border-amber-400/30", copy: "Our team has contacted you to confirm your pickup details." },
  scheduled: { label: "Scheduled", tone: "bg-[#187B65]/20 text-[#187B65] border-[#187B65]/40", copy: "Your pickup is scheduled. Have your items ready for the arrival window." },
  cancelled: { label: "Cancelled", tone: "bg-red-500/10 text-red-300 border-red-400/30", copy: "This request was cancelled. Submit a new request any time." },
};

// Direct (active-city) bookings follow the classic booking flow rather than
// the nationwide dispatch flow, so they get their own status copy.
const BOOKING_COPY = {
  new: "We've received your booking and will call you shortly to confirm your pickup window.",
  confirmed: "Your pickup is confirmed. We'll see you at the scheduled time.",
  contacted: "Our team has contacted you to confirm your pickup details.",
  scheduled: "Your pickup is scheduled — have your items ready for the arrival window.",
  completed: "This booking is complete. Thanks for recycling with us!",
  cancelled: "This booking was cancelled. Submit a new request any time.",
};

const SERVICE_LABELS = {
  junk_removal: "Junk removal", furniture: "Furniture", appliances: "Appliances",
  electronics: "Electronics", metal_pickup: "Metal pickup", cleanouts: "Cleanout", other: "Other",
};

export default function RequestStatus() {
  useSEO({
    title: "Track Your Service Request | Same Day Recycling",
    description: "Enter your reference code to see the live status of your Same Day Recycling service request.",
    path: "/request-status",
  });
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNotFound(false);
    setResult(null);
    try {
      const res = await base44.functions.invoke("requestLookup", { reference_code: code });
      if (res.data?.found) setResult(res.data.request);
      else setNotFound(true);
    } catch (err) {
      setError(err?.response?.data?.error || "Couldn't look that up right now — please call (604) 849-1745.");
    } finally {
      setLoading(false);
    }
  };

  const meta = result ? STATUS_META[result.status] : null;
  const copy = result?.kind === "booking" ? (BOOKING_COPY[result.status] || meta?.copy) : meta?.copy;

  return (
    <div className="bg-white">
      <Navbar />
      <RexBanner message="Got your reference code? I'll pull up your request in one second." />
      <section className="bg-[#102B2A] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Track a request</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">Check your request status.</h1>
          <p className="mt-6 text-lg text-slate-300 max-w-xl">
            Enter the 8-character reference code from your confirmation to see where your service request stands.
          </p>
        </div>
      </section>

      <section className="max-w-2xl mx-auto px-4 py-16 md:py-20">
        <form onSubmit={submit} className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-6 md:p-8">
          <label className="block">
            <span className="block text-sm font-semibold text-[#102B2A] mb-1.5">Reference code</span>
            <input
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="input font-mono tracking-[0.3em] uppercase"
              placeholder="e.g. 4F7K2QX9"
              maxLength={12}
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-4 w-full rounded-full bg-[#187B65] text-white font-bold px-7 py-4 hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            {loading ? "Looking up…" : "Check my request"}
          </button>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          {notFound && (
            <div className="mt-6 rounded-2xl bg-white border border-slate-100 p-6 text-center">
              <SearchX className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-xl font-bold text-[#102B2A]">No request found</h3>
              <p className="mt-2 text-sm text-slate-600">
                Double-check the code — it's in your confirmation. Still stuck? Call (604) 849-1745 and we'll find it.
              </p>
            </div>
          )}
        </form>

        {result && meta && (
          <div className="mt-8 rounded-3xl bg-[#102B2A] text-emerald-50 p-6 md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#187B65]">Reference</div>
                <div className="font-mono text-lg font-bold text-white tracking-[0.2em] mt-1">{result.reference_code}</div>
              </div>
              <span className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] border ${meta.tone}`}>
                {meta.label}
              </span>
            </div>
            <p className="mt-5 text-sm text-emerald-100/80 leading-relaxed">{copy}</p>
            <div className="mt-6 pt-6 border-t border-[#187B65]/20 grid sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                <div><span className="text-emerald-100/50">City:</span> <span className="font-semibold text-white">{result.city}</span></div>
              </div>
              <div className="flex items-start gap-2">
                <Wrench className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                <div><span className="text-emerald-100/50">Service:</span> <span className="font-semibold text-white">{SERVICE_LABELS[result.service_type] || result.service_type}</span></div>
              </div>
              {result.preferred_date && (
                <div className="flex items-start gap-2">
                  <CalendarDays className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                  <div><span className="text-emerald-100/50">Preferred date:</span> <span className="font-semibold text-white">{result.preferred_date}</span></div>
                </div>
              )}
              {result.time_window && (
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                  <div><span className="text-emerald-100/50">Arrival window:</span> <span className="font-semibold text-white">{result.time_window}</span></div>
                </div>
              )}
              {result.appointment_date && (
                <div className="flex items-start gap-2">
                  <CalendarDays className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                  <div><span className="text-emerald-100/50">Appointment:</span> <span className="font-semibold text-white">{result.appointment_date}</span></div>
                </div>
              )}
              {result.partner_name && (
                <div className="flex items-start gap-2 sm:col-span-2">
                  <CheckCircle2 className="w-4 h-4 text-[#187B65] shrink-0 mt-0.5" />
                  <div><span className="text-emerald-100/50">Provider:</span> <span className="font-semibold text-white">{result.partner_name}</span></div>
                </div>
              )}
            </div>
            <p className="mt-6 text-xs text-emerald-100/40">Requested {String(result.created_date || "").slice(0, 10)} · Questions? Call (604) 849-1745.</p>
          </div>
        )}
      </section>
      <Footer />
    </div>
  );
}