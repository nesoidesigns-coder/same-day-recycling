import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Phone, Mail, Clock, Send, Loader2, CheckCircle2, MapPin } from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import RexBanner from "@/components/sdr/RexBanner";
import Footer from "@/components/sdr/Footer";
import { CITIES } from "@/lib/cities";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await base44.functions.invoke("contactForm", form);
      setDone(true);
    } catch {
      setError("Couldn't send right now — please call (604) 849-1745.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white">
      <Navbar />
      <RexBanner message="Need a hand? Send a message and I'll route it straight to the crew." />
      <section className="bg-[#0c3b24] text-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-24">
          <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Contact</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">Talk to a real person.</h1>
          <p className="mt-6 text-lg text-slate-300 max-w-xl">
            Questions about pricing, service areas or a tricky pickup? Send us a message — we reply the same day.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16 md:py-20 grid md:grid-cols-2 gap-10">
        <div className="space-y-6">
          <a href="tel:+16048491745" className="flex items-center gap-4 rounded-2xl bg-[#f4f7f5] p-6 hover:bg-[#e8f2ec] transition-colors">
            <span className="w-12 h-12 rounded-2xl bg-[#1d9e56]/15 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-[#1d9e56]" />
            </span>
            <div>
              <div className="font-bold text-[#0c3b24]">Call or text</div>
              <div className="text-slate-600">(604) 849-1745</div>
            </div>
          </a>
          <a href="mailto:samedayrecycling@gmail.com" className="flex items-center gap-4 rounded-2xl bg-[#f4f7f5] p-6 hover:bg-[#e8f2ec] transition-colors">
            <span className="w-12 h-12 rounded-2xl bg-[#1d9e56]/15 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-[#1d9e56]" />
            </span>
            <div>
              <div className="font-bold text-[#0c3b24]">Email us</div>
              <div className="text-slate-600">samedayrecycling@gmail.com</div>
            </div>
          </a>
          <div className="rounded-2xl bg-[#f4f7f5] p-6 flex items-center gap-4">
            <span className="w-12 h-12 rounded-2xl bg-[#1d9e56]/15 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-[#1d9e56]" />
            </span>
            <div>
              <div className="font-bold text-[#0c3b24]">Hours</div>
              <div className="text-slate-600">Open 24 hours — book any time, day or night.</div>
            </div>
          </div>
          <div className="rounded-2xl bg-[#f4f7f5] p-6">
            <div className="flex items-center gap-3 font-bold text-[#0c3b24] mb-3">
              <MapPin className="w-5 h-5 text-[#1d9e56]" /> Service area
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Vancouver and cities across British Columbia, including {CITIES.map((c) => c.name).join(", ")}.
            </p>
          </div>
          <div className="rounded-2xl bg-[#0c3b24] p-6 text-white">
            <div className="font-bold text-lg mb-1">Ready to book instead?</div>
            <p className="text-sm text-slate-300 mb-4">Same-day pickups, upfront pricing.</p>
            <Link to="/free-metal-pickup" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-6 py-3 inline-block hover:bg-[#17a04c] transition-colors">
              Book a pickup
            </Link>
          </div>
        </div>

        <div>
          {done ? (
            <div className="rounded-3xl bg-[#f4f7f5] border border-slate-100 p-10 text-center">
              <CheckCircle2 className="w-12 h-12 text-[#1d9e56] mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-[#0c3b24]">Message sent!</h2>
              <p className="mt-3 text-slate-600">We'll get back to you the same day.</p>
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
                <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">Phone (optional)</span>
                <input type="tel" value={form.phone} onChange={set("phone")} className="input" placeholder="(604) 555-1234" />
              </label>
              <label className="block">
                <span className="block text-sm font-semibold text-[#0c3b24] mb-1.5">How can we help?</span>
                <textarea required rows={4} value={form.message} onChange={set("message")} className="input resize-none" placeholder="e.g. Do you take old hot tubs?" />
              </label>
              <button
                type="submit"
                disabled={sending}
                className="w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 hover:bg-[#17a04c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                {sending ? "Sending…" : "Send message"}
              </button>
              {error && <p className="text-sm text-red-600">{error}</p>}
            </form>
          )}
        </div>
      </section>
      <Footer />
    </div>
  );
}