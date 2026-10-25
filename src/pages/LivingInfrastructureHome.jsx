import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Sofa, Refrigerator, Truck, Boxes, Recycle, Building2, ArrowRight, HandHeart, MessageCircleQuestion, MapPinned, HardHat } from "lucide-react";
import { useSEO } from "@/lib/seo";
import TopBar from "@/components/sdr/TopBar";
import Navbar from "@/components/sdr/Navbar";
import Footer from "@/components/sdr/Footer";
import NationalSignalCore from "@/components/li/NationalSignalCore";
import SignalMetricCard from "@/components/li/SignalMetricCard";
import DemandTrendChart from "@/components/li/DemandTrendChart";
import ContractorOperationsPreview from "@/components/li/ContractorOperationsPreview";
import DataSourceLabel from "@/components/li/DataSourceLabel";
import { base44 } from "@/api/base44Client";

// Living Infrastructure homepage prototype — non-destructive. Lives on its own
// route until approved; the live homepage is untouched. Sections A–F per the
// Recycling OS visual identity directive.

const SERVICES = [
  { icon: Sofa, title: "Furniture Removal", desc: "Sofas, mattresses and dressers, hauled away responsibly.", to: "/furniture-removal" },
  { icon: Refrigerator, title: "Appliance Removal", desc: "Fridges, washers and stoves, safely removed and recycled.", to: "/appliance-removal" },
  { icon: Truck, title: "Junk Removal", desc: "One pickup or a whole load — describe it and get a quote.", to: "/request-service" },
  { icon: Boxes, title: "Moving Cleanouts", desc: "Clear out what's left behind before or after your move.", to: "/move-assist" },
  { icon: Recycle, title: "Recycling Options", desc: "Where your materials really go, with cited sources.", to: "/recycling" },
  { icon: Building2, title: "Commercial Services", desc: "Office, retail and property pickups on your schedule.", to: "/commercial-recycling" },
];

const PARTICIPATION = [
  { icon: Truck, title: "Submit a service request", desc: "Describe what needs to go and where — coverage is confirmed before anything is booked.", to: "/request-service" },
  { icon: MessageCircleQuestion, title: "Ask a local question", desc: "Join the community forum to ask and answer real questions from your city.", to: "/community" },
  { icon: HandHeart, title: "Report recycling resources", desc: "Know a depot, drop-off or donation centre? Add it so neighbours can find it.", to: "/recycling-centers" },
  { icon: MapPinned, title: "Explore community needs", desc: "See what services Canadians are researching and requesting right now.", to: "/live" },
];

const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : null);

