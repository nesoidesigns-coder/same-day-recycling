import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Menu, Phone, X } from "lucide-react";
import { Image } from "@/components/ui/image";

const LOGO = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/02e81d056_logo.png";

const NAV = [
  {
    label: "Services",
    to: "/services",
    children: [
      { to: "/request-service", label: "Junk Removal" },
      { to: "/furniture-removal", label: "Furniture Removal" },
      { to: "/appliance-removal", label: "Appliance Removal" },
      { to: "/electronics-recycling", label: "Electronics Recycling" },
      { to: "/commercial-recycling", label: "Commercial Removal" },
      { to: "/same-day-pickup", label: "Same-Day Pickup" },
    ],
  },
  { label: "Coverage", to: "/coverage" },
  { label: "Pricing", to: "/pricing" },
  { label: "Live Intelligence", to: "/live" },
  { label: "For Contractors", to: "/contractors" },
  {
    label: "Resources",
    to: "/blog",
    children: [
      { to: "/blog", label: "Guides & Articles" },
      { to: "/recycling-centers", label: "Recycling Centres" },
      { to: "/impact-calculator", label: "Impact Calculator" },
      { to: "/gallery", label: "Job Gallery" },
      { to: "/about", label: "About Us" },
      { to: "/contact", label: "Contact" },
    ],
  },
];

// The site header: logo, centred sections with two dropdowns, and the three
// actions a customer needs — country, phone, and a quote.
export default function IntelHeader() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(null);
  const [mobile, setMobile] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-lm-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-4 px-4">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <Image src={LOGO} alt="Same Day Recycling" className="h-9 w-9" fittingType="fit" />
          <span className="font-heading text-[17px] font-extrabold leading-none tracking-tight text-lm-ink">
            Same Day Recycling
          </span>
        </Link>

        <nav className="mx-auto hidden items-center gap-1 lg:flex">
          {NAV.map((item) => {
            const active = pathname === item.to;
            const hasMenu = Boolean(item.children);
            return (
              <div
                key={item.label}
                className="relative"
                onMouseEnter={() => hasMenu && setOpen(item.label)}
                onMouseLeave={() => hasMenu && setOpen(null)}
              >
                <Link
                  to={item.to}
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-[13.5px] font-semibold transition-colors ${
                    active ? "text-[hsl(var(--lm-teal))]" : "text-lm-ink hover:text-[hsl(var(--lm-teal))]"
                  }`}
                >
                  {item.label}
                  {hasMenu && <ChevronDown className="h-3.5 w-3.5" />}
                </Link>
                {hasMenu && open === item.label && (
                  <div className="menu-drop absolute left-0 top-full z-50 w-60 overflow-hidden rounded-xl border border-lm-line bg-white p-1.5 shadow-[0_18px_40px_-24px_rgba(17,24,39,0.35)]">
                    {item.children.map((child) => (
                      <Link
                        key={child.to}
                        to={child.to}
                        className="block rounded-lg px-3 py-2 text-[13px] font-medium text-lm-muted transition-colors hover:bg-lm-bg hover:text-lm-ink"
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
          <Link
            to="/coverage"
            className="hidden items-center gap-1.5 rounded-full border border-lm-line px-3 py-2 text-[12.5px] font-semibold text-lm-muted transition-colors hover:text-lm-ink md:flex"
          >
            <span aria-hidden="true">🇨🇦</span> Canada
            <ChevronDown className="h-3 w-3" />
          </Link>
          <a
            href="tel:+16048491745"
            className="hidden items-center gap-1.5 text-[13px] font-bold text-lm-ink transition-colors hover:text-[hsl(var(--lm-teal))] sm:flex"
          >
            <Phone className="h-4 w-4 text-[hsl(var(--lm-teal))]" />
            (604) 849-1745
          </a>
          <Link
            to="/request-service"
            className="rounded-full bg-[hsl(var(--lm-teal))] px-4 py-2.5 text-[13px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Get a Quote
          </Link>
          <button
            onClick={() => setMobile((v) => !v)}
            aria-label={mobile ? "Close menu" : "Open menu"}
            aria-expanded={mobile}
            className="grid h-10 w-10 place-items-center rounded-full border border-lm-line text-lm-ink lg:hidden"
          >
            {mobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobile && (
        <div className="menu-drop border-t border-lm-line bg-white px-4 pb-4 pt-2 lg:hidden">
          {NAV.map((item) => (
            <div key={item.label} className="border-b border-lm-line/70 py-1 last:border-0">
              <Link
                to={item.to}
                onClick={() => setMobile(false)}
                className="block py-2 text-sm font-bold text-lm-ink"
              >
                {item.label}
              </Link>
              {item.children && (
                <div className="flex flex-wrap gap-1.5 pb-2">
                  {item.children.map((child) => (
                    <Link
                      key={child.to}
                      to={child.to}
                      onClick={() => setMobile(false)}
                      className="rounded-full bg-lm-bg px-3 py-1.5 text-[12px] font-semibold text-lm-muted"
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <a href="tel:+16048491745" className="mt-3 flex items-center gap-2 text-sm font-bold text-lm-ink">
            <Phone className="h-4 w-4 text-[hsl(var(--lm-teal))]" /> (604) 849-1745
          </a>
        </div>
      )}
    </header>
  );
}