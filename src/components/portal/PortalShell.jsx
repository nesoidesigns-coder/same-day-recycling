import { Link } from "react-router-dom";
import { LogOut, Home, ArrowLeft } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

const LOGO = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/02e81d056_logo.png";

// The customer-facing shell. Deliberately separate from the admin shell: no
// internal chrome, no admin navigation, one place the signed-in customer
// stands. Same brand, customer voice.
export default function PortalShell({ title, subtitle, email, children }) {
  return (
    <div className="min-h-screen bg-ri-ivory">
      <header className="border-b border-si-line bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4">
          <Link to="/portal" className="flex items-center gap-2.5">
            <Image src={LOGO} alt="Same Day Recycling" className="h-9 w-auto" fittingType="fit" />
            <span className="hidden font-heading text-sm font-bold text-ri-charcoal sm:inline">Same Day Recycling</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="hidden items-center gap-1.5 rounded-full border border-si-line px-3 py-1.5 text-xs font-bold text-ri-forest hover:bg-ri-mint/40 sm:flex"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Site
            </Link>
            <button
              onClick={() => base44.auth.logout("/login")}
              className="flex items-center gap-1.5 rounded-full border border-si-line px-3 py-1.5 text-xs font-bold text-ri-slate hover:bg-ri-mint/40"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6">
          <p className="font-plex text-[11px] uppercase tracking-[0.16em] text-ri-slate">
            <Home className="mr-1 inline h-3 w-3" /> Your account
            {email ? <span className="ml-2 normal-case tracking-normal text-ri-slate/80">{email}</span> : null}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-ri-charcoal md:text-3xl">{title}</h1>
          {subtitle ? <p className="mt-1 text-sm text-ri-slate">{subtitle}</p> : null}
        </div>
        {children}
      </main>

      <footer className="mx-auto max-w-5xl px-4 pb-10 text-xs text-ri-slate">
        Questions about a pickup? Call (604) 849-1745 — same-day service across the Lower Mainland.
      </footer>
    </div>
  );
}