export default function LivingInfrastructureHome() {
  useSEO({
    title: "Canada's Service Network | Same Day Recycling",
    description: "Explore removal and recycling services across Canada, understand local pricing, discover verified market activity, and find the right pickup options.",
    path: "/",
  });
  const navigate = useNavigate();
  const [location, setLocation] = useState("");
  const [service, setService] = useState("Junk removal");
  const [overview, setOverview] = useState(null);

  useEffect(() => {
    let alive = true;
    base44.functions.invoke("liveIntelligence", { action: "overview", days: 30 })
      .then((res) => { if (alive) setOverview(res.data); })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  const runSearch = (e) => {
    e.preventDefault();
    const q = location.trim() ? `${service} in ${location.trim()}` : service;
    navigate(`/service-finder?q=${encodeURIComponent(q)}`);
  };

  const metrics = [
    { label: "Verified service requests", data: overview?.service_requests },
    { label: "Confirmed service areas", data: overview?.service_areas },
    { label: "Market interest signals", data: overview?.market_signals },
  ];

  return (
    <div className="bg-li-cloud pb-20">
      <TopBar />
      <Navbar />
      <main className="max-w-[1280px] mx-auto px-4 md:px-8">

        {/* Section A — Entry experience */}
        <section className="py-12 md:py-20 grid lg:grid-cols-[55%_45%] gap-8 items-center">
          <div>
            <h1 className="text-[34px] md:text-[52px] font-bold leading-[1.08] tracking-tight text-li-carbon">
              Canada's Service Network. At Your Fingertips.
            </h1>
            <p className="mt-4 text-base md:text-lg text-li-slate max-w-xl">
              Explore removal and recycling services, understand local pricing, discover market activity, and find the right pickup options.
            </p>
            <form onSubmit={runSearch} className="mt-6 rounded-[20px] border border-li-steel bg-white p-3 flex flex-col sm:flex-row gap-2">
              <select value={service} onChange={(e) => setService(e.target.value)} aria-label="Service"
                className="min-h-[48px] rounded-[14px] border border-li-steel px-3 py-2.5 font-semibold text-li-carbon bg-white">
                {["Junk removal", "Furniture removal", "Appliance removal", "Electronics recycling", "Metal pickup", "Moving cleanout", "Commercial cleanout"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="City or postal code" aria-label="City or postal code"
                className="flex-1 min-h-[48px] rounded-[14px] border border-li-steel px-4 py-2.5 text-li-carbon placeholder:text-li-slate/70 focus:border-li-mint focus:outline-none focus:ring-2 focus:ring-li-mint/30" />
              <button type="submit" className="min-h-[48px] rounded-[14px] bg-li-infra text-white font-bold px-6 hover:bg-li-forest transition-colors duration-200 inline-flex items-center justify-center gap-2">
                <Search className="w-4 h-4" /> Explore My Options
              </button>
            </form>
            <Link to="/request-service" className="mt-3 inline-flex min-h-[48px] items-center gap-2 rounded-[14px] border border-li-steel bg-li-pale px-6 font-bold text-li-forest hover:border-li-mint transition-colors duration-200">
              Book a Pickup <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div>
            <NationalSignalCore compact />
            <div className="mt-4 grid grid-cols-3 gap-2.5">
              {metrics.map((m) => (
                <SignalMetricCard
                  key={m.label}
                  label={m.label}
                  value={m.data?.available ? m.data.value : "—"}
                  loading={!overview}
                />
              ))}
            </div>
            <div className="mt-2">
              <DataSourceLabel
                what="Platform metrics"
                scope="Canada"
                period="Last 30 days"
                basis="Observed records, not projections"
                source="QuoteLead + NationalRequest, partner territories, demand observations"
              />
            </div>
          </div>
        </section>

        {/* Section B — Live national activity strip */}
        <section aria-label="Live national activity" className="mb-4">
          <div className="rounded-[20px] border border-li-steel bg-li-pale px-5 py-4 grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-3">
            <div>
              <div className="font-plex text-[11px] font-semibold text-li-slate">Selected region</div>
              <div className="mt-0.5 text-sm font-bold text-li-carbon">Canada</div>
            </div>
            <div>
              <div className="font-plex text-[11px] font-semibold text-li-slate">Latest verified observation</div>
              <div className="mt-0.5 text-sm font-bold text-li-carbon">
                {overview ? (overview.service_requests?.available ? `${overview.service_requests.value} verified service requests` : "Collecting verified data") : "Loading…"}
              </div>
            </div>
            <div>
              <div className="font-plex text-[11px] font-semibold text-li-slate">Most recent data update</div>
              <div className="font-plex mt-0.5 text-sm font-semibold text-li-carbon">{fmtDate(overview?.generated_at) || "—"}</div>
            </div>
            <div>
              <div className="font-plex text-[11px] font-semibold text-li-slate">Selected service category</div>
              <div className="mt-0.5 text-sm font-bold text-li-carbon">All categories</div>
            </div>
          </div>
        </section>

        {/* Section C — Interactive intelligence (map layer arrives next) */}
        <section className="py-12 md:py-20">
          <h2 className="text-[25px] md:text-[32px] font-semibold tracking-tight text-li-carbon">Interactive intelligence</h2>
          <p className="mt-1.5 text-sm md:text-base text-li-slate max-w-2xl">Explore the network by geography, category and time period. Everything below is drawn from the same verified records.</p>
          <div className="mt-6 grid lg:grid-cols-2 gap-5 items-start">
            <NationalSignalCore />
            <div className="space-y-4">
              <DemandTrendChart title="Service demand trend" subtitle="Monthly verified record counts, by demand type" />
              {overview?.service_categories?.available?.length > 0 && (
                <div className="rounded-[14px] border border-li-steel bg-white p-5">
                  <h3 className="text-lg font-semibold text-li-carbon">Categories present in verified records</h3>
                  <p className="font-plex mt-1.5 text-[11px] text-li-slate">Observed · last 30 days · platform demand records</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {overview.service_categories.available.map((c) => (
                      <span key={c} className="rounded-full border border-li-steel bg-li-pale px-3 py-1 text-xs font-semibold text-li-carbon">{c.replace(/_/g, " ")}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Section D — Everyday services */}
        <section className="py-12 md:py-20">
          <h2 className="text-[25px] md:text-[32px] font-semibold tracking-tight text-li-carbon">Everyday services</h2>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SERVICES.map((s) => (
              <Link key={s.title} to={s.to} className="group rounded-[14px] border border-li-steel bg-white p-5 hover:border-li-mint transition-colors duration-200">
                <span className="w-11 h-11 rounded-xl bg-li-pale flex items-center justify-center group-hover:bg-li-infra transition-colors duration-200">
                  <s.icon className="w-5 h-5 text-li-infra group-hover:text-white transition-colors duration-200" />
                </span>
                <h3 className="mt-3 text-lg font-semibold text-li-carbon">{s.title}</h3>
                <p className="mt-1 text-sm text-li-slate">{s.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-li-infra">View details & book <ArrowRight className="w-3.5 h-3.5" /></span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      {/* Section E — For contractors (full-width graphite) */}
      <section className="bg-li-graphite text-white">
        <div className="max-w-[1280px] mx-auto px-4 md:px-8 py-12 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[11px] font-bold text-emerald-300"><HardHat className="w-3.5 h-3.5" /> For contractors</span>
          <h2 className="mt-3 text-[25px] md:text-[32px] font-semibold tracking-tight">Your Business. Connected to the Network.</h2>
          <p className="mt-2 max-w-2xl text-sm text-emerald-100/70">Territory intelligence, dispatch and customer management on one operating system. See the dashboard shape below — signed-in contractors see their own live records.</p>
          <div className="mt-6">
            <ContractorOperationsPreview />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/contractors" className="inline-flex min-h-[48px] items-center gap-2 rounded-[14px] bg-li-mint px-6 font-bold text-li-graphite hover:bg-emerald-300 transition-colors duration-200">
              Network partnership <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/software" className="inline-flex min-h-[48px] items-center gap-2 rounded-[14px] border border-white/20 px-6 font-bold text-white hover:border-emerald-300 transition-colors duration-200">
              Software licensing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <main className="max-w-[1280px] mx-auto px-4 md:px-8">
        {/* Section F — Public participation */}
        <section className="py-12 md:py-20">
          <h2 className="text-[25px] md:text-[32px] font-semibold tracking-tight text-li-carbon">Help Build a Smarter Service Network.</h2>
          <p className="mt-1.5 text-sm md:text-base text-li-slate max-w-2xl">Contribute what you know. Public content is permissioned and moderated — nothing unverified is published as fact.</p>
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PARTICIPATION.map((p) => (
              <Link key={p.title} to={p.to} className="group rounded-[14px] border border-li-steel bg-white p-5 hover:border-li-mint transition-colors duration-200 flex flex-col">
                <p.icon className="w-5 h-5 text-li-infra" />
                <h3 className="mt-3 text-base font-semibold text-li-carbon">{p.title}</h3>
                <p className="mt-1 text-xs text-li-slate flex-1">{p.desc}</p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-li-infra">Take part <ArrowRight className="w-3.5 h-3.5" /></span>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}