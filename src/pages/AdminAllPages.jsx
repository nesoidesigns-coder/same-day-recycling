import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search, ChevronRight, LayoutGrid } from "lucide-react";
import { PAGES, SECTIONS } from "@/lib/adminPages";

// All Pages — the complete internal page registry. Every route that exists in
// the app is listed here with its purpose, audience, owning section, routing
// status and data sources, so nothing is reachable only by typing a URL.

const STATUS_STYLE = {
  active: "bg-li-mint/20 text-li-forest",
  unlinked: "bg-ri-amber/15 text-ri-amber-ink",
  hidden: "bg-li-steel text-li-slate",
  alias: "bg-li-steel text-li-slate",
};
const STATUS_LABEL = { active: "In menu", unlinked: "Not in menu", hidden: "Not promoted", alias: "Duplicate path" };

const ROLE_LABEL = { admin: "Admin", contractor: "Contractor", public: "Public" };

const SECTION_ORDER = [...SECTIONS.map((s) => s.key), "public", "prototypes"];
const SECTION_LABEL = {
  ...Object.fromEntries(SECTIONS.map((s) => [s.key, s.label])),
  public: "Public site & auth",
  prototypes: "Prototypes & aliases",
};

export default function AdminAllPages() {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return PAGES.filter((p) => {
      if (role !== "all" && p.role !== role) return false;
      if (!q) return true;
      return `${p.name} ${p.path} ${p.purpose} ${(p.sources || []).join(" ")}`.toLowerCase().includes(q);
    });
  }, [query, role]);

  const grouped = SECTION_ORDER.map((key) => ({
    key,
    label: SECTION_LABEL[key],
    pages: filtered.filter((p) => p.section === key),
  })).filter((g) => g.pages.length > 0);

  const counts = {
    total: PAGES.length,
    unlinked: PAGES.filter((p) => p.status === "unlinked").length,
    prototype: PAGES.filter((p) => p.section === "prototypes").length,
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-li-carbon tracking-tight">All Pages</h1>
        <p className="font-plex text-sm text-li-slate mt-1">
          {counts.total} pages in the platform · {counts.unlinked} were previously missing from the menus
        </p>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-os-silver" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by page name, route, purpose or data source…"
            aria-label="Search all pages"
            className="w-full rounded-xl border border-li-steel bg-white py-2.5 pl-9 pr-3 text-sm text-li-carbon placeholder:text-os-silver focus:border-li-infra focus:outline-none focus:ring-2 focus:ring-li-infra/20"
          />
        </label>
        <div className="flex gap-1 rounded-xl border border-li-steel bg-white p-1">
          {["all", "admin", "public"].map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                role === r ? "bg-li-forest text-white" : "text-li-slate hover:bg-li-cloud"
              }`}
            >
              {r === "all" ? "All" : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>

      {grouped.length === 0 && (
        <p className="rounded-2xl border border-li-steel bg-white p-6 text-sm text-li-slate">No page matches that search.</p>
      )}

      {grouped.map((g) => (
        <section key={g.key} className="rounded-2xl border border-li-steel bg-white overflow-hidden">
          <header className="flex items-center justify-between border-b border-li-steel px-4 py-3">
            <h2 className="flex items-center gap-2 text-sm font-bold text-li-carbon">
              <LayoutGrid className="h-4 w-4 text-li-infra" /> {g.label}
            </h2>
            <span className="font-plex text-[11px] text-li-slate">{g.pages.length}</span>
          </header>
          <ul className="divide-y divide-li-steel/70">
            {g.pages.map((p) => (
              <li key={p.path} className="px-4 py-3 hover:bg-li-cloud/60">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  {p.status === "alias" ? (
                    <span className="text-sm font-bold text-li-carbon">{p.name}</span>
                  ) : (
                    <Link to={p.path} className="text-sm font-bold text-li-infra hover:underline">
                      {p.name}
                    </Link>
                  )}
                  <code className="font-plex text-[11px] text-li-slate">{p.path}</code>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[p.status]}`}>{STATUS_LABEL[p.status]}</span>
                  <span className="rounded-full bg-li-cloud px-2 py-0.5 text-[10px] font-bold text-li-slate">{ROLE_LABEL[p.role]}</span>
                </div>
                <p className="mt-1 text-xs text-li-slate">{p.purpose}</p>
                {p.sources?.length > 0 && (
                  <p className="mt-1 font-plex text-[10px] uppercase tracking-wide text-os-silver">Reads {p.sources.join(" · ")}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <p className="flex items-center gap-1.5 text-xs text-li-slate">
        <ChevronRight className="h-3.5 w-3.5" />
        Routing status is checked against the app's route registry. A page listed as not routed has no reachable URL.
      </p>
    </div>
  );
}