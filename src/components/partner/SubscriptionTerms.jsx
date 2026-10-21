import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { ScrollText } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");
const panel = "relative overflow-hidden rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm";

// Shows the contractor their own active subscription terms, exactly as agreed.
export default function SubscriptionTerms() {
  const [agreement, setAgreement] = useState(null);

  useEffect(() => {
    base44.functions.invoke("partnerPortal", { action: "reporting" })
      .then((r) => setAgreement(r.data?.agreement || false))
      .catch(() => setAgreement(false));
  }, []);

  const s = agreement?.subscription;
  if (!agreement || !s?.is_flat_fee_subscription) return null;

  return (
    <div className={`${panel} p-5 mb-10`}>
      <div className="flex items-center gap-2 mb-3">
        <ScrollText className="w-4 h-4 text-[#187B65]" />
        <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-white">Your territory subscription terms</h2>
      </div>
      <ul className="space-y-1.5 text-sm text-emerald-100/70">
        <li><span className="font-semibold text-white">Monthly rate:</span> {money(s.monthly_rate)} flat, billed {s.billing_cycle}</li>
        {s.activation_fee > 0 && <li><span className="font-semibold text-white">One-time activation:</span> {money(s.activation_fee)}</li>}
        <li><span className="font-semibold text-white">Cancellation:</span> {s.cancellation_notice_days} days written notice</li>
        {s.territory_cities?.length > 0 && <li><span className="font-semibold text-white">Territory cities:</span> {s.territory_cities.join(", ")}</li>}
        <li><span className="font-semibold text-white">Lead delivery:</span> {s.lead_delivery_commitment || "Leads depend on customer demand in your territory. No minimum volume is promised."}</li>
        <li className="text-xs text-emerald-100/40 pt-1">{agreement.disclosure}</li>
      </ul>
    </div>
  );
}