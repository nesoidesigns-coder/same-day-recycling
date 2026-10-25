import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { base44 } from "@/api/base44Client";
import usePickupLocation from "@/hooks/usePickupLocation";
import { pickupLocationActions } from "@/lib/pickupLocationStore";

export default function AddressSearch({ lang = "en", onSelect }) {
  const pickup = usePickupLocation(), fr = lang === "fr";
  const selectedAddress = pickup ? [pickup.addressLine, pickup.city, pickup.province, pickup.postal_code].filter(Boolean).join(", ") : "";
  const [query, setQuery] = useState(selectedAddress);
  const [items, setItems] = useState([]), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const request = useRef(0);
  useEffect(() => { setQuery(selectedAddress); setItems([]); }, [pickup?.selectionId, selectedAddress]);
  useEffect(() => () => { request.current += 1; }, []);
  const run = async () => {
    if (query.trim().length < 5) return;
    const id = ++request.current;
    setBusy(true); setError(""); setItems([]);
    try {
      const res = await base44.functions.invoke("addressGeocode", { query: query.trim(), lang });
      if (id !== request.current) return;
      setItems(res.data?.candidates || []);
      if (!res.data?.candidates?.length) setError(fr ? "Adresse non identifiée. Ajoutez le numéro, la rue et la ville. Aucune épingle n'a été créée." : "Address not identified. Include the street number, street and city. No pickup pin was invented.");
    } catch { if (id === request.current) setError(fr ? "Recherche indisponible. Réessayez ou utilisez le code postal." : "Address search unavailable. Try again or use the postal-code path."); }
    finally { if (id === request.current) setBusy(false); }
  };
  const choose = (candidate) => { request.current += 1; setBusy(false); setItems([]); pickupLocationActions.select(candidate); onSelect?.(candidate); };
  return <div className="relative mb-3">
    <label className="mb-1.5 block text-sm font-semibold" htmlFor="pickup-address-search">{fr ? "Adresse de ramassage" : "Pickup street address"}</label>
    <div className="flex gap-2">
      <input id="pickup-address-search" value={query} onChange={(e) => { request.current += 1; setBusy(false); setQuery(e.target.value); setItems([]); setError(""); }} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); run(); } }} autoComplete="street-address" className="min-w-0 flex-1 rounded-xl border border-market-line bg-background px-3 py-3 text-foreground" placeholder={fr ? "Numéro, rue, ville, province" : "Number, street, city, province"} maxLength={120} aria-controls="pickup-address-results" aria-expanded={items.length > 0} />
      <button type="button" onClick={run} disabled={busy || query.trim().length < 5} aria-label={fr ? "Rechercher l'adresse" : "Find address"} className="flex min-h-11 items-center gap-1 rounded-xl bg-market-accent px-3 text-sm font-bold text-market-bg disabled:opacity-50">{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}{fr ? "Chercher" : "Find"}</button>
    </div>
    {items.length > 0 && <ul id="pickup-address-results" className="mt-2 max-h-72 overflow-y-auto rounded-xl border border-market-line bg-background text-foreground" aria-label={fr ? "Adresses suggérées" : "Suggested addresses"}>
      {items.map((c, i) => <li key={`${c.lat}:${c.lng}:${i}`}><button type="button" onClick={() => choose(c)} className="flex min-h-11 w-full items-start gap-2 px-3 py-3 text-left hover:bg-muted"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-emerald" /><span className="min-w-0 text-sm"><strong className="block">{c.street_level ? "≈ " : ""}{c.label}</strong><span className="block text-xs text-muted-foreground">{[c.city, c.province_name, c.postal_code].filter(Boolean).join(", ")}</span>{c.street_level && <span className="block text-xs font-semibold text-gold-dark">{fr ? "Rue seulement : confirmez ou ajustez l'épingle." : "Street-level match only: confirm or adjust the pin."}</span>}</span></button></li>)}
    </ul>}
    {error && <p role="status" className="mt-2 text-xs text-market-muted">{error}</p>}
    <p className="mt-1 text-xs text-market-muted">{fr ? "La carte change uniquement après la sélection d'un résultat." : "Choose a result to update the map; typing alone does not change the pickup location."}</p>
  </div>;
}