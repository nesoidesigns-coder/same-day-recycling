import { useState } from "react";
import { useSEO } from "@/lib/seo";
import { Link } from "react-router-dom";
import {
  Recycle, Calculator, CalendarCheck, Receipt, Globe2,
  Bot, Star, CheckCircle2, Building2, Sparkles, ArrowRight,
} from "lucide-react";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import WhiteLabelApplicationForm from "@/components/wl/WhiteLabelApplicationForm";

const INCLUDED = [
  { icon: CalendarCheck, title: "Same-day booking engine", text: "Online booking with time windows, address capture and photo upload, flowing straight into dispatch." },
  { icon: Calculator, title: "Instant quote calculator", text: "Visitors price their load in seconds — the funnel that turns lookers into booked jobs." },
  { icon: Bot, title: "24/7 AI receptionist", text: "Answers in five languages, books jobs while you sleep, and captures photos for volume estimates." },
  { icon: Receipt, title: "Recycling receipts", text: "Every completed job gets an eco-impact receipt — the follow-up that earns reviews and referrals." },
  { icon: Star, title: "Review requests", text: "Automated Google review asks after each completed pickup, on schedule." },
  { icon: Globe2, title: "City SEO pages", text: "A dedicated, optimized landing page per city you serve — plus sitemap and Search Console setup." },
];

const MODES = [
  {
    icon: Building2,
    title: "Custom branding",
    tagline: "Shared system, your brand",
    desc: "Your logo, colors and name on the booking tools, quote calculator and receptionist — one shared platform behind the scenes. Fastest and most affordable path.",
    best: "Best for single-city operators who want modern tools without building software.",
  },
  {
    icon: Sparkles,
    title: "Full separate app",
    tagline: "Your own platform",
    desc: "A dedicated instance with your own branding, admin area, data and automations. You own the customer experience end to end.",
    best: "Best for established companies running multiple cities or crews.",
  },
  {
    icon: ArrowRight,
    title: "Lead-gen split",
    tagline: "Pay per job",
    desc: "We run the tools under your brand and share revenue per completed job instead of a monthly fee. You only pay when you get paid.",
    best: "Best for new operators testing the model before committing.",
  },
];

const PLANS = [
  {
    name: "Starter",
    setup: "$2,500",
    monthly: "$199/mo",
    highlight: false,
    features: ["Branded booking page", "Quote calculator", "AI receptionist", "Review requests", "Recycling receipts"],
  },
  {
    name: "Growth",
    setup: "$4,500",
    monthly: "$399/mo",
    highlight: true,
    features: ["Everything in Starter", "City SEO pages per market", "Partner network admin", "Subscriptions module", "Lead follow-up automation"],
  },
  {
    name: "Network",
    setup: "$9,500",
    monthly: "$799/mo",
    highlight: false,
    features: ["Everything in Growth", "Facebook AI auto-post & replies", "Competitor benchmarking tools", "Analytics dashboard", "Lead-gen revenue split option"],
  },
];

