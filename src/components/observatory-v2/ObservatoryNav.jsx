import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Menu, X, ScanLine } from 'lucide-react';

export default function ObservatoryNav() {
  const [open, setOpen] = useState(false);
  const links = [['Explore', '/prototype-observatory'], ['Services', '/services'], ['LIVE Intelligence', '/live'], ['For Contractors', '/prototype-observatory?workspace=contractor']];
  return (
    <header className="obs-nav border-b border-obs-line/30">
      <div className="flex min-h-[76px] items-center justify-between gap-5 px-5 lg:px-9">
        <Link to="/prototype-observatory" className="flex items-center gap-3" aria-label="Recycling OS observatory">
          <span className="grid size-9 place-items-center border border-obs-mint/60 text-obs-mint"><ScanLine className="size-5" /></span>
          <span className="text-sm font-semibold tracking-wide">RECYCLING <span className="text-obs-mint">OS</span><span className="block text-[9px] tracking-[0.17em] text-obs-muted">CANADIAN SERVICE OBSERVATORY</span></span>
        </Link>
        <nav aria-label="Observatory navigation" className="hidden items-center gap-6 text-xs lg:flex">
          {links.map(([label, to]) => <Link key={label} to={to} className="text-obs-muted hover:text-obs-ink">{label}</Link>)}
          <Link to="/request-service" className="obs-button">Book Pickup <ArrowUpRight className="size-4" /></Link>
        </nav>
        <button className="grid size-11 place-items-center lg:hidden" onClick={() => setOpen(!open)} aria-expanded={open} aria-label="Open navigation">{open ? <X /> : <Menu />}</button>
      </div>
      {open && <nav className="grid gap-1 border-t border-obs-line/30 px-5 pb-4 lg:hidden">{[...links, ['Book Pickup', '/request-service']].map(([label, to]) => <Link onClick={() => setOpen(false)} className="py-3 text-sm text-obs-muted" key={label} to={to}>{label}</Link>)}</nav>}
    </header>
  );
}