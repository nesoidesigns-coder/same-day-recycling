import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Recycle, ChevronDown } from "lucide-react";

const primaryLinks = [
  { label: "Services", to: "/#services" },
  { label: "Pricing", to: "/pricing" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "Service Area", to: "/#service-area" },
  { label: "Business Solutions", to: "/subscriptions" },
  { label: "Contact", to: "/contact" },
];

const moreLinks = [
  { label: "Recycling Directory", to: "/recycling" },
  { label: "Recycling Assistant", to: "/recycling-assistant" },
  { label: "Realtors", to: "/realtors" },
  { label: "Contractors", to: "/contractors" },
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
        <Link to="/#top" className="flex items-center gap-2 font-bold text-[#0c3b24]">
          <span className="w-9 h-9 rounded-xl bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center">
            <Recycle className="w-5 h-5" />
          </span>
          <span className="text-lg tracking-tight">Same Day Recycling</span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {primaryLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-700 hover:text-[#1d9e56] transition-colors">
              {l.label}
            </Link>
          ))}
          <div className="relative">
            <button
              onClick={() => setMoreOpen(!moreOpen)}
              className="flex items-center gap-1 text-sm font-medium text-slate-700 hover:text-[#1d9e56] transition-colors"
            >
              More <ChevronDown className={`w-4 h-4 transition-transform ${moreOpen ? "rotate-180" : ""}`} />
            </button>
            {moreOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white shadow-xl border border-slate-100 py-2 z-50">
                {moreLinks.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMoreOpen(false)}
                    className="block px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-[#f4f7f5] hover:text-[#1d9e56] transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-5 py-2.5 text-sm hover:bg-[#17a04c] transition-colors">
            Book a Pickup
          </Link>
        </div>
        <button className="md:hidden p-2 text-[#0c3b24]" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-3">
          {primaryLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm font-bold text-[#0c3b24] py-1">
              {l.label}
            </Link>
          ))}
          <Link to="/#book" onClick={() => setOpen(false)} className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-5 py-3 text-sm text-center">
            Book a Pickup
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
          </div>
        </div>
      )}
    </nav>
  );
}