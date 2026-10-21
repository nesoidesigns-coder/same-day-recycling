import { Building2, TrendingUp, DollarSign, Activity, Globe2 } from "lucide-react";
import HoloGauge from "@/components/software/HoloGauge";
import { money } from "./shared";

export default function CommandOverview({ licenses, transactions, customers, pickups, invoices }) {
  const active = licenses.filter((l) => l.status === "active");
  const provisioning = licenses.filter((l) => l.status === "provisioning");
  const mrr = active.reduce((s, l) => s + (Number(l.monthly_fee) || 0), 0);
  const setupRevenue = transactions.filter((t) => t.purpose === "license_setup" && t.status === "paid").reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const activeSubs = transactions.filter((t) => t.purpose === "license_subscription" && t.status === "active").length;
  const cancelledSubs = transactions.filter((t) => t.purpose === "license_subscription" && t.status === "cancelled").length;
  const ordersPaid = transactions.filter((t) => t.purpose === "license_setup" && t.status === "paid").length;
  const provisioningRate = licenses.length ? Math.round((active.length / licenses.length) * 100) : 0;
  const paymentRate = (ordersPaid + activeSubs) > 0 ? Math.round(((ordersPaid + activeSubs) / Math.max(1, ordersPaid + activeSubs + transactions.filter((t) => t.status === "created" || t.status === "failed" || t.status === "cancelled").length)) * 100) : 0;

  const adopted = active.filter((l) => customers.some((c) => (c.license_email || "").toLowerCase() === (l.email || "").toLowerCase())).length;
  const adoptionRate = active.length ? Math.round((adopted / active.length) * 100) : 0;

  const donePickups = pickups.filter((p) => p.status === "completed").length;
  const pickupCompletion = pickups.length ? Math.round((donePickups / pickups.length) * 100) : 0;

  const byProvince = {};
  licenses.forEach((l) => {
    const p = l.province || "Unlisted";
    byProvince[p] = (byProvince[p] || 0) + 1;
  });
  const provinces = Object.entries(byProvince).sort((a, b) => b[1] - a[1]);
  const maxProv = provinces.length ? provinces[0][1] : 1;

  const openInvoices = invoices.filter((i) => i.status === "sent" || i.status === "draft");
  const openInvoiced = openInvoices.reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { icon: Building2, label: "Licensed companies", value: String(licenses.length), sub: `${active.length} active · ${provisioning.length} provisioning` },
          { icon: TrendingUp, label: "Monthly recurring", value: money(mrr), sub: `${activeSubs} verified subscription${activeSubs === 1 ? "" : "s"}` },
          { icon: DollarSign, label: "Setup revenue", value: money(setupRevenue), sub: `${ordersPaid} setup payment${ordersPaid === 1 ? "" : "s"}` },
          { icon: Activity, label: "Open invoices", value: money(openInvoiced), sub: `${openInvoices.length} across all instances` },
        ].map((g) => (
          <div key={g.label} className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-5">
            <div className="flex items-center gap-2">
              <g.icon className="w-4 h-4 text-[#187B65]" />
              <div className="text-xs font-bold tracking-wide text-emerald-100/60 uppercase">{g.label}</div>
            </div>
            <div className="text-2xl font-bold text-[#54D9AE] mt-2 holo-glow-text">{g.value}</div>
            <div className="text-xs text-emerald-100/50 mt-1">{g.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4 mb-8">
        <div className="holo-panel-deep holo-panel rounded-2xl border border-[#187B65]/20 p-6 flex items-center justify-center relative overflow-hidden">
          <HoloGauge value={provisioningRate} label="Provisioning rate" sub="Active licenses" />
        </div>
        <div className="holo-panel-deep holo-panel rounded-2xl border border-[#187B65]/20 p-6 flex items-center justify-center relative overflow-hidden">
          <HoloGauge value={paymentRate} label="Payment success" sub="Setup + subscriptions" />
        </div>
        <div className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe2 className="w-4 h-4 text-[#187B65]" />
            <div className="text-sm font-bold text-[#54D9AE]">Geographic coverage</div>
          </div>
          {provinces.length === 0 ? (
            <p className="text-sm text-emerald-100/50">No licensed companies yet.</p>
          ) : (
            <div className="space-y-2.5">
              {provinces.map(([p, n]) => (
                <div key={p} className="flex items-center gap-3">
                  <span className="w-16 text-xs font-bold text-emerald-100/70">{p}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-[#187B65]/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[#187B65] network-pulse" style={{ width: `${(n / maxProv) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-[#54D9AE] w-6 text-right">{n}</span>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-5">
            <div className="rounded-xl bg-[#06251b] border border-[#187B65]/15 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-100/50">Data adoption</div>
              <div className="text-lg font-bold text-[#54D9AE]">{active.length ? `${adoptionRate}%` : <span className="text-xs text-emerald-100/30">not tracked</span>}</div>
              <div className="text-[10px] text-emerald-100/40">{adopted} active instance{adopted === 1 ? "" : "s"} with customers</div>
            </div>
            <div className="rounded-xl bg-[#06251b] border border-[#187B65]/15 p-3">
              <div className="text-[10px] font-bold uppercase tracking-wide text-emerald-100/50">Pickup completion</div>
              <div className="text-lg font-bold text-[#54D9AE]">{pickups.length ? `${pickupCompletion}%` : <span className="text-xs text-emerald-100/30">not tracked</span>}</div>
              <div className="text-[10px] text-emerald-100/40">{donePickups} of {pickups.length} pickups done · {cancelledSubs} subs cancelled</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}