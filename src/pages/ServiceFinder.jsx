import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Loader2, Sparkles, Phone, ArrowRight } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import { LETTER_PROVINCE, PROVINCE_NAMES } from "@/components/sdr/PostalCheck";
import { useSEO, useStructuredData } from "@/lib/seo";

// Service guidance is static and factual — the assistant never states
// prices, dates or provider names; it only reports verified coverage
// and points to the tools that produce real quotes.
const SERVICE_INFO = {
  junk_removal: { label: "junk removal", requirements: "The crew lifts everything from any room — furniture, appliances, mattresses, yard waste, renovation debris and general junk are all accepted (except hazardous materials like paint, chemicals, asbestos and fuel). Every load is sorted for donation and recycling." },
  furniture_removal: { label: "furniture removal", requirements: "Sofas, mattresses, dressers and tables are lifted out by the crew; reusable pieces go to donation partners and metal is recycled." },
  appliance_removal: { label: "appliance removal", requirements: "Fridges, washers, stoves and other appliances are carried out by the crew and recycled as scrap metal. Nothing needs to be disconnected in advance." },
  electronics_recycling: { label: "electronics recycling", requirements: "TVs, computers, printers and other e-waste are collected and routed to dedicated electronics recyclers — please wipe devices before pickup." },
  office_commercial: { label: "a commercial or office cleanout", requirements: "Office furniture, e-waste and fit-out debris are hauled one-time or on a recurring schedule, with a diversion-rate certificate after each completed job." },
  metal_pickup: { label: "scrap metal pickup", requirements: "Scrap metal pickup is free wherever a network partner is live — list or photograph the items and we'll confirm." },
  scheduled_pickup: { label: "a scheduled recycling pickup", requirements: "Recurring pickups can run weekly or per phase for homes, property managers and contractors." },
  other: { label: "a removal or recycling job", requirements: "Tell me the items or materials and I'll match them to the right service." },
};

const QUICK_JOBS = [
  "I need an old refrigerator removed in Surrey",
  "Clear out a garage full of junk in Vancouver",
  "Office cleanout in Burnaby before the lease ends",
  "Old TV and computer recycling pickup",
];

const GREETING = "Hi! Tell me what you need removed or recycled — and which city it's in (or your postal code). I'll check verified coverage and point you to a real quote. I only report what's confirmed, so I'll never promise a service or price that isn't.";

