import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Recycle, Menu, X, LayoutDashboard, Truck, UserPlus, ClipboardList, Users,
  Wallet, Tag, MapPin, Star, Search, Activity, BarChart3, Megaphone,
  MessagesSquare, Globe, Images, Lock, ExternalLink, Loader2, Route as RouteIcon, LineChart, Wand2,
  Globe2, PieChart, FileSignature, TrendingUp, Trello, Scale, ShieldCheck, MessageSquare, Filter, Briefcase, Sparkles, BrainCircuit,
  Target, FileSearch, ListChecks, UsersRound, Radar, Radio, Crosshair, Gauge as GaugeIcon, Rocket as RocketIcon, Orbit,
} from "lucide-react";

// Command Centre navigation — four unified intelligence groups (Recycling OS
// unification). Every existing page appears exactly once; nothing moved.
const OPERATIONS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/admin/gauges", label: "Gauge Wall", icon: GaugeIcon },
  { to: "/admin/ops", label: "Live Operations", icon: Radio },
  { to: "/admin/national", label: "National Ops", icon: Globe2 },
  { to: "/admin/jobs", label: "Jobs & Dispatch", icon: Truck },
  { to: "/admin/leads", label: "Leads", icon: UserPlus },
  { to: "/admin/pipeline", label: "Lead Pipeline", icon: Trello },
  { to: "/admin/assignments", label: "Assignments", icon: ClipboardList },
  { to: "/admin/routes", label: "Route Intelligence", icon: RouteIcon },
  { to: "/admin/partners", label: "Partners", icon: Users },
  { to: "/admin/payouts", label: "Payouts", icon: Wallet },
  { to: "/admin/revenue", label: "Revenue Intelligence", icon: PieChart },
  { to: "/admin/agreements", label: "Agreements", icon: FileSignature },
  { to: "/admin/disputes", label: "Disputes", icon: Scale },
  { to: "/admin/reputation", label: "Reputation", icon: ShieldCheck },
  { to: "/admin/contractor-ops", label: "Contractor Operations", icon: Briefcase, exact: true },
  { to: "/admin/white-label", label: "White Label", icon: Globe },
  { to: "/admin/gallery", label: "Fleet Gallery", icon: Images },
];
const ACQUISITION = [
  { to: "/admin/acquisition", label: "Customer Acquisition", icon: Users, exact: true },
  { to: "/admin/conversion", label: "Conversion Funnel", icon: Filter },
  { to: "/admin/sales", label: "Sales Intelligence", icon: TrendingUp },
  { to: "/admin/contractor-acquisition", label: "Contractor Acquisition", icon: Target },
  { to: "/admin/gbp", label: "GBP Funnel", icon: MapPin },
  { to: "/admin/marketing-command", label: "Marketing Command", icon: Radar, exact: true },
  { to: "/admin/marketing", label: "Marketing Hub", icon: Megaphone },
  { to: "/admin/facebook", label: "Facebook AI", icon: MessagesSquare },
  { to: "/admin/sms", label: "SMS Inbox", icon: MessageSquare },
  { to: "/admin/community", label: "Community", icon: UsersRound },
  { to: "/admin/ads", label: "Community Ads", icon: Megaphone },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];
