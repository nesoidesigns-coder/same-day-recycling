import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { base44 } from "@/api/base44Client";

// Canadian address autocomplete for the pickup booking flow. Suggestions and
// coordinates come from the server-side geocoder (verified records only —
// coordinates are never invented). Picking a candidate is the customer's
// address confirmation. If no exact match is found the customer continues
// with the existing postal-code path, so the flow never blocks.
export default function AddressSearch({ lang = "en", onSelect }) {
  const fr = lang === "fr";
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef(null);
  const box = useRef(null);

  useEffect(() => {
    const close = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    document.addEventListener("pointerdown", close);
    return () => document.removeEventListener("pointerdown", close);
  }, []);

  const run = async (q) => {
    if (q.trim().length < 5) { setItems([]); setOpen(false); return; }
    setBusy(true);
    setError("");
    try {
      const res = await base44.functions.invoke("addressGeocode", { query: q, lang });
      const candidates = res.data?.candidates || [];
      setItems(candidates);
      setOpen(true);
      if (!candidates.length) setError(fr
        ? "Aucune adresse précise trouvée. Vérifiez l'orthographe ou continuez avec votre code postal."
        : "No exact address found. Check the spelling, or continue with your postal code.");
    } catch {
      setError(fr
        ? "Recherche d'adresse indisponible. Continuez avec votre code postal."
        : "Address search unavailable. Continue with your postal code.");
    } finally {
      setBusy(false);
    }
  };

  const onInput = (v) => {
    setQuery(v);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => run(v), 400);
  };

  return (
    <div ref={box} className="relative mb-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold">{fr ? "Adresse de ramassage" : "Pickup street address"}</span>
        <div className="relative">
          <input
            value={query}
            onChange={(e) => onInput(e.target.value)}
            onFocus={() => items.length && setOpen(true)}
            autoComplete="street-address"
            className="input bg-white/95 pr-10"
            placeholder={fr ? "p. ex. 812 av. Wenonah" : "e.g. 812 Wenonah Ave"}
            maxLength={120}
            aria-label={fr ? "Adresse de ramassage" : "Pickup street address"}
          />
          {busy && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />}
        </div>
      </label>
      {open && items.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-market-line bg-white shadow-xl" role="listbox" aria-label={fr ? "Adresses suggérées" : "Suggested addresses"}>
          {items.map((c, i) => (
            <li key={`${c.lat},${c.lng},${i}`}>
              <button type="button" onClick={() => { setOpen(false); onSelect(c); }} className="flex w-full items-start gap-2 px-3 py-2.5 text-left hover:bg-slate-50">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#187B65]" />
                <span className="min-w-0 text-sm">
                  <span className="block font-bold text-[#102B2A]">{c.street_level ? "≈ " : ""}{c.label}</span>
                  <span className="block truncate text-xs text-slate-500">{[c.city, c.province_name, c.postal_code].filter(Boolean).join(", ")}</span>
                  {c.street_level && <span className="block text-[11px] font-semibold text-amber-600">{fr ? "Point approximatif — confirmez le bâtiment sur la carte." : "Approximate point — confirm the building on the map."}</span>}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {error && <p className="mt-1 text-xs text-red-300">{error}</p>}
    </div>
  );
}