import usePickupLocation from "@/hooks/usePickupLocation";
import { pickupLocationActions } from "@/lib/pickupLocationStore";

export default function PickupJobPreparation({ lang = "en" }) {
  const pickup = usePickupLocation(), fr = lang === "fr";
  if (!pickup?.pinConfirmed) return null;
  const tags = pickup.preparation.tags || [];
  const choose = (key) => pickupLocationActions.setPreparation({ ...pickup.preparation, tags: [...tags.filter((t) => t !== "inside" && t !== "outside"), key] });
  return <div className="mt-3 rounded-xl border border-market-line bg-market-bg p-3">
    <p className="text-sm font-semibold">{fr ? "Rex : j'ai votre adresse confirmée. Les objets sont-ils à l'intérieur ou à l'extérieur ?" : "Rex: I have your confirmed pickup address. Are the items inside or outside?"}</p>
    <div className="mt-2 flex flex-wrap gap-2">{[{ key: "inside", label: fr ? "À l'intérieur" : "Inside" }, { key: "outside", label: fr ? "À l'extérieur" : "Outside" }].map((item) => <button type="button" key={item.key} aria-pressed={tags.includes(item.key)} onClick={() => choose(item.key)} className={`min-h-11 rounded-full border px-4 text-sm font-bold ${tags.includes(item.key) ? "border-market-accent bg-market-accent/20" : "border-market-line"}`}>{item.label}</button>)}</div>
    <p className="mt-2 text-xs text-market-muted">{fr ? "Votre réponse accompagne la demande. Les escaliers, le stationnement et l'accès restent à confirmer avec vous." : "Your answer is saved with this request. Stairs, parking and access still need your confirmation, not assumptions from imagery."}</p>
  </div>;
}