const DEMAND = [
  { to: "/admin/demand", label: "Market Intelligence", icon: Globe2 },
  { to: "/admin/observatory", label: "Demand Observatory", icon: Orbit },
  { to: "/admin/discovery", label: "Opportunity Discovery", icon: Radar },
  { to: "/admin/search-authority", label: "Search Authority", icon: Search, exact: true },
  { to: "/admin/search-intelligence", label: "Search Intelligence", icon: LineChart },
  { to: "/admin/keywords", label: "Search Keywords", icon: Search },
  { to: "/admin/seo", label: "SEO Command", icon: Wand2 },
  { to: "/admin/seo-action", label: "SEO Action Engine", icon: Crosshair },
  { to: "/admin/intelligence", label: "Brand & Market Intelligence", icon: Sparkles, exact: true },
  { to: "/admin/bi", label: "Live Business Intelligence", icon: BarChart3, exact: true },
  { to: "/admin/growth", label: "Growth Intelligence", icon: TrendingUp, exact: true },
  { to: "/admin/growth-engine", label: "Network Growth Engine", icon: RocketIcon },
  { to: "/admin/improvements", label: "Improvement Queue", icon: ListChecks },
  { to: "/admin/business-master", label: "AI Business Master", icon: BrainCircuit, exact: true },
];
const SYSTEM_HEALTH = [
  { to: "/admin/integrity", label: "Platform Integrity", icon: ShieldCheck, exact: true },
  { to: "/admin/system", label: "System Administration", icon: Activity, exact: true },
  { to: "/admin/growth-command", label: "Owner Command Centre", icon: ShieldCheck },
  { to: "/admin/pricing", label: "Pricing", icon: Tag },
  { to: "/admin/cities", label: "City Management", icon: MapPin },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/franchise-review", label: "Franchise Review", icon: FileSearch },
];

function NavList({ pathname, onNavigate }) {
  const group = (title, items) => (
    <div className="mb-6">
      <div className="px-3 mb-2 font-plex text-[11px] font-semibold uppercase tracking-[0.16em] text-os-silver">{title}</div>
      <nav className="space-y-0.5">
        {items.map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-bold transition-colors ${
                active ? "bg-li-mint/15 text-li-infra ring-1 ring-li-infra/25" : "text-li-slate hover:bg-li-mint/10 hover:text-li-infra"
              }`}
            >
              <n.icon className={`w-4 h-4 ${active ? "text-li-infra" : "text-li-slate"}`} />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
  return (
    <>
      {group("Operations Intelligence", OPERATIONS)}
      {group("Acquisition Intelligence", ACQUISITION)}
      {group("Demand Intelligence", DEMAND)}
      {group("System Health", SYSTEM_HEALTH)}
    </>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-3">
      <span className="w-9 h-9 rounded-xl bg-li-forest text-white flex items-center justify-center">
        <Recycle className="w-5 h-5" />
      </span>
      <span>
        <span className="block text-sm font-bold text-li-carbon leading-tight">Same Day Recycling</span>
        <span className="font-plex block text-[10px] font-semibold uppercase tracking-[0.16em] text-li-infra">Recycling OS Command Centre</span>
      </span>
    </Link>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("loading");

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setRole(me?.role || "user");
      } catch {
        setRole("none");
      }
    })();
  }, []);

  if (role === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-li-cloud">
        <Loader2 className="w-8 h-8 text-li-infra animate-spin" />
      </div>
    );
  }
  if (role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center bg-li-cloud">
        <Lock className="w-10 h-10 text-li-infra" />
        <h1 className="text-2xl font-bold text-li-carbon">Admins only</h1>
        <p className="text-li-slate">You need an admin account to open the Command Centre.</p>
      </div>
    );
  }

  return (
    <div className="admin-li min-h-screen bg-li-cloud">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-60 flex-col bg-white border-r border-li-steel z-40">
        <div className="h-16 flex items-center border-b border-li-steel shrink-0">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <NavList pathname={location.pathname} />
        </div>
        <div className="border-t border-li-steel p-3">
          <Link to="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-li-slate hover:text-li-infra hover:bg-li-mint/10 transition-colors">
            <ExternalLink className="w-4 h-4" /> View live site
          </Link>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-40 h-14 bg-white border-b border-li-steel flex items-center justify-between px-4">
        <Brand />
        <button onClick={() => setOpen(true)} className="p-2 -mr-2 text-white" aria-label="Open menu">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-xl">
            <div className="h-16 flex items-center justify-between border-b border-li-steel px-3 pr-4 shrink-0">
              <Brand />
              <button onClick={() => setOpen(false)} className="p-1 text-os-silver" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <NavList pathname={location.pathname} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="md:pl-60">
        <main className="max-w-6xl mx-auto px-4 pb-24 pt-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}