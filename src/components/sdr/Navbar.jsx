import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Recycle, Phone } from "lucide-react";

// Simple consumer navigation: the five things a customer needs to find.
const primaryLinks = [
  { label: "Services", to: "/#services" },
  { label: "Pricing", to: "/pricing" },
  { label: "Locations", to: "/coverage" },
  { label: "How It Works", to: "/#how-it-works" },
  { label: "For Businesses", to: "/subscriptions" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/#top" className="flex items-center gap-2 font-bold text-[#102B2A]">
          <span className="w-9 h-9 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center">
            <Recycle className="w-5 h-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg tracking-tight">Same Day Recycling</span>
            <span className="hidden sm:block text-[9px] font-bold tracking-[0.16em] uppercase text-slate-500">Friendly junk removal & recycling across Canada</span>
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-7">
          {primaryLinks.map((l) => (
            <Link key={l.to} to={l.to} className="text-sm font-medium text-slate-700 hover:text-[#187B65] transition-colors">
              {l.label}
            </Link>
          ))}
          <Link to="/#book" className="rounded-full bg-amber-500 text-[#102B2A] font-bold px-5 py-2.5 text-sm shadow-sm hover:bg-amber-600 hover:text-white transition-all">
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
          <Link to="/#book" onClick={() => setOpen(false)} className="rounded-full bg-amber-500 text-[#102B2A] font-bold px-5 py-3 text-sm text-center shadow-sm">
            Get a Free Quote
          </Link>
          <a href="tel:+16048491745" className="flex items-center gap-2 text-sm font-bold text-[#102B2A] py-1">
            <Phone className="w-4 h-4 text-[#187B65]" /> (604) 849-1745
          </a>
        </div>
      )}
    </nav>
  );
}