import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X, Recycle } from "lucide-react";

// Prototype navigation: the five primary items from the design brief.
// Advanced intelligence (Recycling OS LIVE) is reachable from here without
// cluttering the main nav with every platform feature.
const NAV = [
  { label: "Services", to: "#services" },
  { label: "Pricing", to: "/pricing" },
  { label: "Locations", to: "/coverage" },
  { label: "LIVE Intelligence", to: "/live" },
  { label: "For Contractors", to: "/contractors" },
];

export default function SiHeader() {
  const [open, setOpen] = useState(false);
  return (
    <nav data-os-nav="public" className="sticky top-0 z-50 border-b border-si-line bg-card/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-xl bg-si-forest text-si-mint2">
            <Recycle className="size-5" />
          </span>
          <span className="leading-tight">
            <span className="block text-[17px] font-bold tracking-tight text-si-ink">Same Day Recycling</span>
            <span className="hidden text-[11px] font-bold uppercase tracking-[0.16em] text-si-muted sm:block">
              Service Intelligence · Powered by Recycling OS
            </span>
          </span>
        </Link>
        <div className="hidden items-center gap-1 xl:flex">
          {NAV.map((n) => (
            <a key={n.label} href={n.to} className="rounded-full px-3 py-2 text-sm font-semibold text-si-muted transition-colors hover:bg-ri-mint/50 hover:text-si-forest">
              {n.label}
            </a>
          ))}
          <Link
            to="/request-service"
            className="btn-float rounded-full bg-ri-amber px-5 py-2.5 text-sm font-bold text-ri-charcoal shadow-sm transition-colors hover:brightness-95"
          >
            Get a Free Quote
          </Link>
        </div>
        <button className="p-2 text-si-ink xl:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>
          {open ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>
      {open && (
        <div className="menu-drop flex flex-col gap-1 border-t border-si-line bg-white px-4 py-3 xl:hidden">
          {NAV.map((n) => (
            <a key={n.label} href={n.to} onClick={() => setOpen(false)} className="rounded-lg px-2 py-2.5 text-sm font-bold text-si-ink hover:bg-si-bg2">
              {n.label}
            </a>
          ))}
          <Link to="/request-service" onClick={() => setOpen(false)} className="mt-1 rounded-full bg-ri-amber px-5 py-3 text-center text-sm font-bold text-ri-charcoal">
            Get a Free Quote
          </Link>
        </div>
      )}
    </nav>
  );
}