export default function ServiceFinder() {
  const [messages, setMessages] = useState([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useSEO({
    title: "Service Finder — Check Pickup Availability Across Canada | Same Day Recycling",
    description: "Describe your job conversationally and get verified pickup availability for your city, what we accept, and a path to a real quote — no invented prices or coverage.",
    path: "/service-finder",
  });
  useStructuredData("finder-breadcrumb", {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://samedayrecycling.ca/" },
      { "@type": "ListItem", position: 2, name: "Service Finder", item: "https://samedayrecycling.ca/service-finder" },
    ],
  });

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, busy]);

  const buildReply = (intent) => {
    const service = SERVICE_INFO[intent.service_type] || SERVICE_INFO.other;
    const postal = String(intent.postal_code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const province = postal && LETTER_PROVINCE[postal[0]] ? LETTER_PROVINCE[postal[0]] : null;
    const city = intent.city
      ? CITIES.find((c) => c.name.toLowerCase() === String(intent.city).toLowerCase().trim())
      : null;
    const items = Array.isArray(intent.items) && intent.items.length ? ` (${intent.items.slice(0, 4).join(", ")})` : "";

    if (city) {
      const lead = `Got it — ${service.label}${items} in ${city.name}, ${city.province}. Here's what I can confirm: `;
      if (city.status === "active") {
        return {
          role: "assistant",
          text: `${lead} same-day pickup is live and verified in ${city.name}. ${service.requirements} Book before noon for same-day service — pricing is quoted upfront and you approve it before anything is lifted.`,
          actions: [
            { label: `Quote & book in ${city.name}`, to: `/junk-removal-${city.slug}` },
            { label: "See pricing", to: "/pricing" },
          ],
        };
      }
      if (city.status === "partner_onboarding") {
        return {
          role: "assistant",
          text: `${lead} a verified partner is being onboarded in ${city.name} right now, so same-day service isn't confirmed there yet. I can't promise pickup dates or prices until a partner is verified — but you can register interest or browse the directory in the meantime.`,
          actions: [
            { label: "See live coverage", to: "/coverage" },
            { label: "Request availability", to: "/contact" },
          ],
        };
      }
      return {
        role: "assistant",
        text: `${lead} service isn't live in ${city.name} yet — it's on the planned expansion list, so I can't confirm a pickup there today.`,
        actions: [
          { label: "See live coverage", to: "/coverage" },
          { label: "Bring it to your city", to: "/contractor-onboarding" },
        ],
      };
    }

    if (province) {
      const active = CITIES.filter((c) => c.province === province && c.status === "active");
      if (active.length) {
        return {
          role: "assistant",
          text: `That postal code is in ${PROVINCE_NAMES[province]}, where same-day pickup is live and verified in ${active.map((c) => c.name).join(", ")}. Which city is the job in?`,
          actions: active.map((c) => ({ label: `Book in ${c.name}`, to: `/junk-removal-${c.slug}` })),
        };
      }
      return {
        role: "assistant",
        text: `That postal code is in ${PROVINCE_NAMES[province]}. Same-day pickup isn't live in this province yet — verified partners are being onboarded. Our national directory still lists recycling facilities near you.`,
        actions: [
          { label: "Browse the directory", to: `/recycling?loc=${encodeURIComponent(PROVINCE_NAMES[province])}` },
          { label: "Bring it to your city", to: "/contractor-onboarding" },
        ],
      };
    }

    return {
      role: "assistant",
      text: `Got it — you need ${service.label}${items}. Which city is the job in? Tell me the city or your postal code and I'll check verified coverage right away.`,
    };
  };

  const send = async (text) => {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await base44.functions.invoke("serviceFinder", { message });
      const intent = res.data?.intent || {};
      setMessages((m) => [...m, buildReply(intent)]);
    } catch {
      setMessages((m) => [...m, {
        role: "assistant",
        text: "I couldn't process that just now. Try again, or call (604) 849-1745 — the booking line is open 24 hours.",
        actions: [{ label: "Call (604) 849-1745", href: "tel:+16048491745" }],
      }]);
    }
    setBusy(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Navbar />

      <section className="bg-[#f4f7f5]">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16 grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <div className="text-xs font-bold tracking-[0.2em] text-[#187B65] uppercase mb-3">AI Service Finder</div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-[#102B2A]">Tell us what needs to go</h1>
            <p className="mt-4 text-lg text-slate-600 max-w-xl">
              Describe your job in your own words. I check verified coverage for your city and hand you off to a real quote — nothing invented, nothing promised.
            </p>
          </div>
          <div className="rounded-2xl bg-white border border-[#187B65]/20 p-5">
            <div className="text-xs font-bold tracking-[0.15em] text-[#187B65] uppercase mb-3 flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5" /> How it works</div>
            <ol className="space-y-2 text-sm text-slate-600 list-decimal list-inside">
              <li>You describe the job and location</li>
              <li>I check verified coverage for that city</li>
              <li>You get pickup requirements that actually apply</li>
              <li>You're handed to a real quote &amp; booking tool</li>
            </ol>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-10">
        <div className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="bg-[#102B2A] px-5 py-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#54D9AE]" />
            <span className="text-white font-bold text-sm">Service Finder</span>
            <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-[#54D9AE]">Verified data only</span>
          </div>

          <div className="h-[420px] md:h-[480px] overflow-y-auto px-5 py-5 space-y-4 bg-[#fafcfb]">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-[#102B2A] text-white rounded-br-sm" : "bg-white border border-slate-100 text-slate-700 rounded-bl-sm"}`}>
                  {m.text}
                  {m.actions?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {m.actions.map((a) =>
                        a.href ? (
                          <a key={a.label} href={a.href} className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] text-[#102B2A] text-xs font-bold px-3.5 py-2 hover:bg-[#125C4E] transition-colors">
                            <Phone className="w-3 h-3" /> {a.label}
                          </a>
                        ) : (
                          <Link key={a.label} to={a.to} className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] text-[#102B2A] text-xs font-bold px-3.5 py-2 hover:bg-[#125C4E] transition-colors">
                            {a.label} <ArrowRight className="w-3 h-3" />
                          </Link>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-white border border-slate-100 px-4 py-3">
                  <Loader2 className="w-4 h-4 text-[#187B65] animate-spin" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="border-t border-slate-100 bg-white px-4 py-3">
            {messages.length <= 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2.5">
                {QUICK_JOBS.map((q) => (
                  <button key={q} onClick={() => send(q)} className="shrink-0 rounded-full border border-slate-200 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors">
                    {q}
                  </button>
                ))}
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. I need an old fridge picked up in Surrey"
                aria-label="Describe your job"
                className="input !bg-[#fafcfb]"
              />
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send message" className="shrink-0 w-12 rounded-xl bg-[#187B65] text-[#102B2A] flex items-center justify-center hover:bg-[#125C4E] transition-colors disabled:opacity-50">
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
        <p className="mt-4 text-xs text-slate-400 text-center">
          Availability answers come from our verified coverage list — not from the AI. Quotes are produced only by the quote tool, never estimated in chat.
        </p>
      </section>

      <Footer />
    </div>
  );
}