export default function WhiteLabel() {
  useSEO({
    title: "White-Label Recycling Apps for Your Brand | Same Day Recycling",
    description: "Launch a branded recycling service app — white-label booking, dispatch and customer management powered by Same Day Recycling.",
    path: "/white-label",
  });
  const [mode, setMode] = useState("custom_branding");

  return (
    <div className="bg-white">
      <Navbar />

      <section className="bg-[#102B2A] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-24">
          <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">White label program</div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
            Run the whole machine. Under your name.
          </h1>
          <p className="mt-5 text-lg text-emerald-100/80 max-w-2xl">
            The booking engine, AI receptionist, quote calculator and recycling system that powers Same Day Recycling —
            licensed to other junk removal businesses with your branding on every customer touchpoint.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="#apply" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-3.5 hover:bg-[#125C4E] transition-colors">Apply for the program</a>
            <a href="#pricing" className="rounded-full border-2 border-white/30 text-white font-bold px-7 py-3.5 hover:border-[#187B65] hover:text-[#187B65] transition-colors">See pricing</a>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">What you get on day one</h2>
        <p className="text-slate-600 mt-2 max-w-2xl">Everything below is built and running on our live platform — the same system that powers this site. Screens shown are illustrative examples, not customer results.</p>
        <div className="grid md:grid-cols-3 gap-4 mt-10">
          {INCLUDED.map((f) => (
            <div key={f.title} className="rounded-3xl bg-[#f4f7f5] p-6">
              <f.icon className="w-7 h-7 text-[#187B65]" />
              <h3 className="font-bold text-[#102B2A] mt-3">{f.title}</h3>
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#f4f7f5]">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">Three ways to run it</h2>
          <p className="text-slate-600 mt-2 max-w-2xl">Pick the mode that fits your business — and change your mind later.</p>
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {MODES.map((m) => (
              <div key={m.title} className="rounded-3xl bg-white border border-slate-100 p-7 flex flex-col">
                <m.icon className="w-8 h-8 text-[#187B65]" />
                <h3 className="text-xl font-bold text-[#102B2A] mt-4">{m.title}</h3>
                <div className="text-xs font-bold tracking-[0.15em] text-[#187B65] uppercase mt-1">{m.tagline}</div>
                <p className="text-sm text-slate-600 mt-3 leading-relaxed flex-1">{m.desc}</p>
                <p className="text-xs text-slate-500 mt-4 pt-4 border-t border-slate-100">{m.best}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="max-w-6xl mx-auto px-4 py-16 md:py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">Setup fee + monthly license</h2>
        <p className="text-slate-600 mt-2 max-w-2xl">One-time setup covers your branding, data migration and launch. The monthly license covers hosting, AI credits and support. Annual commitments get one month free.</p>
        <div className="grid md:grid-cols-3 gap-4 mt-10 items-start">
          {PLANS.map((p) => (
            <div key={p.name} className={`rounded-3xl p-8 ${p.highlight ? "bg-[#102B2A] text-white shadow-xl" : "bg-[#f4f7f5] text-[#102B2A]"}`}>
              {p.highlight && <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Most popular</div>}
              <h3 className="text-2xl font-bold">{p.name}</h3>
              <div className="mt-4 flex items-end gap-2">
                <div className="text-3xl font-bold">{p.setup}</div>
                <div className={`text-sm pb-1 ${p.highlight ? "text-emerald-100/70" : "text-slate-500"}`}>setup</div>
              </div>
              <div className="text-lg font-bold text-[#187B65] mt-1">{p.monthly}</div>
              <ul className="mt-6 space-y-2.5 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#187B65] mt-0.5 shrink-0" />
                    <span className={p.highlight ? "text-emerald-50" : "text-slate-600"}>{f}</span>
                  </li>
                ))}
              </ul>
              <a href="#apply" className={`mt-7 block text-center rounded-full font-bold px-6 py-3 ${p.highlight ? "bg-[#187B65] text-[#102B2A] hover:bg-[#125C4E]" : "border-2 border-[#102B2A] text-[#102B2A] hover:bg-[#102B2A] hover:text-white"} transition-colors`}>
                Apply
              </a>
            </div>
          ))}
        </div>
      </section>

      <section id="apply" className="bg-[#f4f7f5]">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold text-[#102B2A] tracking-tight">Apply for the white-label program</h2>
          <p className="text-slate-600 mt-2 mb-8 max-w-2xl">Tell us about your business and we'll send a tailored proposal with your setup scope and launch date.</p>
          <WhiteLabelApplicationForm />
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="rounded-3xl bg-[#102B2A] text-white p-10 text-center">
          <Recycle className="w-8 h-8 text-[#187B65] mx-auto" />
          <h2 className="text-2xl md:text-3xl font-bold mt-4">Not ready to apply?</h2>
          <p className="text-emerald-100/80 mt-2">See the network model in action, or call us at (604) 849-1745.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/about" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-3 hover:bg-[#125C4E] transition-colors">How the network works</Link>
            <a href="tel:+16048491745" className="rounded-full border-2 border-white/30 font-bold px-7 py-3 hover:border-[#187B65] hover:text-[#187B65] transition-colors">Call now</a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}