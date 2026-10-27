import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Activity, Briefcase, CalendarCheck, Compass, FileText, HeartPulse, LayoutGrid, Map,
  MapPin, Menu, Phone, Plug, Radar, Search, ShieldCheck, SearchCheck, Sparkles, Star,
  TrendingUp, Users, X,
} from "lucide-react";
import { Image } from "@/components/ui/image";

const LOGO = "https://media.base44.com/images/public/6ac93990cde830898b8dbc65/02e81d056_logo.png";

const GROUPS = [
  {
    title: "Live Intelligence",
    items: [
      { label: "National Overview", to: "/", Icon: Activity },
      { label: "Demand Radar", to: "/live", Icon: Radar },
      { label: "Service Categories", to: "/services", Icon: LayoutGrid },
      { label: "Canada Map", to: "/coverage", Icon: Map },
      { label: "Live Discovery", to: "/community", Icon: Compass },
      { label: "Rex Analysis", to: "/live#live-methods", Icon: Sparkles },
    ],
  },
  {
    title: "Business",
    items: [
      { label: "Customer Bookings", to: "/track", Icon: CalendarCheck },
      { label: "Contractor Network", to: "/contractors", Icon: Users },
      { label: "Opportunities", to: "/recycling-os", Icon: Briefcase },
      { label: "Revenue & Growth", to: "/pricing", Icon: TrendingUp },
    ],
  },
  {
    title: "Content & SEO",
    items: [
      { label: "Search Intelligence", to: "/blog", Icon: SearchCheck },
      { label: "Content Hub", to: "/blog", Icon: FileText },
      { label: "City Pages", to: "/services", Icon: MapPin },
      { label: "Reviews & Social", to: "/review", Icon: Star },
    ],
  },
  {
    title: "Platform",
    items: [
      { label: "Source Health", to: "/live#live-methods", Icon: HeartPulse },
      { label: "Integrations", to: "/about", Icon: Plug },
      { label: "System Status", to: "/live", Icon: ShieldCheck },
    ],
  },
];

const TOP_LINKS = [
  { label: "Services", to: "/services" },
  { label: "Coverage", to: "/coverage" },
  { label: "Pricing", to: "/pricing" },
  { label: "Live Intelligence", to: "/live" },
  { label: "Become a Partner", to: "/contractors" },
];

// The console chrome every public intelligence page sits in: postal-code
// search, section links and the call action across the top, the grouped
// navigation rail down the left, the radar canvas filling the rest.
export default function ConsoleShell({ children }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [postal, setPostal] = useState("");
  const [railOpen, setRailOpen] = useState(false);

  const submitSearch = (e) => {
    e.preventDefault();
    const value = postal.trim();
    navigate(value ? `/request-service?postal=${encodeURIComponent(value)}` : "/request-service");
  };

  const rail = (
    <nav className="space-y-5">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <div className="console-label px-3 pb-2">{group.title}</div>
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.to.split("#")[0] && (item.to !== "/" || pathname === "/");
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    onClick={() => setRailOpen(false)}
                    className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-[12.5px] font-medium transition-colors ${
                      active
                        ? "bg-[hsl(var(--cn-teal)/0.14)] text-cn-teal"
                        : "text-cn-muted hover:bg-white/5 hover:text-cn-ink"
                    }`}
                  >
                    <item.Icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="console-app min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-cn-line/70 bg-[hsl(var(--cn-bg)/0.92)] backdrop-blur">
        <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
          <button
            onClick={() => setRailOpen(true)}
            aria-label="Open navigation"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-cn-line text-cn-ink lg:hidden"
          >
            <Menu className="h-4 w-4" />
          </button>

          <Link to="/" className="flex shrink-0 items-center gap-2">
            <Image src={LOGO} alt="Same Day Recycling" className="h-7 w-7" fittingType="fit" />
            <span className="hidden font-heading text-[15px] font-extrabold tracking-tight text-cn-ink sm:block">
              Same Day Recycling
            </span>
          </Link>

          <form onSubmit={submitSearch} className="relative ml-2 hidden w-64 md:block xl:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-cn-muted" />
            <input
              value={postal}
              onChange={(e) => setPostal(e.target.value)}
              placeholder="Enter your postal code…"
              aria-label="Enter your postal code or city"
              className="h-9 w-full rounded-lg border border-cn-line bg-[hsl(var(--cn-surface)/0.7)] pl-9 pr-3 text-[12.5px] text-cn-ink placeholder:text-cn-muted focus:border-cn-teal focus:outline-none"
            />
          </form>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {TOP_LINKS.map((l) => {
              const active = pathname === l.to;
              return (
                <Link
                  key={l.label}
                  to={l.to}
                  className={`rounded-lg px-2.5 py-2 text-[12.5px] font-semibold transition-colors ${
                    active ? "text-cn-teal" : "text-cn-muted hover:text-cn-ink"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <a
            href="tel:+16048491745"
            className="ml-auto flex shrink-0 items-center gap-2 rounded-lg border border-cn-line px-2.5 py-1.5 lg:ml-3"
          >
            <Phone className="h-3.5 w-3.5 text-cn-teal" />
            <span className="hidden text-[11.5px] leading-tight text-cn-ink sm:block">
              (604) 849-1745
              <span className="block text-[9.5px] font-semibold uppercase tracking-wider text-cn-muted">Call or text 24/7</span>
            </span>
          </a>

          <Link
            to="/request-service"
            className="shrink-0 rounded-lg bg-cn-orange px-3.5 py-2 text-[12px] font-bold text-white transition-opacity hover:opacity-90"
          >
            Get Pickup Estimate
          </Link>
        </div>
      </header>

      <div className="flex">
        {/* Desktop rail */}
        <aside className="hidden w-[228px] shrink-0 border-r border-cn-line/60 px-2.5 py-4 lg:block">
          {rail}
          <div className="mt-6 rounded-xl border border-cn-line/70 bg-[hsl(var(--cn-surface)/0.5)] p-3">
            <div className="console-label">Coverage note</div>
            <p className="mt-1.5 text-[11px] leading-snug text-cn-muted">
              A city is only shown as live when a verified contractor is on file — never before.
            </p>
            <Link to="/coverage" className="mt-2 inline-block text-[11px] font-bold text-cn-teal hover:underline">
              Check your city
            </Link>
          </div>
        </aside>

        {/* Mobile rail */}
        {railOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/60" onClick={() => setRailOpen(false)} />
            <div className="absolute left-0 top-0 h-full w-[260px] overflow-y-auto border-r border-cn-line bg-cn-bg px-3 py-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-heading text-sm font-extrabold text-cn-ink">Navigation</span>
                <button onClick={() => setRailOpen(false)} aria-label="Close navigation" className="grid h-8 w-8 place-items-center rounded-lg border border-cn-line text-cn-ink">
                  <X className="h-4 w-4" />
                </button>
              </div>
              {rail}
            </div>
          </div>
        )}

        <main className="min-w-0 flex-1 px-3 pb-10 pt-4 sm:px-5">{children}</main>
      </div>
    </div>
  );
}