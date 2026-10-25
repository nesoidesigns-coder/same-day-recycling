import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Activity, MapPin, Users, DollarSign, Truck, Recycle, Bot, ArrowRight, X, Clock, Compass } from "lucide-react";
import { useSEO } from "@/lib/seo";
import useCoverageStatus from "@/hooks/useCoverageStatus";
import RexDiscover from "@/components/home/RexDiscover";
import RexPriceCompare from "@/components/home/RexPriceCompare";
import CoverageStrip from "@/components/home/CoverageStrip";

// Same Day Recycling LIVE — public intelligence centre. Free to explore, no
// account. Simple overview first; each module opens inline or leads to its
// dedicated page. Every panel runs on existing verified platform data —
// nothing simulated.

const INLINE_MODULES = {
  local: { icon: MapPin, title: "Local Service Intelligence", desc: "Enter a city or postal code to see verified coverage, accepted materials and real pickup options." },
  pricing: { icon: DollarSign, title: "Pricing Intelligence", desc: "Compare published pickup rates with publicly advertised prices, sourced and dated." },
  availability: { icon: Truck, title: "Contractor Availability", desc: "Live contractor coverage straight from verified partner records — never assumed." },
  rex: { icon: Bot, title: "Rex AI Research Assistant", desc: "Ask Rex anything: options, prices, donations, municipal rules, planning help." },
};

const LINK_MODULES = {
  demand: { icon: Activity, title: "National Service Demand Explorer", desc: "Explore demand by industry, province and city — every number basis-labelled.", to: "/demand" },
  community: { icon: Users, title: "Live Community Requests", desc: "See what Canadians are asking for, ask your own question or submit a request.", to: "/community" },
  recycling: { icon: Recycle, title: "Recycling & Disposal Advisor", desc: "Location-aware guidance on where materials really go, with cited sources.", to: "/recycling-assistant" },
};

export default function LiveCentre() {
  useSEO({
    title: "Same Day Recycling LIVE | Canadian Service Intelligence Centre",
    description: "Discover local service demand, compare pickup options, explore recycling information, and find help when you need it. Free to explore — no account needed.",
    path: "/live",
  });
  const [open, setOpen] = useState(null);
  const [localQuery, setLocalQuery] = useState("");
  const navigate = useNavigate();
  const cov = useCoverageStatus();

  const toggle = (key) => setOpen((cur) => (cur === key ? null : key));

  const goLocal = (e) => {
    e.preventDefault();
    const q = localQuery.trim();
    navigate(q ? `/service-finder?q=${encodeURIComponent(q)}` : "/service-finder");
  };

  const refreshedAt = cov.generatedAt ? new Date(cov.generatedAt).toLocaleString("en-CA", { dateStyle: "medium", timeStyle: "short" }) : null;

  return (
    <div className="min-h-screen bg-warm-white pb-16">
      <div className="max-w-6xl mx-auto px-4 pt-10 pb-8">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-[#187B65]">← Back to home</Link>

        <div className="mt-5 max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-[#187B65]/10 px-3.5 py-1.5 text-[11px] font-bold tracking-wide text-[#187B65] uppercase">
            <Compass className="w-3.5 h-3.5" /> Same Day Recycling LIVE
          </span>
          <h1 className="mt-4 text-3xl sm:text-4xl font-bold tracking-tight text-[#102B2A]">
            Explore What's Happening Across Canada.
          </h1>
          <p className="mt-3 text-lg text-slate-600 leading-relaxed">
            Discover local service demand, compare pickup options, explore recycling information, and find help when you need it.
          </p>
          <p className="mt-2 text-sm font-bold text-[#187B65]">Free to explore — no account needed.</p>
        </div>

        <div className="mt-4 rounded-2xl bg-white border border-slate-200 px-4 py-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 font-bold text-slate-600"><Clock className="w-3.5 h-3.5" />{refreshedAt ? `Coverage records refreshed ${refreshedAt}` : "Loading coverage records…"}</span>
          <span className="mt-1 block">Sources: contractor availability from verified partner records · pricing from published rates and sourced public prices · demand figures are basis-labelled estimates, never live counts.</span>
        </div>

        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(INLINE_MODULES).map(([key, m]) => (
            <Tile key={key} icon={m.icon} title={m.title} desc={m.desc} active={open === key} onClick={() => toggle(key)} />
          ))}
          {Object.entries(LINK_MODULES).map(([key, m]) => (
            <Link key={key} to={m.to} className="group rounded-2xl bg-white border border-slate-200 p-5 hover:border-[#187B65] hover:shadow-sm transition-all block">
              <span className="w-10 h-10 rounded-xl bg-[#187B65]/10 flex items-center justify-center group-hover:bg-[#187B65] transition-colors">
                <m.icon className="w-5 h-5 text-[#187B65] group-hover:text-white transition-colors" />
              </span>
              <h3 className="mt-3 font-bold text-[#102B2A]">{m.title}</h3>
              <p className="mt-1 text-sm text-slate-600">{m.desc}</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65]">Explore <ArrowRight className="w-3.5 h-3.5" /></span>
            </Link>
          ))}
        </div>

        {open === "local" && (
          <Panel title="Local Service Intelligence" onClose={() => setOpen(null)}>
            <form onSubmit={goLocal} className="flex flex-col sm:flex-row gap-2">
              <input
                value={localQuery}
                onChange={(e) => setLocalQuery(e.target.value)}
                placeholder="Your city, postal code, or what you need picked up"
                aria-label="Search your location"
                className="input"
              />
              <button type="submit" className="shrink-0 rounded-xl bg-[#187B65] text-white font-bold px-5 py-3 hover:bg-[#116553]">
                Find Local Options
              </button>
            </form>
            <p className="mt-3 text-sm text-slate-600">You'll see verified coverage for your area, accepted materials, and a path to a real quote — confirmed availability only, never assumed.</p>
          </Panel>
        )}

        {open === "pricing" && (
          <Panel title="Pricing Intelligence" onClose={() => setOpen(null)}>
            <RexPriceCompare />
          </Panel>
        )}

        {open === "availability" && (
          <Panel title="Contractor Availability" onClose={() => setOpen(null)}>
            <CoverageStrip />
          </Panel>
        )}

        {open === "rex" && (
          <Panel title="Rex AI Research Assistant" onClose={() => setOpen(null)}>
            <RexDiscover />
          </Panel>
        )}
      </div>
    </div>
  );
}

function Tile({ icon: Icon, title, desc, active, onClick }) {
  return (
    <button
      onClick={onClick}
      aria-expanded={active}
      className={`text-left rounded-2xl bg-white border p-5 hover:shadow-sm transition-all w-full ${active ? "border-[#187B65] shadow-sm" : "border-slate-200 hover:border-[#187B65]"}`}
    >
      <span className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${active ? "bg-[#187B65]" : "bg-[#187B65]/10"}`}>
        <Icon className={`w-5 h-5 transition-colors ${active ? "text-white" : "text-[#187B65]"}`} />
      </span>
      <h3 className="mt-3 font-bold text-[#102B2A]">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{desc}</p>
      <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65]">{active ? "Close" : "Open"}</span>
    </button>
  );
}

function Panel({ title, onClose, children }) {
  return (
    <section className="mt-6 rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-100">
        <h2 className="font-bold text-[#102B2A]">{title}</h2>
        <button onClick={onClose} aria-label="Close panel" className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-[#102B2A]">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}