import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Phone } from "lucide-react";
import { Image } from "@/components/ui/image";

const LOGO = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/02e81d056_logo.png";

const NAV = [
  { to: "/services", label: "Services" },
  { to: "/coverage", label: "Coverage" },
  { to: "/pricing", label: "Pricing" },
  { to: "/live", label: "Live Intelligence" },
  { to: "/contractors", label: "Become a Partner" },
];

export default function IntelHeader() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [postal, setPostal] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const value = postal.trim();
    navigate(value ? `/request-service?postal=${encodeURIComponent(value)}` : "/request-service");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-lm-line bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1360px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 lg:flex-nowrap">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <Image src={LOGO} alt="Same Day Recycling" className="h-8 w-8" fittingType="fit" />
          <span className="leading-tight">
            <span className="block font-heading text-[15px] font-extrabold tracking-tight text-lm-ink">Same Day Recycling</span>
            <span className="block font-plex text-[8.5px] font-bold uppercase tracking-[0.18em] text-lm-muted">Canada Wide • Same Day Service</span>
          </span>
        </Link>

        <form onSubmit={submit} className="order-3 flex min-w-0 flex-1 items-center gap-2 rounded-full border border-lm-line bg-lm-bg/70 px-3 py-1.5 md:order-none">
          <input
            value={postal}
            onChange={(e) => setPostal(e.target.value)}
            placeholder="Enter your postal code for instant estimate"
            aria-label="Postal code"
            className="min-w-0 flex-1 bg-transparent text-[13px] text-lm-ink placeholder:text-lm-muted/80 focus:outline-none"
          />
          <button type="submit" aria-label="Get estimate" className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-lm-teal text-white transition-colors hover:brightness-95">
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </form>

        <nav className="hidden items-center gap-5 xl:flex">
          {NAV.map(({ to, label }) => {
            const active = pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`relative py-1 text-[13px] font-semibold transition-colors ${
                  active ? "text-lm-teal" : "text-lm-muted hover:text-lm-ink"
                }`}
              >
                {label}
                {active && <span className="absolute -bottom-1 left-0 right-0 h-[2px] rounded-full bg-lm-teal" />}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <span className="hidden items-center gap-1.5 rounded-full border border-lm-line px-2.5 py-1 font-plex text-[10px] font-bold uppercase tracking-widest text-lm-muted sm:flex">
            <span aria-hidden="true">🇨🇦</span> CA
          </span>
          <a href="tel:+16048491745" className="flex items-center gap-2 rounded-full bg-lm-ink px-3.5 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90">
            <Phone className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">(604) 849-1745</span>
            <span className="hidden font-normal text-white/60 md:inline">Call or Text 24/7</span>
          </a>
        </div>
      </div>
    </header>
  );
}