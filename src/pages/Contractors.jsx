import { Link } from "react-router-dom";
import { useSEO } from "@/lib/seo";
import {
  Phone,
  MonitorSmartphone,
  Mail,
  Search,
  Truck,
  Building2,
  ShieldCheck,
  Clock,
  DollarSign,
  BadgeCheck,
  ArrowRight,
} from "lucide-react";
import { Image } from "@/components/ui/image";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import PartnerApplicationForm from "@/components/sdr/PartnerApplicationForm";
import FoundingPartnerOffer from "@/components/sdr/FoundingPartnerOffer";
import PartnerAgreement from "@/components/sdr/PartnerAgreement";
import Footer from "@/components/sdr/Footer";

const TRUCK_IMG = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/5dbff3504_generated_image.png";
const SHOT_LIVE = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/8aa416e4a_generated_image.png";
const SHOT_FOLLOWUPS = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/02dad690b_generated_image.png";
const SHOT_SEO = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/0b275c5af_generated_image.png";

const adminItems = [
  {
    icon: MonitorSmartphone,
    img: SHOT_LIVE,
    title: "Live booking tracker",
    text: "Every booking in your territory on one screen, in real time. No notebook, no missed calls — the job is there before you wake up.",
  },
  {
    icon: Mail,
    img: SHOT_FOLLOWUPS,
    title: "AI follow-ups that never quit",
    text: "The machine chases every lead — warm close, objection handling, final nudge — until it books. You never chase a quote again.",
  },
  {
    icon: Search,
    img: SHOT_SEO,
    title: "SEO insights + realtime traffic",
    text: "See exactly what your territory is ranking for, which keywords are moving, and who is on your page right now.",
  },
];

const tiers = [
  {
    name: "Small markets",
    price: "$349",
    note: "Towns and smaller regional cities",
  },
  {
    name: "Standard cities",
    price: "$499",
    note: "Mid-size cities with solid search volume",
    featured: true,
  },
  {
    name: "Metro territories",
    price: "$999",
    note: "Major metros — full network push",
  },
];

const requirements = [
  { icon: Truck, text: "You own your truck and crew" },
  { icon: Building2, text: "You're a registered business" },
  { icon: ShieldCheck, text: "Liability insurance — provide a certificate (COI)" },
  { icon: Clock, text: "Same-day service standard on every booking" },
  { icon: DollarSign, text: "Upfront pricing honored on every job" },
];

const faqs = [
  {
    q: "How do I get paid?",
    a: "You bill the customer directly. Payment goes straight to you — the network never touches your job revenue.",
  },
  {
    q: "Who sets prices?",
    a: "Network pricing starts from $139. You set your own rates above the network floor — you keep the margin you earn. Territories are membership seats in a shared market, not exclusive rights.",
  },
  {
    q: "Can I keep my own customers?",
    a: "Yes — your own customers are always yours. The machine adds volume; it never takes your book.",
  },
  {
    q: "What if I want to leave?",
    a: "Cancel anytime. Your territory simply reopens for the next partner on the list.",
  },
];

