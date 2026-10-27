import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, X } from "lucide-react";

// Admin management of the search-volume collection plan: the keywords the
// collector requests and the cities it targets. Saving a plan never creates a
// measurement — volumes still arrive only from the source.
export default function KeywordLibraryEditor({ onSaved }) {
  const [plan, setPlan] = useState(null); // {id, keywords, cities, history}
  const [kw, setKw] = useState("");
  const [city, setCity] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    base44.entities.SearchVolumeSettings.filter({}, { sort: "-created_date", limit: 1 })
      .then((page) => setPlan(page.items?.[0] || { keywords: [], cities: [], history: [] }))
      .catch(() => setPlan({ keywords: [], cities: [], history: [] }));
  }, []);

  const save = async (next, event) => {
    setSaving(true); setMsg("");
    try {
      const history = [...(plan.history || []), {
        date: new Date().toISOString(), event,
        note: `${next.keywords.length} keywords, ${next.cities.length} cities`,
      }].slice(-50);
      const body = { keywords: next.keywords, cities: next.cities, history };
      const saved = plan.id
        ? await base44.entities.SearchVolumeSettings.update(plan.id, body)
        : await base44.entities.SearchVolumeSettings.create(body);
      setPlan({ ...next, id: saved.id, history });
      setMsg("Collection plan saved.");
      onSaved?.();
    } catch (e) {
      setMsg(e?.message || "Could not save the plan.");
    } finally { setSaving(false); }
  };

  if (!plan) return <div className="mt-5 text-xs text-muted-foreground"><Loader2 className="mr-2 inline h-3.5 w-3.5 animate-spin" />Loading collection plan…</div>;

  const addKeyword = () => {
    const v = kw.trim().toLowerCase();
    if (!v || plan.keywords.includes(v)) return;
    setKw("");
    save({ ...plan, keywords: [...plan.keywords, v] }, "keyword_added");
  };
  const addCity = () => {
    const v = city.trim();
    if (!v || plan.cities.some((c) => c.toLowerCase() === v.toLowerCase())) return;
    setCity("");
    save({ ...plan, cities: [...plan.cities, v] }, "city_added");
  };

  const chips = (items, remove) => (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span key={item} className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[11px]">
          {item}
          <button type="button" onClick={() => remove(item)} aria-label={`Remove ${item}`} className="text-muted-foreground hover:text-destructive">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      {!items.length && <span className="text-[11px] text-muted-foreground">None saved — the built-in Canadian list is used.</span>}
    </div>
  );

  return (
    <div className="mt-5 border-t border-border pt-5">
      <div className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">Manage collection plan</div>
      <p className="mt-1 text-[11px] text-muted-foreground">Saving a plan changes what the collector requests, not what is measured. A keyword gets a volume only when the source returns one.</p>

      <div className="mt-4 grid gap-5 md:grid-cols-2">
        <div>
          <div className="text-xs font-semibold">Keywords ({plan.keywords.length})</div>
          <div className="mt-2 flex gap-2">
            <input value={kw} onChange={(e) => setKw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addKeyword()} placeholder="e.g. same day junk removal" className="h-9 flex-1 rounded-xl border border-border bg-background px-3 text-sm" />
            <button type="button" onClick={addKeyword} disabled={saving} className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-sm disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          {chips(plan.keywords, (item) => save({ ...plan, keywords: plan.keywords.filter((k) => k !== item) }, "keyword_removed"))}
        </div>

        <div>
          <div className="text-xs font-semibold">Targeted cities ({plan.cities.length})</div>
          <div className="mt-2 flex gap-2">
            <input value={city} onChange={(e) => setCity(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCity()} placeholder="e.g. Victoria" className="h-9 flex-1 rounded-xl border border-border bg-background px-3 text-sm" />
            <button type="button" onClick={addCity} disabled={saving} className="inline-flex h-9 items-center gap-1 rounded-xl border border-border px-3 text-sm disabled:opacity-50">
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          {chips(plan.cities, (item) => save({ ...plan, cities: plan.cities.filter((c) => c !== item) }, "city_removed"))}
        </div>
      </div>

      {msg && <p role="status" className="mt-3 text-xs text-muted-foreground">{msg}</p>}
    </div>
  );
}