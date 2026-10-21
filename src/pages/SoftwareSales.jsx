import { Link } from "react-router-dom";
import { useSEO } from "@/lib/seo";
import {
  Users, CalendarDays, Truck, Receipt, BarChart3,
  ShieldCheck, Globe2, CheckCircle2, Database, RefreshCcw, CreditCard, Lock,
} from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import HoloGauge from "@/components/software/HoloGauge";
import PreviewImg from "@/components/software/PreviewImg";
import EnterpriseInquiryForm from "@/components/software/EnterpriseInquiryForm";
import RoiCalculator from "@/components/software/RoiCalculator";
import PlatformChat from "@/components/software/PlatformChat";

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
  useSEO({
    title: "Recycling Business Software & Licensing | Same Day Recycling",
    description: "Manage customers, pickup scheduling, dispatch, invoicing and analytics. Compare Same Day Recycling software licenses, setup fees, onboarding and support.",
    path: "/software",
  });
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="admin-console text-white">
        {/* Hero */}
        <div className="max-w-6xl mx-auto px-4 pt-16 pb-14 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#187B65]/40 bg-[#187B65]/10 px-4 py-1.5 text-xs font-bold tracking-[0.18em] uppercase text-[#54D9AE]">
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
            <a href="#licensing" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-3.5 hover:bg-[#125C4E] transition-colors flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> Get a license
            </a>
            <a href="#preview" className="rounded-full border border-[#187B65]/40 text-[#54D9AE] font-bold px-7 py-3.5 hover:bg-[#187B65]/10 transition-colors">
              See the OS
            </a>
            <a href="#ask" className="rounded-full border border-[#187B65]/40 text-[#54D9AE] font-bold px-7 py-3.5 hover:bg-[#187B65]/10 transition-colors">
              Ask Rex
            </a>
          </div>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
            {[
              { k: "99.9%", v: "Platform uptime target" },
              { k: "13", v: "Provinces & territories in the network plan" },
              { k: "24/7", v: "Always-on operations" },
              { k: "CAD", v: "Priced in Canadian dollars" },
            ].map((s) => (
              <div key={s.k} className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-5">
                <div className="text-2xl font-extrabold text-[#54D9AE] holo-glow-text">{s.k}</div>
                <div className="text-xs text-emerald-100/60 mt-1">{s.v}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard preview */}
        <div id="preview" className="max-w-6xl mx-auto px-4 pb-16">
          <div className="holo-panel-deep rounded-3xl border border-[#187B65]/25 p-6 md:p-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-xs font-bold tracking-[0.18em] uppercase text-[#187B65] mb-3">Inside the dashboard</div>
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
                      <CheckCircle2 className="w-4 h-4 text-[#187B65] mt-0.5 shrink-0" /> {p}
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
              <div key={f.title} className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-6 hover:border-[#187B65]/50 transition-colors">
                <span className="w-10 h-10 rounded-xl bg-[#187B65]/15 text-[#187B65] flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5" />
                </span>
                <div className="font-bold text-[#54D9AE]">{f.title}</div>
                <p className="text-sm text-emerald-100/60 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Live gauges */}
        <div className="max-w-6xl mx-auto px-4 pb-16">
          <div className="holo-panel-deep rounded-3xl border border-[#187B65]/25 p-8 md:p-12">
            <div className="text-center mb-10">
              <div className="text-xs font-bold tracking-[0.18em] uppercase text-[#187B65]">Platform design</div>
              <h2 className="text-3xl font-extrabold tracking-tight admin-headline mt-2">Engineered for trust</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              <HoloGauge value={99.9} label="Uptime target" sub="Design commitment" />
              <HoloGauge value={100} label="Data isolation" sub="Company-level RLS by design" />
              <HoloGauge value={100} label="Automated workflows" sub="Quote, dispatch and invoicing tools" />
              <HoloGauge value={100} label="Same-day dispatch" sub="Book before noon, where service is live" />
            </div>
          </div>
        </div>

        {/* ROI calculator */}
        <div id="roi-calculator">
          <RoiCalculator />
        </div>

        {/* Live platform guide */}
        <div id="ask" className="max-w-4xl mx-auto px-4 pb-16">
          <div className="text-center mb-8">
            <div className="text-xs font-bold tracking-[0.18em] uppercase text-[#187B65]">Live walkthrough</div>
            <h2 className="text-3xl font-extrabold tracking-tight admin-headline mt-2">Ask Rex — he explains the whole system</h2>
            <p className="text-emerald-100/60 mt-3 max-w-xl mx-auto">
              Business owners and buyers: get every question about the OS, white-label, pricing and the AI answered live. Rex passes serious buyers to the team for a callback.
            </p>
          </div>
          <PlatformChat />
        </div>

        {/* Licensing */}
        <div id="licensing" className="max-w-6xl mx-auto px-4 pb-16">
          <h2 className="text-3xl font-extrabold tracking-tight admin-headline text-center">Licensing options</h2>
          <p className="text-center text-emerald-100/60 mt-3 mb-10">One-time setup plus a monthly license subscription, billed securely through PayPal.</p>
          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map((t, i) => (
              <div key={t.key} className={`rounded-3xl p-7 flex flex-col ${i === 1 ? "holo-panel-deep border-2 border-[#187B65]" : "holo-panel-deep border border-[#187B65]/20"}`}>
                {i === 1 && <span className="self-start mb-3 rounded-full bg-[#187B65] text-[#102B2A] text-[10px] font-bold tracking-widest uppercase px-3 py-1">Most popular</span>}
                <div className="text-lg font-bold text-[#54D9AE]">{t.name} <span className="text-xs font-semibold text-emerald-100/50">· {t.tag}</span></div>
                <div className="mt-4 text-4xl font-extrabold text-white">${t.monthly}<span className="text-base font-semibold text-emerald-100/50">/mo CAD</span></div>
                <div className="text-sm text-emerald-100/60 mt-1">+ ${t.setup.toLocaleString("en-CA")} one-time setup</div>
                <ul className="mt-5 space-y-2.5 flex-1">
                  {t.points.map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-emerald-100/80">
                      <CheckCircle2 className="w-4 h-4 text-[#187B65] mt-0.5 shrink-0" /> {p}
                    </li>
                  ))}
                </ul>
                {t.key === "network" ? (
                  <a href="#enterprise" className="mt-6 w-full rounded-full border-2 border-[#187B65] text-[#54D9AE] font-bold px-6 py-3 hover:bg-[#187B65]/10 transition-colors text-center block">
                    Talk to our team
                  </a>
                ) : (
                  <Link to={`/software/start?plan=${t.key}`} className="mt-6 w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 hover:bg-[#125C4E] transition-colors text-center block">
                    License the OS
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Enterprise inquiry */}
        <div id="enterprise" className="max-w-3xl mx-auto px-4 pb-16">
          <div className="holo-panel-deep rounded-3xl border border-[#187B65]/25 p-8">
            <div className="text-xs font-bold tracking-[0.18em] uppercase text-[#187B65]">Enterprise &amp; multi-territory</div>
            <h2 className="text-3xl font-extrabold tracking-tight admin-headline mt-2">Talk to our team</h2>
            <p className="text-emerald-100/60 mt-3">
              Running multiple territories or a large fleet? Tell us about your operation and we'll scope a Network license for you.
            </p>
            <EnterpriseInquiryForm />
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
              <div key={c.t} className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-6">
                <c.icon className="w-5 h-5 text-[#187B65] mb-3" />
                <div className="font-bold text-[#54D9AE]">{c.t}</div>
                <p className="text-sm text-emerald-100/60 mt-2 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}