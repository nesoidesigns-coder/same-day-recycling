import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Camera, Loader2, MapPin, Sparkles } from "lucide-react";
import { base44 } from "@/api/base44Client";
import AddressSearch from "@/components/sdr/AddressSearch";
import PickupLocationPanel from "@/components/sdr/PickupLocationPanel";
import usePickupLocation from "@/hooks/usePickupLocation";
import { getPickupLocation, pickupBookingFields } from "@/lib/pickupLocationStore";

// Progressive-disclosure MoveAssist wizard: one question per screen, progress
// saved in the browser so the customer can leave and come back.
const DRAFT_KEY = "moveassist:draft:v1";
const ITEM_CHIPS = [
  { key: "sofa", label: "Sofa / couch" },
  { key: "mattress", label: "Mattress" },
  { key: "dresser", label: "Dresser / table" },
  { key: "fridge", label: "Fridge / freezer" },
  { key: "washer", label: "Washer / dryer / stove" },
  { key: "tv", label: "TV / electronics" },
  { key: "metal", label: "Scrap metal" },
  { key: "boxes", label: "Bags / boxes of junk" },
  { key: "cleanout", label: "Garage / estate cleanout" },
];
const SITUATIONS = [
  { key: "moving_out", label: "Moving out", hint: "Clear the old place before handover" },
  { key: "moving_in", label: "Moving in", hint: "Clear out what the previous owners left" },
  { key: "downsizing", label: "Downsizing", hint: "Right-size before the smaller home" },
];
const PROPERTIES = [
  { key: "apartment", label: "Apartment" },
  { key: "condo", label: "Condo" },
  { key: "house", label: "House" },
  { key: "townhouse", label: "Townhouse" },
  { key: "other", label: "Other" },
];
const PICKUP_COUNTS = [
  { key: "one", label: "One pickup", hint: "A single truck visit covers it" },
  { key: "several", label: "Several pickups", hint: "Stage the removal around the move" },
  { key: "unsure", label: "Not sure yet", hint: "Rex will suggest a plan" },
];
const ACCESS_TAGS = [
  { key: "inside", label: "Items inside" },
  { key: "outside", label: "Items outside" },
  { key: "stairs", label: "Stairs" },
  { key: "elevator", label: "Elevator" },
  { key: "parking", label: "Parking restrictions" },
  { key: "heavy", label: "Heavy items" },
];

