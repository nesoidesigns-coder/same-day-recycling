import { TrendingUp, TrendingDown, Landmark, ReceiptText, Clock, FileSearch } from "lucide-react";
import { fmtCAD } from "./financeShared";

const CARDS = (s) => [
  { label: "Total revenue", value: fmtCAD(s.revenue), icon: TrendingUp, cls: "text-[#54D9AE]" },
  { label: "Total expenses", value: fmtCAD(s.expenses), icon: TrendingDown, cls: "text-amber-300" },
  { label: "Net profit", value: fmtCAD(s.net), icon: Landmark, cls: s.net >= 0 ? "text-[#54D9AE]" : "text-red-400" },
  { label: "Taxes collected & paid", value: fmtCAD(s.taxes), icon: ReceiptText, cls: "text-white" },
  { label: "Outstanding", value: fmtCAD(s.outstanding), icon: Clock, cls: "text-amber-300" },
  { label: "Receipts attached", value: s.receiptRate + "%", icon: FileSearch, cls: s.receiptRate >= 80 ? "text-[#54D9AE]" : "text-amber-300", sub: s.needsReview ? s.needsReview + " need review" : "" },
];

export default function FinanceKpis({ summary }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {CARDS(summary).map((c) => (
        <div key={c.label} className="relative overflow-hidden holo-panel holo-panel-deep rounded-2xl p-4">
          <c.icon className={"w-4 h-4 " + c.cls} />
          <div className={"mt-2 text-xl font-bold font-heading tracking-tight " + c.cls}>{c.value}</div>
          <div className="text-[11px] uppercase tracking-wider text-white/50 font-semibold mt-1">{c.label}</div>
          {c.sub && <div className="text-[11px] text-amber-300 mt-1">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}