export default function Contractors() {
  useSEO({
    title: "Recycling Partner Network — Contractor Applications",
    description: "Join the Same Day Recycling partner network — operate your territory with our booking, dispatch and customer platform.",
    path: "/contractors",
  });
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />

      {/* Hero */}
      <section className="bg-[#102B2A] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-gold uppercase mb-5">
              <span className="w-8 h-px bg-gold" />
              The Partner Network
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Your truck. Our machine. Your city fills up.
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-lg leading-relaxed">
              You didn't get into hauling to answer phones, chase quotes, and beg Google for attention.
              That's our job. Same Day Recycling is Canada's booking engine for junk and recycling
              contractors — we build the pages, run the ads, answer every call and message 24/7 in five
              languages, and drop booked jobs into your hands. You show up, haul, and get paid.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#apply" className="rounded-full bg-[#187B65] text-[#102B2A] font-bold px-7 py-4 text-center hover:bg-[#125C4E] transition-colors">
                Apply for Your Territory
              </a>
              <a href="tel:+16048491745" className="flex items-center justify-center gap-2 rounded-full border-2 border-white/30 text-white font-bold px-7 py-4 hover:bg-white/10 transition-colors">
                <Phone className="w-4 h-4" /> (604) 849-1745
              </a>
            </div>
          </div>
          <div className="rounded-3xl overflow-hidden bg-[#0a3020]">
            <Image src={TRUCK_IMG} alt="Junk removal truck" className="w-full aspect-[4/3]" fittingType="fill" />
          </div>
        </div>
      </section>

      {/* Your revenue, your terms */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-4 py-16 md:py-20 text-center">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Your Business. Your Customers. Your Revenue.</h2>
          <p className="mt-5 text-lg text-slate-600">
            Same Day Recycling provides professional software and network opportunities for independent
            recycling and junk removal companies. Keep the revenue from customers you acquire yourself.
            Pay only the fees agreed to under your selected services.
          </p>
          <div className="mt-10 grid sm:grid-cols-3 gap-4 text-left">
            {[
              { t: "Join the contractor network", d: "You receive platform-generated job opportunities in your city, run them with your crew, and keep the job revenue. Your monthly membership is the agreed cost; any separately disclosed dispatch or referral fee on platform-generated opportunities is shown to you before you accept each job." },
              { t: "Buy the standalone software", d: "License the operating system on its own and manage your own customers, dispatch, scheduling, quotes, invoices, payments and analytics. You keep 100% of revenue from customers you acquire yourself — no commission on independently sourced jobs." },
              { t: "Negotiate a referral agreement", d: "Some partners choose an individually negotiated referral or commission arrangement. These are separate written agreements with disclosed terms — never a default charge, and never applied to jobs you source yourself." },
            ].map((c) => (
              <div key={c.t} className="rounded-3xl border border-slate-100 bg-white shadow-sm p-6">
                <h3 className="font-bold text-[#102B2A]">{c.t}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{c.d}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 text-sm text-slate-500 max-w-2xl mx-auto">
            Network access provides opportunities, not guarantees: we do not promise a number of jobs, specific earnings,
            exclusive territories, or any particular operational result. All applicable fees are disclosed in writing before
            you accept any agreement.
          </p>
        </div>
      </section>

      <FoundingPartnerOffer />

      {/* THE ADMIN */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">The admin</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Your business, run like a company</h2>
            <p className="mt-4 text-lg text-slate-600">
              While you're on the truck, the dashboard is running your office: bookings tracked live,
              leads chased automatically, and your territory's search performance on one screen.
            </p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {adminItems.map((item) => (
              <div key={item.title} className="rounded-3xl border border-slate-100 bg-white shadow-sm overflow-hidden flex flex-col">
                <div className="aspect-[16/10] bg-[#0f1f16]">
                  <Image src={item.img} alt={item.title} className="w-full h-full" fittingType="fill" />
                </div>
                <div className="p-6">
                  <span className="w-10 h-10 rounded-xl bg-[#187B65]/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-[#187B65]" />
                  </span>
                  <h3 className="text-lg font-bold text-[#102B2A]">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE PAGES */}
      <section className="bg-[#f4f7f5]">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">The pages</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Your city pages, built for you</h2>
            <p className="mt-4 text-lg text-slate-600">
              A city page built under the name that <em>is</em> the search term — "junk removal [your city]" —
              plus service pages for furniture, appliances, estate cleanouts and more. Every page is written,
              maintained, and kept ranking by us. You just answer the jobs it books.
            </p>
            <Link
              to="/coverage"
              className="mt-6 inline-flex items-center gap-2 font-bold text-[#187B65] hover:underline"
            >
              See a live territory page <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8">
            <div className="grid grid-cols-2 gap-4">
              {["Furniture Removal", "Appliance Pickup", "Estate Cleanouts", "Condo & Strata", "Office Cleanouts", "Free Metal Pickup"].map((s) => (
                <div key={s} className="rounded-2xl bg-[#f4f7f5] px-4 py-5 font-bold text-[#102B2A] text-sm text-center">
                  {s}
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-slate-500 text-center">Every service page, built and maintained for your city.</p>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">Partner pricing</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#102B2A]">One flat monthly rate. That's the whole machine.</h2>
            <p className="mt-4 text-slate-600">Plus a one-time territory activation of $250–500 to build and launch your pages.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`rounded-3xl p-8 border ${t.featured ? "border-[#187B65] bg-[#f4f7f5] shadow-lg" : "border-slate-100 bg-white shadow-sm"}`}
              >
                <div className="text-sm font-bold uppercase tracking-wide text-slate-500">{t.name}</div>
                <div className="mt-3 text-4xl font-bold text-[#102B2A]">
                  {t.price}<span className="text-lg font-semibold text-slate-500">/mo</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{t.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 max-w-2xl mx-auto text-center space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#102B2A] text-white font-bold px-6 py-3 text-sm">
              <BadgeCheck className="w-4 h-4 text-[#187B65]" />
              Membership plans are capped per market to keep job flow healthy for every member.
            </p>
            <p className="text-slate-600 font-semibold">No hidden charges: every fee is disclosed in your agreement before you sign.</p>
            <p className="text-sm">
              <Link to="/contractor-membership" className="inline-flex items-center gap-1.5 font-bold text-[#187B65] hover:underline">
                Full comparison: entitlements, fees, billing, cancellation &amp; regions <ArrowRight className="w-4 h-4" />
              </Link>
            </p>
          </div>
          <div className="mt-10 max-w-3xl mx-auto rounded-3xl border border-slate-200 bg-[#f6f8f7] p-6 md:p-8">
            <h3 className="text-lg font-bold text-[#102B2A]">Subscription terms, plainly</h3>
            <ul className="mt-4 space-y-2.5 text-sm text-slate-600">
              <li><span className="font-bold text-[#102B2A]">What you pay:</span> a flat monthly territory subscription, plus a one-time territory activation. Job commissions are NOT automatic: they apply only if your written agreement says so, and only for the job sources it lists.</li>
              <li><span className="font-bold text-[#102B2A]">Cancellation:</span> cancel with written notice. Your territory reopens for the next partner when your agreement ends.</li>
              <li><span className="font-bold text-[#102B2A]">Territory conditions:</span> territories are membership seats in a shared market, not exclusive rights. Territory pages stay on the platform's domain.</li>
              <li><span className="font-bold text-[#102B2A]">Lead delivery limits:</span> lead flow depends on customer demand in your city. No minimum number of jobs is promised, and no earnings are guaranteed.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="bg-[#102B2A] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What it takes to join</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requirements.map((r) => (
              <div key={r.text} className="flex items-start gap-3 rounded-2xl bg-white/5 p-5">
                <r.icon className="w-5 h-5 text-[#187B65] shrink-0 mt-0.5" />
                <span className="font-semibold text-sm">{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PartnerAgreement />

      {/* APPLICATION FORM */}
      <section id="apply" className="bg-[#f4f7f5]">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#102B2A]">Apply for your territory</h2>
            <p className="mt-3 text-slate-600">Territories open in order of application. We call every applicant.</p>
          </div>
          <PartnerApplicationForm />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#102B2A]">Contractor FAQ</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-slate-100 bg-white p-6">
                <h3 className="font-bold text-[#102B2A]">{f.q}</h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#187B65] text-[#102B2A]">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Your Business. Your Customers. Your Revenue.</h2>
          <p className="mt-3 font-semibold">Apply today — a real person reviews every application and calls you back.</p>
          <a href="#apply" className="mt-8 inline-block rounded-full bg-[#102B2A] text-white font-bold px-8 py-4 hover:bg-[#0a3020] transition-colors">
            Apply for Your Territory
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}