import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Send, Loader2, Sparkles, Phone, ArrowRight, MapPin } from "lucide-react";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import { base44 } from "@/api/base44Client";
import { CITIES } from "@/lib/cities";
import { LETTER_PROVINCE, PROVINCE_NAMES } from "@/components/sdr/PostalCheck";
import { useSEO, useStructuredData } from "@/lib/seo";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import { COVERAGE_COPY } from "@/components/sdr/coveragePresentation";

// Service guidance is static and factual — the assistant never states
// prices, dates or provider names; it only reports verified coverage
// and points to the tools that produce real quotes.
const SERVICE_INFO = {
  junk_removal: { label: "junk removal", requirements: "The crew lifts everything from any room — furniture, appliances, mattresses, yard waste, renovation debris and general junk are all accepted (except hazardous materials like paint, chemicals, asbestos and fuel). Every load is sorted for donation and recycling." },
  furniture_removal: { label: "furniture removal", requirements: "Sofas, mattresses, dressers and tables are lifted out by the crew; reusable pieces go to donation partners and metal is recycled." },
  appliance_removal: { label: "appliance removal", requirements: "Fridges, washers, stoves and other appliances are carried out by the crew and recycled as scrap metal. Nothing needs to be disconnected in advance." },
  electronics_recycling: { label: "electronics recycling", requirements: "TVs, computers, printers and other e-waste are collected and routed to dedicated electronics recyclers — please wipe devices before pickup." },
  office_commercial: { label: "a commercial or office cleanout", requirements: "Office furniture, e-waste and fit-out debris are hauled one-time or on a recurring schedule, with a diversion record after each completed job showing how the load was sorted." },
  metal_pickup: { label: "scrap metal pickup", requirements: "Scrap metal pickup is free wherever a network partner is live — list or photograph the items and we'll confirm." },
  scheduled_pickup: { label: "a scheduled recycling pickup", requirements: "Recurring pickups can run weekly or per phase for homes, property managers and contractors." },
  other: { label: "a removal or recycling job", requirements: "Tell me the items or materials and I'll match them to the right service." },
};

const QUICK_JOBS = [
  "I need an old refrigerator removed in Surrey",
  "Clear out a garage full of junk in Toronto",
  "Office cleanout in Burnaby before the lease ends",
  "Old TV and computer recycling pickup",
];

const GREETING = "Hi! Tell me what you need removed or recycled — and which city it's in (or your postal code). I'll check verified coverage and point you to a real quote. I only report what's confirmed, so I'll never promise a service or price that isn't.";

export default function ServiceFinder() {
  const [messages, setMessages] = useState([{ role: "assistant", text: GREETING }]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);
  const coverage = useCoverageStatus();

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

    const requestedCity = city?.name || String(intent.city || "").trim();
    if (requestedCity) {
      const status = COVERAGE_COPY[coverage.statusFor(requestedCity)];
      const params = new URLSearchParams({ city: requestedCity });
      if (city?.province || province) params.set("province", city?.province || province);
      return {
        role: "assistant",
        text: `Got it — ${service.label}${items} in ${requestedCity}. ${status ? `${status.label}. ${status.note}` : "Live coverage is not confirmed; no contractor or pickup window is assumed."} Get a regional estimate and approve the final price before work begins.`,
        actions: [{ label: "Continue my request", to: `/request-service?${params}` }, { label: "View pricing", to: "/pricing" }],
      };
    }
    if (province) return {
      role: "assistant",
      text: `That postal code identifies ${PROVINCE_NAMES[province]}, not your municipality or a confirmed service territory. Which city is the pickup in?`,
      actions: [{ label: "View coverage", to: "/coverage" }],
    };
    return {
      role: "assistant",
      text: `Got it — ${service.label}${items}. Which city or municipality is the pickup in? Tap your city below to continue.`,
      actions: [
        { label: "View coverage", to: "/coverage" },
        ...CITIES.slice(0, 6).map((c) => ({ label: c.name, send: `${service.label} in ${c.name}` })),
      ],
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

  // A query passed from elsewhere (e.g. the demand gauge search) starts the
  // conversation automatically — one prefilled send, never re-triggered.
  const autoSent = useRef(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q && !autoSent.current) { autoSent.current = true; send(q); }
  }, []);

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
                        a.send ? (
                          <button key={a.label} onClick={() => send(a.send)} className="inline-flex items-center gap-1.5 rounded-full border border-[#187B65]/40 bg-white text-[#102B2A] text-xs font-bold px-3.5 py-2 hover:border-[#187B65] hover:text-[#187B65] transition-colors">
                            <MapPin className="w-3 h-3" /> {a.label}
                          </button>
                        ) : a.href ? (
                          <a key={a.label} href={a.href} className="inline-flex items-center gap-1.5 rounded-full bg-brand-emerald text-market-ink text-xs font-bold px-3.5 py-2 hover:bg-[#125C4E] transition-colors">
                            <Phone className="w-3 h-3" /> {a.label}
                          </a>
                        ) : (
                          <Link key={a.label} to={a.to} className="inline-flex items-center gap-1.5 rounded-full bg-brand-emerald text-market-ink text-xs font-bold px-3.5 py-2 hover:bg-[#125C4E] transition-colors">
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
              <button type="submit" disabled={busy || !input.trim()} aria-label="Send message" className="shrink-0 w-12 rounded-xl bg-brand-emerald text-market-ink flex items-center justify-center hover:bg-[#125C4E] transition-colors disabled:opacity-50">
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