export default function MoveWizard({ onComplete }) {
  const pickup = usePickupLocation();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
      return saved && typeof saved === "object" ? { ...saved } : { qty: {}, tags: [], photos: [] };
    } catch { return { qty: {}, tags: [], photos: [] }; }
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); } catch { /* storage may be blocked */ }
  }, [draft]);

  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const bump = (key, delta) => set({ qty: { ...draft.qty, [key]: Math.max(0, (draft.qty[key] || 0) + delta) } });
  const chosenChips = ITEM_CHIPS.filter((c) => (draft.qty[c.key] || 0) > 0);
  const chosenTags = draft.tags || [];

  const uploadPhotos = async (files) => {
    if (!files?.length) return;
    setBusy(true); setError("");
    try {
      const uploaded = [];
      for (const file of Array.from(files).slice(0, 4)) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        if (file_uri) uploaded.push({ label: file.name.slice(0, 80), file_uri });
      }
      set({ photos: [...(draft.photos || []), ...uploaded].slice(0, 8) });
    } catch { setError("Photo upload failed — you can continue without photos."); }
    finally { setBusy(false); }
  };

  const canContinue = () => {
    if (step === 1) return !!draft.situation;
    if (step === 2) return !!draft.property_type;
    if (step === 3) return chosenChips.length > 0 || (draft.items_text || "").trim().length > 3 || (draft.photos || []).length > 0;
    if (step === 4) return !!draft.pickup_count;
    if (step === 5) return !!pickup?.pinConfirmed;
    if (step === 7) return (draft.name || "").trim().length >= 2 && (draft.phone || "").trim().length >= 7;
    return true;
  };

  const itemsText = () => {
    const parts = chosenChips.map((c) => `${draft.qty[c.key]} × ${c.label}`);
    if ((draft.items_text || "").trim()) parts.push(draft.items_text.trim());
    return parts.join(", ").slice(0, 900);
  };

  const submit = async () => {
    setError("");
    const pickupNow = getPickupLocation();
    const booking = pickupBookingFields(pickupNow);
    if (!pickupNow?.pinConfirmed || !booking.pickup_lat) {
      setError("Confirm your pickup address on the map first.");
      setStep(5);
      return;
    }
    setBusy(true);
    try {
      const created = await base44.functions.invoke("moveAssist", {
        action: "create",
        name: (draft.name || "").trim(),
        phone: (draft.phone || "").trim(),
        email: (draft.email || "").trim(),
        move_date: draft.move_date || "",
        move_flexible: draft.move_flexible === true,
        situation: draft.situation,
        property_type: draft.property_type,
        city: pickupNow.city,
        province_code: pickupNow.province,
        postal_code: pickupNow.postal_code || "",
        pickup_lat: booking.pickup_lat,
        pickup_lng: booking.pickup_lng,
        pickup_unit: pickupNow.unit || "",
        pickup_location_source: booking.pickup_location_source || "",
        access_instructions: { tags: chosenTags, note: (draft.access_note || "").trim() },
        inventory: chosenChips.map((c) => ({ item: c.label, quantity: draft.qty[c.key] })),
        items_description: itemsText(),
        photos: draft.photos || [],
        pickup_count: draft.pickup_count,
        consent_followups: draft.consent_followups === true,
      });
      if (!created.data?.ok) throw new Error(created.data?.error || "Project could not be saved");
      const reference_code = created.data.reference_code;
      try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
      base44.analytics.track({ eventName: "moveassist_project_created", properties: { city: pickupNow.city, pickup_count: draft.pickup_count } });
      setBusy(true);
      const advised = await base44.functions.invoke("moveAssist", { action: "advise", reference_code, items_text: itemsText() });
      setBusy(false);
      if (advised.data?.project) onComplete(advised.data.project);
      else onComplete({ reference_code });
    } catch (err) {
      setBusy(false);
      setError(err?.response?.data?.error || err?.message || "Something went wrong — please try again.");
    }
  };

  const goNext = () => {
    if (!canContinue()) {
      setError(step === 5 ? "Search your address, then confirm the pin on the map." : step === 3 ? "List at least one item, or upload a photo." : step === 7 ? "Your name and phone number are required." : "Choose an option to continue.");
      return;
    }
    setError("");
    if (step === 7) { submit(); return; }
    setStep(step + 1);
  };

  if (busy) {
    return (
      <div className="rounded-3xl border border-market-line bg-market-surface p-8 text-center" role="status">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-market-accent" />
        <p className="mt-4 font-bold">{step === 7 && "Building your MoveAssist plan…"}</p>
        <p className="mt-1 text-sm text-market-muted">Rex is organizing your cleanout timeline.</p>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-market-line bg-market-surface p-4 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex gap-1.5" aria-label={`Step ${step + 1} of 8`}>
          {Array.from({ length: 8 }, (_, i) => (
            <span key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? "bg-market-accent" : "bg-market-line"}`} />
          ))}
        </div>
        <span className="text-xs font-bold uppercase tracking-wider text-market-muted">Step {step + 1} of 8</span>
      </div>

      {step === 0 && (
        <div>
          <h3 className="text-xl font-bold">When is the move?</h3>
          <p className="mt-1 text-sm text-market-muted">Your deadline shapes the pickup plan — you can change it later.</p>
          <label className="mt-4 block text-sm font-semibold">Move or cleanout date
            <input type="date" value={draft.move_date || ""} min={new Date().toISOString().slice(0, 10)} onChange={(e) => set({ move_date: e.target.value, move_flexible: false })} className="input mt-1 bg-white/95" />
          </label>
          <label className="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={draft.move_flexible === true} onChange={(e) => set({ move_flexible: e.target.checked, move_date: e.target.checked ? "" : draft.move_date })} className="h-4 w-4" />
            The date is flexible or not fixed yet
          </label>
        </div>
      )}

      {step === 1 && (
        <div>
          <h3 className="text-xl font-bold">What's the situation?</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {SITUATIONS.map((s) => (
              <button key={s.key} type="button" onClick={() => set({ situation: s.key })} aria-pressed={draft.situation === s.key} className={`rounded-2xl border p-4 text-left transition-colors ${draft.situation === s.key ? "border-market-accent bg-market-accent/15" : "border-market-line hover:border-market-accent/50"}`}>
                <span className="block font-bold">{s.label}</span>
                <span className="mt-1 block text-xs text-market-muted">{s.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <h3 className="text-xl font-bold">What type of property?</h3>
          <div className="mt-4 flex flex-wrap gap-2">
            {PROPERTIES.map((p) => (
              <button key={p.key} type="button" onClick={() => set({ property_type: p.key })} aria-pressed={draft.property_type === p.key} className={`min-h-11 rounded-full border px-4 font-bold transition-colors ${draft.property_type === p.key ? "border-market-accent bg-market-accent/15" : "border-market-line hover:border-market-accent/50"}`}>{p.label}</button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div>
          <h3 className="text-xl font-bold">What needs to go?</h3>
          <p className="mt-1 text-sm text-market-muted">Pick what applies — rough numbers are fine. Photos help Rex plan.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {ITEM_CHIPS.map((c) => (
              <div key={c.key} className="flex items-center justify-between rounded-xl bg-white/95 px-3 py-2.5">
                <span className="text-sm font-semibold text-[#102B2A]">{c.label}</span>
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => bump(c.key, -1)} aria-label={`Less ${c.label}`} className="h-7 w-7 rounded-full bg-slate-100 hover:bg-slate-200">−</button>
                  <span className="w-5 text-center text-sm font-bold text-[#102B2A]">{draft.qty[c.key] || 0}</span>
                  <button type="button" onClick={() => bump(c.key, 1)} aria-label={`More ${c.label}`} className="h-7 w-7 rounded-full bg-[#187B65]/15 hover:bg-[#187B65]/30 text-[#187B65]">+</button>
                </div>
              </div>
            ))}
          </div>
          <textarea value={draft.items_text || ""} onChange={(e) => set({ items_text: e.target.value })} maxLength={500} rows={2} className="input mt-3 bg-white/95" placeholder="Anything else? Describe it in your own words." />
          <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => uploadPhotos(e.target.files)} className="hidden" />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-market-line px-4 text-sm font-bold hover:border-market-accent">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} Add photos {(draft.photos || []).length > 0 && `(${draft.photos.length})`}
          </button>
        </div>
      )}

      {step === 4 && (
        <div>
          <h3 className="text-xl font-bold">One pickup or several?</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-3">
            {PICKUP_COUNTS.map((p) => (
              <button key={p.key} type="button" onClick={() => set({ pickup_count: p.key })} aria-pressed={draft.pickup_count === p.key} className={`rounded-2xl border p-4 text-left transition-colors ${draft.pickup_count === p.key ? "border-market-accent bg-market-accent/15" : "border-market-line hover:border-market-accent/50"}`}>
                <span className="block font-bold">{p.label}</span>
                <span className="mt-1 block text-xs text-market-muted">{p.hint}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 5 && (
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2"><MapPin className="h-5 w-5 text-market-accent" /> Where is the pickup?</h3>
          <p className="mt-1 text-sm text-market-muted">Search your address, then confirm the pin on the map — that location is saved to your MoveAssist project.</p>
          <div className="mt-3"><AddressSearch lang="en" /></div>
          <PickupLocationPanel lang="en" />
        </div>
      )}

      {step === 6 && (
        <div>
          <h3 className="text-xl font-bold">Building access?</h3>
          <p className="mt-1 text-sm text-market-muted">Only what you know — Rex passes this to the contractor, it never changes the estimate.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {ACCESS_TAGS.map((t) => {
              const on = chosenTags.includes(t.key);
              return (
                <button key={t.key} type="button" aria-pressed={on} onClick={() => set({ tags: on ? chosenTags.filter((k) => k !== t.key) : [...chosenTags, t.key] })} className={`min-h-11 rounded-full border px-3.5 text-sm font-bold transition-colors ${on ? "border-market-accent bg-market-accent/15" : "border-market-line hover:border-market-accent/50"}`}>{t.label}</button>
              );
            })}
          </div>
          <input value={draft.access_note || ""} onChange={(e) => set({ access_note: e.target.value })} maxLength={200} className="input mt-3 bg-white/95" placeholder="Access note (optional) — e.g. loading dock on P1, book elevator 48h ahead" />
        </div>
      )}

      {step === 7 && (
        <div>
          <h3 className="text-xl font-bold">Where do we send the plan?</h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input value={draft.name || ""} onChange={(e) => set({ name: e.target.value })} maxLength={120} className="input bg-white/95" placeholder="Full name" autoComplete="name" />
            <input value={draft.phone || ""} onChange={(e) => set({ phone: e.target.value })} maxLength={40} className="input bg-white/95" placeholder="Phone number" autoComplete="tel" type="tel" />
            <input value={draft.email || ""} onChange={(e) => set({ email: e.target.value })} maxLength={200} className="input bg-white/95 sm:col-span-2" placeholder="Email (optional)" autoComplete="email" type="email" />
          </div>
          <label className="mt-3 flex items-start gap-2 text-sm">
            <input type="checkbox" checked={draft.consent_followups === true} onChange={(e) => set({ consent_followups: e.target.checked })} className="mt-1 h-4 w-4" />
            <span>Rex may follow up with reminders about photos, missing details and upcoming pickups. No bookings or charges are ever made without your approval.</span>
          </label>
        </div>
      )}

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      <div className="mt-5 flex gap-2">
        {step > 0 && (
          <button type="button" onClick={() => { setError(""); setStep(step - 1); }} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-market-line px-5 font-bold hover:border-market-accent/50">
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
        )}
        <button type="button" onClick={goNext} disabled={busy} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-market-accent px-7 py-4 font-bold text-market-bg transition-colors hover:opacity-90 disabled:opacity-60">
          {step === 7 ? <><Sparkles className="h-5 w-5" /> Get my MoveAssist plan</> : <>Continue <ArrowRight className="h-5 w-5" /></>}
        </button>
      </div>
      <p className="mt-3 text-xs text-market-muted">Your progress is saved in this browser. You can close this page and come back.</p>
    </div>
  );
}