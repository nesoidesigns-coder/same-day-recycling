import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Wallet } from "lucide-react";
import { loadTenant, loadTxs, summarize } from "@/components/finance/financeShared";
import FinanceKpis from "@/components/finance/FinanceKpis";
import FinanceTrend from "@/components/finance/FinanceTrend";
import ReceiptInbox from "@/components/finance/ReceiptInbox";
import TxLedger from "@/components/finance/TxLedger";

const TYPE_LABEL = { sdr_admin: "Same Day Recycling books", contractor: "Contractor books", white_label: "White-label business", personal: "My business" };

export default function FinanceDashboard() {
  const [tenant, setTenant] = useState(null);
  const [txs, setTxs] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");

  const load = useCallback(async () => {
    try {
      const t = await loadTenant();
      setTenant(t);
      setTxs(await loadTxs(t.owner_email));
    } catch (e) {
      setError(e?.response?.data?.error || e.message || "Could not load your financial workspace.");
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) {
    return (
      <div className="min-h-screen admin-console flex items-center justify-center p-6">
        <div className="holo-panel holo-panel-deep rounded-2xl p-6 max-w-sm text-center">
          <p className="text-sm text-white/70">{error}</p>
          <Link to="/" className="mt-4 inline-block rounded-full border border-[#187B65]/40 px-4 py-2 text-xs font-bold text-[#54D9AE]">Back to site</Link>
        </div>
      </div>
    );
  }

  if (!tenant || !txs) {
    return (
      <div className="min-h-screen admin-console flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#54D9AE]" />
      </div>
    );
  }

  const s = summarize(txs);
  const recent = [...txs].sort((a, b) => (b.tx_date || "").localeCompare(a.tx_date || "")).slice(0, 8);

  return (
    <div className="min-h-screen admin-console">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-1.5 text-xs font-bold text-white/50 hover:text-[#54D9AE]"><ArrowLeft className="w-3.5 h-3.5" /> Site</Link>
          <span className="rounded-full border border-[#187B65]/40 px-3 py-1 text-[11px] font-bold text-[#54D9AE]">{TYPE_LABEL[tenant.owner_type] || "My business"}</span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <Wallet className="w-7 h-7 text-[#54D9AE]" />
          <div>
            <h1 className="admin-headline text-3xl font-bold font-heading tracking-tight holo-flicker">Financial Command</h1>
            <p className="text-sm text-white/50">{tenant.business_name} · {txs.length} transactions on record</p>
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          {[["overview", "Overview"], ["receipts", "Receipt inbox"], ["ledger", "Transactions"]].map(([k, label]) => (
            <button key={k} onClick={() => setTab(k)} className={"rounded-full px-4 py-2 text-xs font-bold transition-colors " + (tab === k ? "bg-[#187B65] text-white" : "border border-[#187B65]/40 text-white/60 hover:text-white")}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-5">
          {tab === "overview" && (
            <>
              <FinanceKpis summary={s} />
              <div className="grid lg:grid-cols-2 gap-5">
                <FinanceTrend summary={s} />
                <div className="holo-panel holo-panel-deep rounded-2xl p-4">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Recent activity</h3>
                  <div className="mt-4 space-y-3">
                    {recent.length === 0 && <p className="text-sm text-white/40">No transactions yet — scan a receipt to get started.</p>}
                    {recent.map((t) => (
                      <div key={t.id} className="flex items-center gap-3 text-sm">
                        <span className={"w-1.5 h-1.5 rounded-full shrink-0 " + (t.kind === "income" ? "bg-[#54D9AE]" : "bg-[#e2b04a]")} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-white truncate">{t.merchant || "Transaction"}</div>
                          <div className="text-[11px] text-white/40">{t.tx_date}</div>
                        </div>
                        <span className={"font-bold whitespace-nowrap " + (t.kind === "income" ? "text-[#54D9AE]" : "text-white")}>
                          {t.kind === "income" ? "+" : "−"}{("$" + (Number(t.amount) || 0).toFixed(2))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-white/40">Tax figures here are estimates for planning only — finalized tax returns are prepared by your accountant or filing integration.</p>
            </>
          )}
          {tab === "receipts" && (
            <>
              <ReceiptInbox tenant={tenant} onSaved={load} />
              {s.needsReview > 0 && (
                <button onClick={() => setTab("ledger")} className="w-full rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm font-bold text-amber-200">
                  {s.needsReview} transaction{s.needsReview === 1 ? "" : "s"} flagged for review — open the ledger
                </button>
              )}
            </>
          )}
          {tab === "ledger" && <TxLedger txs={txs} onRefresh={load} />}
        </div>
      </div>
    </div>
  );
}