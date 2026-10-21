import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Recycle, ChevronDown, MapPin } from "lucide-react";
import { REGIONS } from "@/lib/regions";

const primaryLinks = [
  { label: "Services", to: "/#services" },
  { label: "Pricing", to: "/pricing" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "Service Area", to: "/#service-area" },
  { label: "Business Solutions", to: "/subscriptions" },
  { label: "Contact", to: "/contact" },
];

const moreLinks = [
  { label: "Explore Services", to: "/services" },
  { label: "Service Finder", to: "/service-finder" },
  { label: "AI Booking Center", to: "/ai-booking" },
  { label: "Recycling Directory", to: "/recycling" },
  { label: "Recycling Assistant", to: "/recycling-assistant" },
  { label: "Software OS", to: "/software" },
  { label: "Realtors", to: "/realtors" },
  { label: "Contractors", to: "/contractors" },
  { label: "Partner Onboarding", to: "/contractor-onboarding" },
  { label: "Coverage", to: "/coverage" },
  { label: "Free Metal Pickup", to: "/free-metal-pickup" },
  { label: "About", to: "/about" },
  { label: "White Label", to: "/white-label" },
  { label: "Gallery", to: "/gallery" },
  { label: "FAQ", to: "/#faq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/#top" className="flex items-center gap-2 font-bold text-[#102B2A]">
          <span className="w-9 h-9 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center">
            <Recycle className="w-5 h-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg tracking-tight">Same Day Recycling</span>
            <span className="hidden sm:block text-[9px] font-bold tracking-[0.16em] uppercase text-slate-400">Canada's Intelligent Recycling &amp; Removal Network</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {primaryLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-700 hover:text-[#187B65] transition-colors">
              {l.label}
            </Link>
          ))}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-[#187B65] transition-colors"
            >
              More <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50">
                {moreLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#f4f7f5] hover:text-[#187B65] transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="mt-2 pt-3 border-t border-slate-100 px-4 pb-1">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold tracking-[0.15em] text-slate-400 uppercase mb-2">
                    <MapPin className="w-3 h-3 text-[#187B65]" /> Service coverage
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    {REGIONS.map((r) => (
                      <Link
                        key={r.code}
                        to={`/region/${r.code}`}
                        onClick={() => setMoreOpen(false)}
                        className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-600 hover:bg-[#f4f7f5] hover:text-[#187B65] transition-colors"
                      >
                        {r.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
          <Link to="/#book" className="rounded-full bg-[#187B65] text-white font-bold px-5 py-2.5 text-sm shadow-sm shadow-[#187B65]/30 hover:bg-[#125C4E] hover:shadow-md transition-all">
            Get a Free Quote
          </Link>
        </div>
        <button className="md:hidden p-2 text-[#102B2A]" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-3">
          {primaryLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-bold text-[#102B2A] py-1">
              {l.label}
            </Link>
          ))}
          <Link to="/#book" onClick={() => setOpen(false)} className="rounded-full bg-[#187B65] text-white font-bold px-5 py-3 text-sm text-center shadow-sm shadow-[#187B65]/30">
            Get a Free Quote
          </Link>
          <div className="pt-2 border-t border-slate-100">
            <div className="text-xs font-bold tracking-[0.15em] text-slate-400 uppercase mb-2">More</div>
            <div className="grid grid-cols-2 gap-2">
              {moreLinks.map((l) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-600 py-1.5 rounded-lg px-2 hover:bg-[#f4f7f5]">
                  {l.label}
                </Link>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-1.5 text-xs font-bold tracking-[0.15em] text-slate-400 uppercase mb-2">
                <MapPin className="w-3 h-3 text-[#187B65]" /> Service Coverage
              </div>
              <div className="grid grid-cols-2 gap-1">
                {REGIONS.map((r) => (
                  <Link
                    key={r.code}
                    to={`/region/${r.code}`}
                    onClick={() => setOpen(false)}
                    className="text-xs font-semibold text-slate-600 py-1.5 rounded-lg px-2 hover:bg-[#f4f7f5] hover:text-[#187B65] transition-colors"
                  >
                    {r.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}