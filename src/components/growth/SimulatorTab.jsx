import { useMemo, useState } from "react";
import { Section, money } from "./growthShared";

const FIELDS = [
  ["contractors", "Paying contractors", 20, 0, 500],
  ["avgTier", "Average tier rate ($/mo)", 349, 0, 999],
  ["collection", "Monthly collection rate %", 90, 0, 100],
  ["opex", "Monthly operating expenses ($)", 800, 0, 50000],
  ["allocation", "Advertising allocation %", 25, 0, 100],
  ["contributions", "Optional contractor contributions ($/mo)", 0, 0, 100000],
  ["cpl", "Cost per qualified lead ($)", 35, 1, 500],
  ["leadBooking", "Lead → booking rate %", 30, 1, 100],
  ["bookingComplete", "Booking → completion rate %", 85, 1, 100],
  ["jobValue", "Average completed job value ($)", 450, 1, 5000],
  ["commission", "Platform commission %", 25, 0, 100],
];

export default function SimulatorTab() {
  const [v, setV] = useState(Object.fromEntries(FIELDS.map(([k, , d]) => [k, d])));
  const r = useMemo(() => {
    const n = (k) => Number(v[k]) || 0;
    const grossMrr = n("contractors") * n("avgTier");
    const collected = grossMrr * (n("collection") / 100);
    const afterOpex = Math.max(0, collected - n("opex"));
    const budget = Math.max(0, afterOpex * (n("allocation") / 100) + n("contributions"));
    const leads = n("cpl") > 0 ? budget / n("cpl") : 0;
    const bookings = leads * (n("leadBooking") / 100);
    const completed = bookings * (n("bookingComplete") / 100);
    const contractorRevenue = completed * n("jobValue");
    const commission = contractorRevenue * (n("commission") / 100);
    const net = afterOpex + commission - budget;
    return { grossMrr, collected, afterOpex, budget, leads, bookings, completed, contractorRevenue, commission, net };
  }, [v]);

  const out = (label, value, sub) => (
    <div className="rounded-xl border border-slate-200 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#102B2A]">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      <Section title="Network Growth Simulator" note="All figures are projections from the assumptions you set — never actual or promised revenue. Every assumption is editable.">
        <div className="grid gap-3 md:grid-cols-4">
          {FIELDS.map(([key, label]) => (
            <label key={key} className="text-xs font-semibold text-[#102B2A]">{label}
              <input type="number" min="0" value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} className="input mt-1" />
            </label>
          ))}
        </div>
        <h4 className="mt-5 text-sm font-bold text-[#102B2A]">Projected outputs (estimates only)</h4>
        <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {out("Gross subscription MRR", money(r.grossMrr))}
          {out("Collected MRR", money(r.collected), `${v.collection}% collection`)}
          {out("After operating costs", money(r.afterOpex), money(v.opex) + " expenses")}
          {out("Available marketing budget", money(r.budget), `${v.allocation}% allocation + contributions`, "accent")}
          {out("Qualified leads /mo", Math.round(r.leads).toLocaleString(), money(v.cpl) + " per lead")}
          {out("Projected bookings /mo", Math.round(r.bookings).toLocaleString(), `${v.leadBooking}% of leads`)}
          {out("Completed jobs /mo", Math.round(r.completed).toLocaleString(), `${v.bookingComplete}% of bookings`)}
          {out("Projected platform commission", money(r.commission), `of ${money(r.contractorRevenue)} contractor revenue`)}
        </div>
        <p className="mt-4 rounded-lg bg-brand-softmint/50 px-3 py-2 text-sm text-[#102B2A]">
          Projected monthly contribution after marketing and operating costs: <b>{money(r.net)}</b> — a planning estimate, not a forecast or authorization to spend.
        </p>
      </Section>
    </div>
  );
}