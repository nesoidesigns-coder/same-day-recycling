import { Link, useLocation } from "react-router-dom";
import { LayoutGrid, Radar, MapPin, MessagesSquare, Truck, Building2, Cpu, Handshake, FileText, Newspaper, Images, Recycle, Tags, Info, Phone, PackagePlus } from "lucide-react";

// The dashboard rail, as in the reference design: four labelled groups of thin
// line icons, the current page carried by a filled teal pill.
const SECTIONS = [
  {
    label: "Live Intelligence",
    items: [
      { to: "/live", label: "National Overview", icon: LayoutGrid },
      { to: "/demand", label: "Demand Observatory", icon: Radar },
      { to: "/coverage", label: "Coverage Map", icon: MapPin },
      { to: "/community", label: "Community Signals", icon: MessagesSquare },
    ],
  },
  {
    label: "Business",
    items: [
      { to: "/contractors", label: "Contractor Network", icon: Truck },
      { to: "/property-managers", label: "Property Managers", icon: Building2 },
      { to: "/software", label: "Platform Software", icon: Cpu },
      { to: "/partners", label: "Partner Portal", icon: Handshake },
    ],
  },
  {
    label: "Content & SEO",
    items: [
      { to: "/services", label: "Service Pages", icon: FileText },
      { to: "/blog", label: "Journal", icon: Newspaper },
      { to: "/gallery", label: "Gallery", icon: Images },
      { to: "/recycling-centers", label: "Recycling Centres", icon: Recycle },
    ],
  },
  {
    label: "Platform",
    items: [
      { to: "/pricing", label: "Pricing", icon: Tags },
      { to: "/about", label: "About", icon: Info },
      { to: "/contact", label: "Contact", icon: Phone },
      { to: "/request-service", label: "Request a Pickup", icon: PackagePlus },
    ],
  },
];

export default function IntelSidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav className="sticky top-4 space-y-4 pb-8">
        {SECTIONS.map((section) => (
          <div key={section.label}>
            <div className="px-3 pb-1.5 font-plex text-[9px] font-bold uppercase tracking-[0.2em] text-lm-muted">{section.label}</div>
            <ul className="space-y-0.5">
              {section.items.map(({ to, label: text, icon: Icon }) => {
                const active = pathname === to || (to !== "/live" && pathname.startsWith(to));
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-full px-3 py-2 text-[13px] font-semibold transition-colors ${
                        active ? "bg-lm-teal text-white shadow-sm" : "text-lm-muted hover:bg-white hover:text-lm-ink"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
                      <span className="truncate">{text}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}