import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { LibraryBig, MapPin, Link as LinkIcon } from "lucide-react";
import { CITIES } from "@/lib/cities";

// City meta library: every city page with a custom title/description from the
// CitySeo library, so coverage gaps are visible at a glance.
export default function CityMetaLibrary() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { items } = await base44.entities.CitySeo.filter({}, { sort: "-updated_date", limit: 500 });
        setRows(items);
      } catch {
        setError("Could not load the city meta library.");
      }
    })();
  }, []);

  const byCity = {};
  for (const r of rows || []) byCity[r.city] = r;
  const done = CITIES.filter((c) => byCity[c.name]?.seo_title);

  return (
    <div className="holo-panel-deep rounded-2xl border border-[#54D9AE]/15 p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><LibraryBig className="w-5 h-5 text-[#54D9AE]" /> City meta library</h2>
        <span className="text-xs font-bold text-slate-400">
          {rows ? `${done.length} of ${CITIES.length} city pages have custom SEO metadata` : ""}
        </span>
      </div>
      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {!rows ? (
        <p className="mt-4 text-sm text-slate-400">Loading library…</p>
      ) : (
        <div className="mt-5 flex flex-wrap gap-2">
          {CITIES.map((c) => {
            const r = byCity[c.name];
            return (
              <span
                key={c.slug}
                title={r?.seo_title || "No custom metadata yet"}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold ${
                  r?.seo_title
                    ? "border-[#54D9AE]/40 text-[#54D9AE]"
                    : "border-slate-500/40 text-slate-400"
                }`}
              >
                {r?.seo_title ? <MapPin className="w-3 h-3" /> : <LinkIcon className="w-3 h-3" />}
                {c.name}
                {r?.updated_date && <span className="text-[10px] font-semibold text-slate-500">{r.updated_date}</span>}
              </span>
            );
          })}
        </div>
      )}
      <p className="mt-4 text-xs text-slate-500">Missing chips get custom titles and descriptions from the AI SEO Command fixes below or from City Management.</p>
    </div>
  );
}