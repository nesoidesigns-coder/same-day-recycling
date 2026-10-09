import { useState } from "react";
import { Menu, X, Recycle } from "lucide-react";

const links = [
  { label: "Services", href: "#services" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Service Area", href: "#service-area" },
  { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <a href="#top" className="flex items-center gap-2 font-bold text-[#0c3b24]">
          <span className="w-9 h-9 rounded-xl bg-[#0c3b24] text-[#1d9e56] flex items-center justify-center">
            <Recycle className="w-5 h-5" />
          </span>
          <span className="text-lg tracking-tight">Same Day Recycling</span>
        </a>
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-slate-700 hover:text-[#1d9e56] transition-colors">
              {l.label}
            </a>
          ))}
          <a href="#book" className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-5 py-2.5 text-sm hover:bg-[#17a04c] transition-colors">
            Book a Pickup
          </a>
        </div>
        <button className="md:hidden p-2 text-[#0c3b24]" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 py-4 flex flex-col gap-3">
          {links.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-700 py-1">
              {l.label}
            </a>
          ))}
          <a href="#book" onClick={() => setOpen(false)} className="rounded-full bg-[#1d9e56] text-[#0c3b24] font-bold px-5 py-3 text-sm text-center">
            Book a Pickup
          </a>
        </div>
      )}
    </nav>
  );
}