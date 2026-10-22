import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Download, Paperclip, AlertTriangle, CheckCircle2, FileText } from "lucide-react";
import { CATEGORIES, categoryLabel, fmtCAD, receiptUrl, exportCsv } from "./financeShared";

const KINDS = [{ value: "all", label: "All" }, { value: "expense", label: "Expenses" }, { value: "income", label: "Income" }];

export default function TxLedger({ txs, onRefresh }) {
  const [kind, setKind] = useState("all");
  const [category, setCategory] = useState("all");
  const [reviewOnly, setReviewOnly] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [receipts, setReceipts] = useState({});

  const filtered = txs.filter((t) =>
    (kind === "all" || t.kind === kind) &&
    (category === "all" || t.category === category) &&
    (!reviewOnly || t.needs_review)
  );

  const patch = async (t, changes) => {
    setBusyId(t.id);
    try {
      await base44.functions.invoke("financeIngest", { action: "update", id: t.id, changes });
      onRefresh();
    } finally { setBusyId(""); }
  };

  const openReceipt = async (t) => {
    if (receipts[t.id]) return window.open(receipts[t.id], "_blank");
    const url = await receiptUrl(t.receipt_uri);
    if (url) { setReceipts((r) => ({ ...r, [t.id]: url })); window.open(url, "_blank"); }
  };

  const doExport = async () => {
    const csv = exportCsv(filtered);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "transactions-" + new Date().toISOString().slice(0, 10) + ".csv";
    a.click();
    URL.revokeObjectURL(a.href);
    base44.functions.invoke("financeIngest", { action: "log_export", row_count: filtered.length }).catch(() => {});
  };

  const selCls = "rounded-xl bg-black/30 border border-[#187B65]/30 px-2.5 py-1.5 text-xs text-white focus:border-[#54D9AE] focus:outline-none";

  return (
    <div className="holo-panel holo-panel-deep rounded-2xl p-5">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">Transaction ledger</h3>
        <div className="flex flex-wrap items-center gap-2">
          <select value={kind} onChange={(e) => setKind(e.target.value)} className={selCls}>{KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}</select>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={selCls}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <button onClick={() => setReviewOnly(!reviewOnly)} className={"rounded-xl px-3 py-1.5 text-xs font-bold " + (reviewOnly ? "bg-amber-500/20 text-amber-300 border border-amber-400/40" : "border border-white/20 text-white/60")}>
            Needs review{reviewOnly ? "" : ` (${txs.filter((t) => t.needs_review).length})`}
          </button>
          <button onClick={doExport} className="flex items-center gap-1.5 rounded-xl border border-[#187B65]/40 px-3 py-1.5 text-xs font-bold text-[#54D9AE]"><Download className="w-3.5 h-3.5" /> CSV</button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-white/40">
              <th className="py-2 pr-3">Date</th><th className="pr-3">Merchant / payer</th><th className="pr-3">Category</th>
              <th className="pr-3 text-right">Amount</th><th className="pr-3">Status</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((t) => (
              <tr key={t.id} className="border-t border-white/10">
                <td className="py-2.5 pr-3 text-white/70 whitespace-nowrap">{t.tx_date}</td>
                <td className="pr-3 text-white">
                  <span className="font-semibold">{t.merchant || "—"}</span>
                  {t.description && <span className="block text-[11px] text-white/40">{t.description}</span>}
                  {t.source === "platform_job" && <span className="inline-block mt-0.5 text-[10px] font-bold text-[#54D9AE] bg-[#187B65]/20 rounded-full px-2 py-0.5">SDR job</span>}
                  {t.needs_review && <span className="inline-flex items-center gap-1 mt-0.5 ml-1 text-[10px] font-bold text-amber-300 bg-amber-500/15 rounded-full px-2 py-0.5"><AlertTriangle className="w-2.5 h-2.5" /> review</span>}
                </td>
                <td className="pr-3">
                  <select value={t.category} onChange={(e) => patch(t, { category: e.target.value, needs_review: false })} disabled={busyId === t.id}
                    className="rounded-lg bg-black/30 border border-white/10 px-2 py-1 text-xs text-white focus:border-[#54D9AE] focus:outline-none">
                    {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </td>
                <td className={"pr-3 text-right font-bold whitespace-nowrap " + (t.kind === "income" ? "text-[#54D9AE]" : "text-white")}>{t.kind === "income" ? "+" : "−"}{fmtCAD(t.amount)}</td>
                <td className="pr-3">
                  <select value={t.status} onChange={(e) => patch(t, { status: e.target.value })} disabled={busyId === t.id}
                    className="rounded-lg bg-black/30 border border-white/10 px-2 py-1 text-xs text-white focus:border-[#54D9AE] focus:outline-none">
                    {["paid", "outstanding", "refunded", "disputed"].map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="pr-1">
                  {t.receipt_uri && (
                    <button onClick={() => openReceipt(t)} aria-label="Open receipt" className="text-white/50 hover:text-[#54D9AE]">
                      {receipts[t.id] ? <FileText className="w-4 h-4" /> : <Paperclip className="w-4 h-4" />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="py-8 text-center text-sm text-white/40">
            {txs.length === 0 ? "No transactions yet — scan your first receipt above." : "Nothing matches these filters."}
          </div>
        )}
      </div>
    </div>
  );
}