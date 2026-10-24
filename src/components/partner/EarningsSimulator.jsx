import { useState } from "react";
import { Calculator, Info } from "lucide-react";

const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toLocaleString("en-CA");

// Contractor earnings simulator — clearly labelled ESTIMATES built from the
// inputs the contractor provides. No actual earnings are implied.
export default function EarningsSimulator({ defaultCommission = 25 }) {
  const [p, setP] = useState({ price: "450", commission: String(defaultCommission), disposal: "", labour: "", fuel: "", other: "", additional: "" });

  const n = (k) => Number(p[k]) || 0;
  const eligible = n("price") + n("additional");
  const commission = (eligible * n("commission")) / 100;
  const payout = Math.max(0, eligible - commission);
  const expenses = n("disposal") + n("labour") + n("fuel") + n("other");
  const contribution = payout - expenses;
  const margin = eligible > 0 ? Math.round((contribution / eligible) * 1000) / 10 : 0;

  const fields = [
    ["price", "Customer price (before tax)"],
    ["commission", "Commission % (default 25%)"],
    ["additional", "Additional-item revenue"],
    ["disposal", "Disposal / recycling cost"],
    ["labour", "Labour cost"],
    ["fuel", "Fuel cost"],
    ["other", "Other direct expenses"],
  ];

  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2"><Calculator className="w-5 h-5 text-[#187B65]" /> Earnings simulator</h2>
      <p className="text-xs text-emerald-100/50 mt-0.5 mb-4">Estimate your contribution before accepting a job. These are assumptions, not actual earnings.</p>

      <div className="rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {fields.map(([k, lbl]) => (
            <label key={k} className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#187B65]/90">
              {lbl}
              <input
                type="number" min="0" step="0.01"
                value={p[k]}
                onChange={(e) => setP({ ...p, [k]: e.target.value })}
                className="mt-1 w-full rounded-lg border border-[#187B65]/30 bg-[#051511] px-2.5 py-2 text-sm text-white"
              />
            </label>
          ))}
        </div>

        <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            ["Eligible job revenue", money(eligible), "text-white"],
            ["Platform commission", money(commission), "text-white"],
            ["Your payout", money(payout), "text-[#187B65]"],
            ["Your contribution (est.)", money(contribution), contribution >= 0 ? "text-[#187B65] holo-glow-text" : "text-red-300"],
          ].map(([l, v, tone]) => (
            <div key={l} className="rounded-xl bg-[#0a2b1e]/50 px-3 py-3">
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65]/90">{l}</div>
              <div className={`text-xl font-bold mt-1 tabular-nums ${tone}`}>{v}</div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-emerald-100/60">Contribution margin: <strong className="text-white tabular-nums">{margin}%</strong> of eligible revenue. Contractor payout = eligible revenue − commission; your contribution = payout − your direct expenses.</div>
        <div className="mt-3 rounded-xl border border-[#187B65]/25 bg-[#0a2b1e]/60 px-3 py-2 text-[11px] text-emerald-100/60 flex items-start gap-2">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[#187B65]" /> Assumptions: prices exclude sales tax; the commission rate applies to the whole eligible revenue (customer price plus additions); contractor-owned jobs are typically 0% unless your agreement says otherwise. Platform processing fees are not deducted here.
        </div>
      </div>
    </section>
  );
}