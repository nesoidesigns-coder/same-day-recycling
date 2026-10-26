import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Recycle, Phone, ChevronRight } from "lucide-react";

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
  const { pathname } = useLocation();

  return (
    <nav data-os-nav="public" className="sticky top-0 z-50 bg-card/95 backdrop-blur border-b border-si-line">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/#top" className="flex items-center gap-2 font-bold text-ri-forest">
          <span className="w-9 h-9 rounded-xl bg-ri-forest text-ri-mint flex items-center justify-center">
            <Recycle className="w-5 h-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-lg tracking-tight">Same Day Recycling</span>
            <span className="hidden sm:block text-[9px] font-bold tracking-[0.16em] uppercase text-ri-slate">Friendly junk removal & recycling across Canada</span>
          </span>
        </Link>
        <div className="hidden xl:flex items-center gap-1">
          {primaryLinks.map((l) => (
            <Link key={l.to} to={l.to} className="rounded-full px-3 py-2 text-sm font-semibold text-ri-slate hover:bg-ri-mint/50 hover:text-ri-forest transition-colors">
              {l.label}
            </Link>
          ))}
          <Link to="/request-service" className="rounded-full bg-ri-amber text-ri-charcoal font-bold px-5 py-2.5 text-sm shadow-sm hover:brightness-95 transition-all">
            Get a Free Quote
          </Link>
        </div>
        <button
          className="xl:hidden grid h-11 w-11 place-items-center rounded-full border border-si-line text-ri-forest transition-colors hover:bg-ri-mint/50"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="menu-drop xl:hidden border-t border-si-line bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col">
            <span className="px-1 pb-2 text-[11px] font-bold uppercase tracking-[0.16em] text-ri-slate">Menu</span>
            {primaryLinks.map((l) => {
              const active = l.to.split("#")[0] === pathname;
              return (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-[48px] items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-bold transition-colors ${
                    active ? "bg-ri-mint/60 text-ri-forest" : "text-ri-forest hover:bg-ri-mint/40"
                  }`}
                >
                  {l.label}
                  <ChevronRight className={`w-4 h-4 ${active ? "text-ri-emerald" : "text-ri-slate/60"}`} />
                </Link>
              );
            })}
            <Link
              to="/request-service"
              onClick={() => setOpen(false)}
              className="mt-3 flex min-h-[52px] items-center justify-center rounded-full bg-ri-amber px-5 py-3.5 text-sm font-bold text-ri-charcoal shadow-sm transition-all hover:brightness-95"
            >
              Get a Free Quote
            </Link>
            <a
              href="tel:+16048491745"
              className="mt-2 flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-si-line px-5 py-3 text-sm font-bold text-ri-forest transition-colors hover:bg-ri-mint/40"
            >
              <Phone className="w-4 h-4 text-ri-emerald" /> (604) 849-1745
            </a>
          </div>
        </div>
      )}
    </nav>
  );
}