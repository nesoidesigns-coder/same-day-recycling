import { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Loader2, Recycle, Users, CalendarDays, Truck, Receipt, BarChart3,
  ShieldCheck, Globe2, CheckCircle2, Database, RefreshCcw, CreditCard, Lock,
} from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import HoloGauge from "@/components/software/HoloGauge";
import PreviewImg from "@/components/software/PreviewImg";

const PROVINCES = ["ON", "QC", "BC", "AB", "MB", "SK", "NS", "NB", "NL", "PE", "NT", "YT", "NU"];

const FEATURES = [
  { icon: Users, title: "Customer CRM", desc: "Every commercial and residential customer, notes, contact history and service preferences in one clean record." },
  { icon: CalendarDays, title: "Pickup scheduling", desc: "Book, reschedule and confirm pickups with time windows. Same-day and recurring routes supported." },
  { icon: Truck, title: "Dispatch board", desc: "One board for scheduled, dispatched and completed jobs. Assign drivers and track status in real time." },
  { icon: Receipt, title: "Invoicing", desc: "Turn completed pickups into invoices in one click, mark them sent and paid, and watch cash flow." },
  { icon: BarChart3, title: "Analytics gauges", desc: "Interactive performance gauges for completion rate, volume and revenue, with weekly and monthly trends." },
  { icon: Globe2, title: "Geographic intelligence", desc: "See your jobs and coverage on a live map, spot dense corridors, and plan expansion territory by territory." },
];

const TIERS = [
  {
    key: "starter", name: "Starter", setup: 2500, monthly: 199, tag: "Single operator",
    points: ["1 dispatcher seat", "Up to 250 active customers", "Scheduling, dispatch and invoicing", "Core analytics gauges", "Email support"],
  },
  {
    key: "growth", name: "Growth", setup: 4500, monthly: 399, tag: "Multi-crew fleets",
    points: ["5 dispatcher seats", "Up to 2,000 active customers", "Driver assignment and routes", "Full analytics and reports", "Priority support"],
  },
  {
    key: "network", name: "Network", setup: 9500, monthly: 799, tag: "Multi-territory networks",
    points: ["Unlimited seats", "Unlimited customers", "Multi-territory coverage map", "Operational reporting suite", "Dedicated onboarding"],
  },
];

