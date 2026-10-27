import { useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Search, Star, Clock, LayoutGrid } from "lucide-react";
import { NAV_SECTIONS, SECTIONS, navPages, findPage } from "@/lib/adminPages";
import { getPins, getRecent, togglePin } from "@/lib/adminNavState";

// Command Centre navigation: five collapsible sections over the page registry,
// with search, pinned pages and recently visited pages. Every admin page that
// exists appears exactly once; All Pages is the catch-all directory.

const SectionLabel = ({ children }) => (
  <div className="px-3 pb-1.5 font-plex text-[10px] font-semibold uppercase tracking-[0.16em] text-os-silver">{children}</div>
);

function NavLink({ page, pathname, onNavigate, pinned, onTogglePin }) {
  const active = pathname === page.path || (page.path !== "/admin" && pathname.startsWith(page.path));
  return (
    <div className="group relative flex items-center">
      <Link
        to={page.path}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`flex flex-1 items-center gap-2 rounded-xl px-3 py-2.5 min-h-[44px] text-sm font-bold transition-colors ${
          active ? "bg-li-mint/15 text-li-infra ring-1 ring-li-infra/25" : "text-li-slate hover:bg-li-mint/10 hover:text-li-infra"
        }`}
      >
        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${active ? "bg-li-infra" : "bg-li-steel"}`} />
        <span className="truncate">{page.name}</span>
      </Link>
      <button
        type="button"
        onClick={() => onTogglePin(page.path)}
        aria-label={pinned ? `Unpin ${page.name}` : `Pin ${page.name}`}
        title={pinned ? "Unpin" : "Pin to top"}
        className={`grid h-9 w-8 shrink-0 place-items-center rounded-lg transition-opacity ${
          pinned ? "opacity-100 text-ri-amber" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100 text-li-slate"
        }`}
      >
        <Star className={`h-3.5 w-3.5 ${pinned ? "fill-ri-amber" : ""}`} />
      </button>
    </div>
  );
}

export default function NavSidebar({ onNavigate }) {
  const { pathname } = useLocation();
  const current = findPage(pathname);
  const [query, setQuery] = useState("");
  const [pins, setPins] = useState(getPins);
  const [open, setOpen] = useState(() => ({ [current?.section || "command"]: true }));

  const groups = useMemo(
    () => NAV_SECTIONS.map((key) => ({ key, meta: SECTIONS.find((s) => s.key === key), pages: navPages(key) })),
    [],
  );

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return groups
      .flatMap((g) => g.pages.map((p) => ({ ...p, sectionLabel: g.meta.label })))
      .filter((p) => `${p.name} ${p.purpose} ${p.path}`.toLowerCase().includes(q));
  }, [query, groups]);

  const pinnedPages = pins
    .map((p) => groups.flatMap((g) => g.pages).find((page) => page.path === p))
    .filter(Boolean);
  const recentPages = getRecent()
    .filter((p) => !pins.includes(p))
    .map((p) => groups.flatMap((g) => g.pages).find((page) => page.path === p))
    .filter(Boolean)
    .slice(0, 4);

  const onTogglePin = (path) => setPins(togglePin(path));

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pb-3">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-os-silver" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages…"
            aria-label="Search pages"
            className="w-full rounded-xl border border-li-steel bg-li-cloud/60 py-2 pl-8 pr-3 text-sm text-li-carbon placeholder:text-os-silver focus:border-li-infra focus:outline-none focus:ring-2 focus:ring-li-infra/20"
          />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-6">
        {results ? (
          <div className="mb-4">
            <SectionLabel>{results.length} result{results.length === 1 ? "" : "s"}</SectionLabel>
            <nav className="space-y-0.5">
              {results.map((p) => (
                <Link
                  key={p.path}
                  to={p.path}
                  onClick={onNavigate}
                  className="block rounded-xl px-3 py-2 text-sm font-semibold text-li-slate hover:bg-li-mint/10 hover:text-li-infra"
                >
                  <span className="block truncate">{p.name}</span>
                  <span className="block font-plex text-[10px] uppercase tracking-wide text-os-silver">{p.sectionLabel}</span>
                </Link>
              ))}
              {results.length === 0 && <p className="px-3 py-2 text-sm text-li-slate">No page matches that.</p>}
            </nav>
          </div>
        ) : (
          <>
            {pinnedPages.length > 0 && (
              <div className="mb-4">
                <SectionLabel><Star className="mr-1 inline h-3 w-3" />Pinned</SectionLabel>
                <nav className="space-y-0.5">
                  {pinnedPages.map((p) => (
                    <NavLink key={p.path} page={p} pathname={pathname} onNavigate={onNavigate} pinned onTogglePin={onTogglePin} />
                  ))}
                </nav>
              </div>
            )}

            {recentPages.length > 0 && (
              <div className="mb-4">
                <SectionLabel><Clock className="mr-1 inline h-3 w-3" />Recently visited</SectionLabel>
                <nav className="space-y-0.5">
                  {recentPages.map((p) => (
                    <NavLink key={p.path} page={p} pathname={pathname} onNavigate={onNavigate} pinned={false} onTogglePin={onTogglePin} />
                  ))}
                </nav>
              </div>
            )}

            {groups.map(({ key, meta, pages }) => {
              const isOpen = !!open[key];
              return (
                <div key={key} className="mb-2">
                  <button
                    type="button"
                    onClick={() => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left hover:bg-li-cloud"
                  >
                    <ChevronRight className={`h-3.5 w-3.5 shrink-0 text-os-silver transition-transform ${isOpen ? "rotate-90" : ""}`} />
                    <span className="flex-1 font-plex text-[10px] font-bold uppercase tracking-[0.16em] text-li-slate">{meta.label}</span>
                    <span className="font-plex text-[10px] text-os-silver">{pages.length}</span>
                  </button>
                  {isOpen && (
                    <nav className="mt-0.5 space-y-0.5">
                      {pages.map((p) => (
                        <NavLink key={p.path} page={p} pathname={pathname} onNavigate={onNavigate} pinned={pins.includes(p.path)} onTogglePin={onTogglePin} />
                      ))}
                    </nav>
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>

      <div className="border-t border-li-steel px-3 py-3">
        <Link
          to="/admin/all-pages"
          onClick={onNavigate}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-bold text-li-slate hover:bg-li-mint/10 hover:text-li-infra"
        >
          <LayoutGrid className="h-4 w-4" /> All pages
        </Link>
      </div>
    </div>
  );
}