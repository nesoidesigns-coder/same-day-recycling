import { Link } from "react-router-dom";
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
import Footer from "@/components/sdr/Footer";

const TRUCK_IMG = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/b9a321aaa_generated_7ecc31ed.jpg";
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
    price: "$299",
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
    a: "Network pricing starts from $139. Your territory, your rates above the floor — you keep the margin you earn.",
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
  return (
    <div className="bg-white">
      <TopBar />
      <Navbar />

      {/* Hero */}
      <section className="bg-[#0c3b24] text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-5">
              <span className="w-8 h-px bg-[#1d9e56]" />
              The Partner Network
            </div>
            <h1 className="text-4xl md:text-6xl font-bold leading-[1.05] tracking-tight">
              Your truck. Our machine. Your city fills up.
            </h1>
            <p className="mt-6 text-lg text-slate-300 max-w-lg leading-relaxed">
              You didn't get into hauling to answer phones, chase quotes, and beg Google for attention.
              That's our job. Same Day Recycling is Canada's booking engine for junk and recycling
              contractors — we build the pages, run the ads, answer every call and message 24/7 in six
              languages, and drop booked jobs into your hands. You show up, haul, and get paid.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a href="#apply" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-7 py-4 text-center hover:bg-[#17a04c] transition-colors">
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

      {/* THE ADMIN */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
          <div className="max-w-2xl">
            <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">The admin</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Your business, run like a company</h2>
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
                  <span className="w-10 h-10 rounded-xl bg-[#1d9e56]/10 flex items-center justify-center mb-4">
                    <item.icon className="w-5 h-5 text-[#1d9e56]" />
                  </span>
                  <h3 className="text-lg font-bold text-[#0c3b24]">{item.title}</h3>
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
            <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">The pages</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">Your territory, owned</h2>
            <p className="mt-4 text-lg text-slate-600">
              A city page built under the name that <em>is</em> the search term — "junk removal [your city]" —
              plus service pages for furniture, appliances, estate cleanouts and more. Every page is written,
              maintained, and kept ranking by us. You just answer the jobs it books.
            </p>
            <Link
              to="/junk-removal-vancouver"
              className="mt-6 inline-flex items-center gap-2 font-bold text-[#1d9e56] hover:underline"
            >
              See a live territory page <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-8">
            <div className="grid grid-cols-2 gap-4">
              {["Furniture Removal", "Appliance Pickup", "Estate Cleanouts", "Condo & Strata", "Office Cleanouts", "Free Metal Pickup"].map((s) => (
                <div key={s} className="rounded-2xl bg-[#f4f7f5] px-4 py-5 font-bold text-[#0c3b24] text-sm text-center">
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
            <div className="text-xs font-bold tracking-[0.2em] text-[#1d9e56] uppercase mb-3">Partner pricing</div>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-[#0c3b24]">One flat monthly rate. That's the whole machine.</h2>
            <p className="mt-4 text-slate-600">Plus a one-time territory activation of $250–500 to build and launch your pages.</p>
          </div>
          <div className="mt-12 grid md:grid-cols-3 gap-6">
            {tiers.map((t) => (
              <div
                key={t.name}
                className={`rounded-3xl p-8 border ${t.featured ? "border-[#1d9e56] bg-[#f4f7f5] shadow-lg" : "border-slate-100 bg-white shadow-sm"}`}
              >
                <div className="text-sm font-bold uppercase tracking-wide text-slate-500">{t.name}</div>
                <div className="mt-3 text-4xl font-bold text-[#0c3b24]">
                  {t.price}<span className="text-lg font-semibold text-slate-500">/mo</span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{t.note}</p>
              </div>
            ))}
          </div>
          <div className="mt-8 max-w-2xl mx-auto text-center space-y-3">
            <p className="inline-flex items-center gap-2 rounded-full bg-[#0c3b24] text-white font-bold px-6 py-3 text-sm">
              <BadgeCheck className="w-4 h-4 text-[#1d9e56]" />
              Exclusive territory — one partner per city. When your city is taken, it's taken.
            </p>
            <p className="text-slate-600 font-semibold">You spend $0 on ads, $0 on a website, $0 on an office.</p>
          </div>
        </div>
      </section>

      {/* REQUIREMENTS */}
      <section className="bg-[#0c3b24] text-white">
        <div className="max-w-5xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">What it takes to join</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requirements.map((r) => (
              <div key={r.text} className="flex items-start gap-3 rounded-2xl bg-white/5 p-5">
                <r.icon className="w-5 h-5 text-[#1d9e56] shrink-0 mt-0.5" />
                <span className="font-semibold text-sm">{r.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APPLICATION FORM */}
      <section id="apply" className="bg-[#f4f7f5]">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0c3b24]">Apply for your territory</h2>
            <p className="mt-3 text-slate-600">Territories open in order of application. We call every applicant.</p>
          </div>
          <PartnerApplicationForm />
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white">
        <div className="max-w-3xl mx-auto px-4 py-16 md:py-20">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-[#0c3b24]">Contractor FAQ</h2>
          <div className="mt-8 space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-2xl border border-slate-100 bg-white p-6">
                <h3 className="font-bold text-[#0c3b24]">{f.q}</h3>
                <p className="mt-2 text-slate-600 text-sm leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#1d9e56] text-[#0c3b24]">
        <div className="max-w-4xl mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">Your city is open — for now.</h2>
          <p className="mt-3 font-semibold">One partner per city, in order of application.</p>
          <a href="#apply" className="mt-8 inline-block rounded-full bg-[#0c3b24] text-white font-bold px-8 py-4 hover:bg-[#0a3020] transition-colors">
            Apply for Your Territory
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}