import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Recycle, Menu, X, ExternalLink, Loader2, Lock, ChevronRight } from "lucide-react";
import NavSidebar from "@/components/admin/NavSidebar";
import { findPage, SECTIONS } from "@/lib/adminPages";
import { recordVisit } from "@/lib/adminNavState";

// Command Centre shell — five navigation sections over the page registry
// (src/lib/adminPages.js), with search, pinning, recently visited pages and
// breadcrumbs. Every admin page that exists is reachable from here.

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

function Breadcrumbs({ pathname }) {
  const page = findPage(pathname);
  if (!page) return null;
  const section = SECTIONS.find((s) => s.key === page.section);
  return (
    <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-1 text-xs text-li-slate">
      <Link to="/admin" className="font-semibold hover:text-li-infra">Command Centre</Link>
      {section && (
        <>
          <ChevronRight className="h-3 w-3 text-os-silver" aria-hidden="true" />
          <span className="font-semibold">{section.label}</span>
        </>
      )}
      <ChevronRight className="h-3 w-3 text-os-silver" aria-hidden="true" />
      <span aria-current="page" className="font-bold text-li-carbon">{page.name}</span>
    </nav>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("loading");

  useEffect(() => setOpen(false), [location.pathname]);

  useEffect(() => {
    recordVisit(location.pathname);
  }, [location.pathname]);

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
      <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 flex-col bg-white border-r border-li-steel z-40">
        <div className="h-16 flex items-center border-b border-li-steel shrink-0">
          <Brand />
        </div>
        <div className="flex-1 min-h-0 pt-3">
          <NavSidebar />
        </div>
        <div className="border-t border-li-steel p-3">
          <Link to="/" className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-li-slate hover:text-li-infra hover:bg-li-mint/10 transition-colors">
            <ExternalLink className="w-4 h-4" /> View live site
          </Link>
        </div>
      </aside>

      <header className="md:hidden sticky top-0 z-40 h-14 bg-white border-b border-li-steel flex items-center justify-between px-4">
        <Brand />
        <button onClick={() => setOpen(true)} className="p-2 -mr-2 text-li-carbon" aria-label="Open menu">
          <Menu className="w-6 h-6" />
        </button>
      </header>

      {open && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative w-80 max-w-[88vw] bg-white h-full flex flex-col shadow-xl">
            <div className="h-16 flex items-center justify-between border-b border-li-steel px-3 pr-4 shrink-0">
              <Brand />
              <button onClick={() => setOpen(false)} className="p-1 text-li-slate" aria-label="Close menu">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 min-h-0 pt-3">
              <NavSidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}

      <div className="md:pl-64">
        <main className="max-w-6xl mx-auto px-4 pb-24 pt-6 md:px-8 md:py-8">
          <Breadcrumbs pathname={location.pathname} />
          <Outlet />
        </main>
      </div>
    </div>
  );
}