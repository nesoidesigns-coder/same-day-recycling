import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Recycle, Menu, X, LayoutDashboard, Truck, UserPlus, ClipboardList, Users,
  Wallet, Tag, MapPin, Star, Search, Activity, BarChart3, Megaphone,
  MessagesSquare, Globe, Images, Lock, ExternalLink, Loader2, Route as RouteIcon, LineChart, Wand2,
  Globe2, PieChart, FileSignature, TrendingUp, Trello, Scale, ShieldCheck, MessageSquare,
} from "lucide-react";

const OPS = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
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
  { to: "/admin/sales", label: "Sales Intelligence", icon: TrendingUp },
];
const CONFIG = [
  { to: "/admin/pricing", label: "Pricing", icon: Tag },
  { to: "/admin/cities", label: "City Management", icon: MapPin },
  { to: "/admin/reviews", label: "Reviews", icon: Star },
  { to: "/admin/keywords", label: "Search Keywords", icon: Search },
  { to: "/admin/system", label: "System Health", icon: Activity },
];
const ADVANCED = [
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/search-intelligence", label: "Search Intelligence", icon: LineChart },
  { to: "/admin/seo", label: "SEO Command", icon: Wand2 },
  { to: "/admin/marketing", label: "Marketing Hub", icon: Megaphone },
  { to: "/admin/facebook", label: "Facebook AI", icon: MessagesSquare },
  { to: "/admin/sms", label: "SMS Inbox", icon: MessageSquare },
  { to: "/admin/white-label", label: "White Label", icon: Globe },
  { to: "/admin/gallery", label: "Fleet Gallery", icon: Images },
];

function NavList({ pathname, onNavigate }) {
  const group = (title, items) => (
    <div className="mb-6">
      <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">{title}</div>
      <nav className="space-y-0.5">
        {items.map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              onClick={onNavigate}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold transition-colors ${
                active ? "bg-[#102B2A] text-white shadow-sm" : "text-slate-600 hover:bg-[#eef4f0] hover:text-[#102B2A]"
              }`}
            >
              <n.icon className={`w-4 h-4 ${active ? "text-[#187B65]" : "text-slate-400"}`} />
              {n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
  return (
    <>
      {group("Operations", OPS)}
      {group("Configuration", CONFIG)}
      {group("Advanced", ADVANCED)}
    </>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2.5 px-3">
      <span className="w-9 h-9 rounded-xl bg-[#102B2A] text-[#187B65] flex items-center justify-center">
        <Recycle className="w-5 h-5" />
      </span>
      <span>
        <span className="block text-sm font-bold text-[#102B2A] leading-tight">Same Day Recycling</span>
        <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65]">Command Centre</span>
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
      <div className="min-h-screen flex items-center justify-center bg-[#f6f8f7]">
        <Loader2 className="w-8 h-8 text-[#187B65] animate-spin" />
      </div>
    );
  }
  if (role !== "admin") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 px-4 text-center bg-[#f6f8f7]">
        <Lock className="w-10 h-10 text-[#187B65]" />
        <h1 className="text-2xl font-bold text-[#102B2A]">Admins only</h1>
        <p className="text-slate-600">You need an admin account to open the Command Centre.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f8f7]">
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-slate-200/80 z-40">
        <div className="h-16 flex items-center border-b border-slate-100 shrink-0">
          <Brand />
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-5">
          <NavList pathname={location.pathname} />
        </div>
        <div className="border-t border-slate-100 p-3">
          <Link to="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-slate-500 hover:text-[#102B2A] hover:bg-[#eef4f0] transition-colors">
            <ExternalLink className="w-4 h-4" /> View live site
          </Link>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-40 h-14 bg-white border-b border-slate-200/80 flex items-center justify-between px-4">
        <Brand />
        <button onClick={() => setOpen(true)} className="p-2 -mr-2 text-[#102B2A]" aria-label="Open menu">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-[#102B2A]/40" onClick={() => setOpen(false)} />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col shadow-xl">
            <div className="h-16 flex items-center justify-between border-b border-slate-100 px-3 pr-4 shrink-0">
              <Brand />
              <button onClick={() => setOpen(false)} className="p-1 text-slate-500" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5">
              <NavList pathname={location.pathname} onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="md:pl-64">
        <main className="max-w-6xl mx-auto px-4 py-6 md:px-8 md:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}