export default function SoftwareSales() {
  const [buying, setBuying] = useState(null);
  const [form, setForm] = useState({ company: "", contact_name: "", email: "", city: "", province: "ON" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const openBuy = (tier) => {
    setForm((f) => ({ ...f }));
    setBuying(tier);
    setError("");
  };

  const submitBuy = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const { data } = await base44.functions.invoke("paypalCheckout", { action: "create_license", ...form, plan: buying });
      window.location.href = `/software-pay?pay=${data.pay_token}`;
    } catch (err) {
      setError(err?.response?.data?.error || "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="admin-console text-white">
        {/* Hero */}
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#1d9e56]/40 bg-[#1d9e56]/10 px-4 py-1.5 text-xs font-bold tracking-[0.18em] uppercase text-[#a8f0cc]">
            <ShieldCheck className="w-3.5 h-3.5" /> Canadian-built · Data-isolated · PayPal-secured
          </span>
          <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight admin-headline">
            The Operating System for Canada's Recycling Businesses
          </h1>
          <p className="mt-5 text-lg text-emerald-100/70 max-w-2xl mx-auto">
            The Same Day Recycling OS runs your customers, pickups, dispatch, invoicing and analytics
            in one secure dashboard. License it, log in, and operate like a national company from day one.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href="#licensing" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-3.5 hover:bg-[#17a04c] transition-colors flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Get a license
            </a>
            <a href="#preview" className="rounded-full border border-[#1d9e56]/40 text-[#a8f0cc] font-bold px-7 py-3.5 hover:bg-[#1d9e56]/10 transition-colors">
              See the OS
            </a>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            {[
              { k: "99.9%", v: "Platform uptime target" },
              { k: "13", v: "Provinces & territories ready" },
              { k: "24/7", v: "Always-on operations" },
              { k: "CAD", v: "Priced in Canadian dollars" },
            ].map((s) => (
              <div key={s.k} className="holo-panel-deep rounded-2xl border border-[#1d9e56]/20 p-5">
                <div className="text-2xl font-extrabold text-[#a8f0cc] holo-glow-text">{s.k}</div>
                <div className="text-xs text-emerald-100/60 mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview */}
        <div id="preview" className="max-w-6xl mx-auto px-4 pb-16">
          <div className="holo-panel-deep rounded-3xl border border-[#1d9e56]/25 p-6 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-xs font-bold tracking-[0.18em] uppercase text-[#1d9e56] mb-3">Inside the dashboard</div>
                <h2 className="text-3xl font-extrabold tracking-tight admin-headline">Command your entire operation</h2>
                <ul className="mt-6 space-y-3">
                  {[
                    "Company dashboard with customer management and pickup scheduling",
                    "Dispatch board that moves jobs from scheduled to completed",
                    "Invoicing with paid / sent / draft tracking and revenue totals",
                    "Interactive gauges for completion rate, volume and revenue",
                    "Strict company-level isolation — your data is yours alone",
                  ].map((p) => (
                    <li key={p} className="flex items-start gap-2.5 text-sm text-emerald-100/80">
                      <CheckCircle2 className="w-4 h-4 text-[#1d9e56] mt-0.5 shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
              </div>
              <PreviewImg />
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <h2 className="text-3xl font-extrabold tracking-tight admin-headline text-center">Everything in one operating system</h2>
          <p className="text-center text-emerald-100/60 mt-3 mb-10">Purpose-built for independent recycling and junk-hauling businesses across Canada.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="holo-panel-deep rounded-2xl border border-[#1d9e56]/20 p-6 hover:border-[#1d9e56]/50 transition-colors">
                <span className="w-10 h-10 rounded-xl bg-[#1d9e56]/15 text-[#1d9e56] flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5" />
                </span>
                <div className="font-bold text-[#a8f0cc]">{f.title}</div>
                <p className="text-sm text-emerald-100/60 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live gauges */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="holo-panel-deep rounded-3xl border border-[#1d9e56]/25 p-8 md:p-12">
            <div className="text-center mb-10">
              <div className="text-xs font-bold tracking-[0.18em] uppercase text-[#1d9e56]">Network intelligence</div>
              <h2 className="text-3xl font-extrabold tracking-tight admin-headline mt-2">Performance you can watch</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <HoloGauge value={99} label="Uptime" sub="Rolling 30 days" />
              <HoloGauge value={94} label="On-time pickups" sub="Same-day window" />
              <HoloGauge value={38} label="Route savings" sub="Optimized vs naive" />
              <HoloGauge value={100} label="Data isolation" sub="Company-level RLS" />
            </div>
          </div>
        </div>

        {/* Licensing */}
        <div id="licensing" className="max-w-6xl mx-auto px-4 pb-16">
          <h2 className="text-3xl font-extrabold tracking-tight admin-headline text-center">Licensing options</h2>
          <p className="text-center text-emerald-100/60 mt-3 mb-10">One-time setup plus a monthly license subscription, billed securely through PayPal.</p>
          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map((t, i) => (
              <div key={t.key} className={`rounded-3xl p-7 flex flex-col ${i === 1 ? "holo-panel-deep border-2 border-[#1d9e56]" : "holo-panel-deep border border-[#1d9e56]/20"}`}>
                {i === 1 && <span className="self-start mb-3 rounded-full bg-[#1d9e56] text-[#0c3b24] text-[10px] font-bold tracking-widest uppercase px-3 py-1">Most popular</span>}
                <div className="text-lg font-bold text-[#a8f0cc]">{t.name} <span className="text-xs font-semibold text-emerald-100/50">· {t.tag}</span></div>
                <div className="mt-4 text-4xl font-extrabold text-white">${t.monthly}<span className="text-base font-semibold text-emerald-100/50">/mo CAD</span></div>
                <div className="text-sm text-emerald-100/60 mt-1">+ ${t.setup.toLocaleString("en-CA")} one-time setup</div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {t.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-emerald-100/80">
                      <CheckCircle2 className="w-4 h-4 text-[#1d9e56] mt-0.5 shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
                <button onClick={() => openBuy(t.key)} className="mt-6 w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-6 py-3 hover:bg-[#17a04c] transition-colors">
                  License the OS
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Database, t: "Company-level isolation", d: "Row-level security walls off every company's customers, jobs and invoices. No business can ever see another's data." },
              { icon: RefreshCcw, t: "Verified provisioning", d: "Your account is provisioned only after PayPal verifies your subscription payment. Test mode until you flip it live." },
              { icon: Lock, t: "You control access", d: "Pause, resume or cancel from the national console. Cancelling ends the PayPal billing and locks the dashboard." },
            ].map((c) => (
              <div key={c.t} className="holo-panel-deep rounded-2xl border border-[#1d9e56]/20 p-6">
                <c.icon className="w-5 h-5 text-[#1d9e56] mb-3" />
                <div className="font-bold text-[#a8f0cc]">{c.t}</div>
                <p className="text-sm text-emerald-100/60 mt-2 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Purchase modal */}
      {buying && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !submitting && setBuying(null)}>
          <form onSubmit={submitBuy} onClick={(e) => e.stopPropagation()} className="bg-white rounded-3xl p-7 w-full max-w-md">
            <div className="flex items-center gap-2 mb-1">
              <Recycle className="w-5 h-5 text-[#1d9e56]" />
              <h3 className="text-xl font-bold text-[#0c3b24]">License the {buying} plan</h3>
            </div>
            <p className="text-sm text-slate-500 mb-5">You'll complete setup and monthly payments on the secure PayPal page.</p>
            <div className="space-y-3">
              <input required value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} className="input" placeholder="Company name" />
              <input required value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} className="input" placeholder="Your name" />
              <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" placeholder="Business email (your login)" />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" placeholder="City" />
                <select value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} className="input">
                  {PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            <button disabled={submitting} className="mt-5 w-full rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-6 py-3.5 hover:bg-[#17a04c] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Preparing checkout…</> : <>Continue to PayPal</>}
            </button>
          </form>
        </div>
      )}
      <Footer />
    </div>
  );
}