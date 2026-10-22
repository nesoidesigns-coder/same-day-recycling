import { useState, useMemo } from "react";
import { Landmark, Info } from "lucide-react";

const TAX_KEYS = ["gst", "hst", "pst", "qst"];
const TAX_LABEL = { gst: "GST", hst: "HST", pst: "PST", qst: "QST" };
const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);
const labelCls = "text-[11px] uppercase tracking-wider font-semibold text-white/50";
const cardCls = "holo-panel holo-panel-deep rounded-2xl p-4";

function inPeriod(t, period) {
  const d = t.tx_date || "";
  if (period === "all") return true;
  if (period === "ytd") return d >= new Date().getFullYear() + "-01-01";
  // ltm: last 12 months
  const cutoff = new Date(Date.now() - 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  return d >= cutoff;
}

function computeTaxes(txs) {
  const collected = { gst: 0, hst: 0, pst: 0, qst: 0 };
  const paid = { gst: 0, hst: 0, pst: 0, qst: 0 };
  const byJurisdiction = {};
  const byQuarter = {};
  for (const t of txs) {
    const td = t.tax_detail || {};
    const target = t.kind === "income" ? collected : paid;
    const j = t.tax_jurisdiction || "Unspecified";
    const byJ = byJurisdiction[j] || (byJurisdiction[j] = { collected: 0, paid: 0 });
    const q = (t.tx_date || "").slice(0, 4) + "-Q" + (Math.floor((Number((t.tx_date || "").slice(5, 7)) - 1) / 3) + 1);
    const byQ = byQuarter[q] || (byQuarter[q] = { collected: 0, paid: 0 });
    for (const k of TAX_KEYS) {
      const v = Number(td[k]) || 0;
      if (!v) continue;
      target[k] += v;
      byJ.collected += t.kind === "income" ? v : 0;
      byJ.paid += t.kind === "expense" ? v : 0;
      byQ.collected += t.kind === "income" ? v : 0;
      byQ.paid += t.kind === "expense" ? v : 0;
    }
  }
  return { collected, paid, byJurisdiction, byQuarter };
}

export default function TaxCentre({ txs }) {
  const [period, setPeriod] = useState("ytd");
  const scoped = useMemo(() => (txs || []).filter((t) => inPeriod(t, period)), [txs, period]);
  const { collected, paid, byJurisdiction, byQuarter } = useMemo(() => computeTaxes(scoped), [scoped]);

  const totalCollected = TAX_KEYS.reduce((s, k) => s + collected[k], 0);
  const totalPaid = TAX_KEYS.reduce((s, k) => s + paid[k], 0);
  const net = totalCollected - totalPaid;
  const quarters = Object.keys(byQuarter).sort();

  return (
    <div className="holo-panel holo-panel-deep rounded-2xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Landmark className="w-5 h-5 text-[#54D9AE]" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Tax Centre</h3>
        </div>
        <div className="flex gap-1.5">
          {[["ytd", "This year"], ["ltm", "Last 12 months"], ["all", "All time"]].map(([k, label]) => (
            <button key={k} onClick={() => setPeriod(k)} className={"rounded-full px-3 py-1.5 text-xs font-bold " + (period === k ? "bg-[#187B65] text-white" : "border border-[#187B65]/40 text-white/70")}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-[#187B65]/30 bg-black/30 p-3">
          <div className={labelCls}>Sales tax collected</div>
          <div className="mt-1 text-2xl font-bold text-white">{money(totalCollected)}</div>
          <div className="mt-0.5 text-[11px] text-white/40">On income entries — your estimated remittance pool</div>
        </div>
        <div className="rounded-xl border border-[#187B65]/30 bg-black/30 p-3">
          <div className={labelCls}>Sales tax paid</div>
          <div className="mt-1 text-2xl font-bold text-white">{money(totalPaid)}</div>
          <div className="mt-0.5 text-[11px] text-white/40">On expense entries — potentially recoverable if you are GST/HST registered</div>
        </div>
        <div className="rounded-xl border border-[#187B65]/30 bg-black/30 p-3">
          <div className={labelCls}>Estimated net tax</div>
          <div className={"mt-1 text-2xl font-bold " + (net >= 0 ? "text-[#54D9AE]" : "text-[#e2b04a]")}>{money(net)}</div>
          <div className="mt-0.5 text-[11px] text-white/40">Collected minus paid — rough picture of what you owe back</div>
        </div>
      </div>

      <div className="mt-5">
        <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">By tax type</h4>
        <table className="mt-2 w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] text-white/40 uppercase tracking-wider">
              <th className="py-1.5 pr-2">Tax</th>
              <th className="py-1.5 pr-2 text-right">Collected</th>
              <th className="py-1.5 pr-2 text-right">Paid</th>
              <th className="py-1.5 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {TAX_KEYS.map((k) => (
              <tr key={k} className="border-t border-white/10 text-white">
                <td className="py-2 pr-2 font-bold">{TAX_LABEL[k]}</td>
                <td className="py-2 pr-2 text-right">{money(collected[k])}</td>
                <td className="py-2 pr-2 text-right">{money(paid[k])}</td>
                <td className="py-2 text-right font-bold text-[#54D9AE]">{money(collected[k] - paid[k])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {quarters.length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">By quarter</h4>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-white/40 uppercase tracking-wider">
                <th className="py-1.5 pr-2">Quarter</th>
                <th className="py-1.5 pr-2 text-right">Collected</th>
                <th className="py-1.5 pr-2 text-right">Paid</th>
                <th className="py-1.5 text-right">Net</th>
              </tr>
            </thead>
            <tbody>
              {quarters.map((q) => {
                const c = byQuarter[q];
                return (
                  <tr key={q} className="border-t border-white/10 text-white">
                    <td className="py-2 pr-2 font-bold">{q}</td>
                    <td className="py-2 pr-2 text-right">{money(c.collected)}</td>
                    <td className="py-2 pr-2 text-right">{money(c.paid)}</td>
                    <td className="py-2 text-right font-bold text-[#54D9AE]">{money(c.collected - c.paid)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {Object.keys(byJurisdiction).length > 0 && (
        <div className="mt-5">
          <h4 className="text-xs font-bold text-white/70 uppercase tracking-wider">By province</h4>
          <table className="mt-2 w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] text-white/40 uppercase tracking-wider">
                <th className="py-1.5 pr-2">Jurisdiction</th>
                <th className="py-1.5 pr-2 text-right">Collected</th>
                <th className="py-1.5 text-right">Paid</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(byJurisdiction).sort((a, b) => b[1].collected - a[1].collected).map(([j, c]) => (
                <tr key={j} className="border-t border-white/10 text-white">
                  <td className="py-2 pr-2 font-bold">{j}</td>
                  <td className="py-2 pr-2 text-right">{money(c.collected)}</td>
                  <td className="py-2 text-right">{money(c.paid)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {scoped.length === 0 && (
        <p className="mt-4 text-sm text-white/40">No transactions in this period — scan receipts in the inbox to build up your tax picture.</p>
      )}

      <div className="mt-5 flex items-start gap-1.5 rounded-xl border border-white/10 bg-black/20 px-3 py-2.5 text-[11px] text-white/50">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#54D9AE]" />
        <span>These figures are estimates computed only from your ledger entries for planning purposes. Actual remittances depend on your GST/HST registration status, filing method and eligibility for input tax credits — confirm with your accountant before filing. Nothing here has been filed with the CRA.</span>
      </div>
    </div>
  );
}