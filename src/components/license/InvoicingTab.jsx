import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Receipt, Send, CheckCircle2 } from "lucide-react";

const money = (n) => "$" + (Number(n) || 0).toLocaleString("en-CA");
const today = () => new Date().toISOString().slice(0, 10);

export default function InvoicingTab({ license, pickups, invoices, onChanged }) {
  const [amounts, setAmounts] = useState({});
  const [busyId, setBusyId] = useState(null);

  const invoiceIds = new Set(pickups.filter((p) => p.status === "completed").map((p) => p.id).filter((id) => invoices.some((i) => i.pickup_id === id)));
  const unInvoiced = pickups.filter((p) => p.status === "completed" && !invoiceIds.has(p.id));
  const invoiced = pickups.filter((p) => invoiceIds.has(p.id));

  const createInvoice = async (p) => {
    const amount = parseFloat(String(amounts[p.id] || "").replace(/[^0-9.]/g, ""));
    if (!amount || amount <= 0) return;
    setBusyId(p.id);
    await base44.entities.LicenseInvoice.create({
      license_email: license.email,
      pickup_id: p.id,
      customer_name: p.customer_name,
      amount,
      status: "draft",
      issued_date: today(),
    });
    setBusyId(null);
    onChanged();
  };

  const setStatus = async (inv, status) => {
    setBusyId(inv.id);
    await base44.entities.LicenseInvoice.update(inv.id, { status, ...(status === "paid" ? { paid_date: today() } : {}) });
    setBusyId(null);
    onChanged();
  };

  const collected = invoices.filter((i) => i.status === "paid").reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const outstanding = invoices.filter((i) => i.status === "sent" || i.status === "draft").reduce((s, i) => s + (Number(i.amount) || 0), 0);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Collected</div>
          <div className="text-2xl font-bold text-[#1d9e56] mt-1">{money(collected)}</div>
        </div>
        <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-4">
          <div className="text-xs font-bold uppercase tracking-wide text-slate-500">Outstanding</div>
          <div className="text-2xl font-bold text-[#0c3b24] mt-1">{money(outstanding)}</div>
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Ready to invoice ({unInvoiced.length})</h3>
      {unInvoiced.length === 0 ? (
        <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-6 text-center text-slate-500 text-sm">Every completed pickup is invoiced.</div>
      ) : (
        <div className="space-y-3 mb-6">
          {unInvoiced.map((p) => (
            <div key={p.id} className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-[180px]">
                <div className="font-bold text-[#0c3b24] text-sm">{p.customer_name}</div>
                <div className="text-xs text-slate-500">{p.scheduled_date} · {[p.address, p.city].filter(Boolean).join(", ")}</div>
              </div>
              <input
                value={amounts[p.id] || ""}
                onChange={(e) => setAmounts({ ...amounts, [p.id]: e.target.value })}
                className="input w-28 py-2"
                placeholder="$ Amount"
                inputMode="decimal"
              />
              <button onClick={() => createInvoice(p)} disabled={busyId === p.id} className="rounded-full bg-[#1d9e56] text-[#0c3b24] px-4 py-2 text-sm font-bold hover:bg-[#17a04c] transition-colors flex items-center gap-1.5 disabled:opacity-60">
                {busyId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />} Invoice
              </button>
            </div>
          ))}
        </div>
      )}

      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3">Invoices ({invoiced.length})</h3>
      {invoiced.length === 0 ? (
        <div className="rounded-2xl bg-[#f4f7f5] border border-slate-100 p-8 text-center text-slate-500">No invoices yet.</div>
      ) : (
        <div className="space-y-3">
          {invoiced.map((p) => {
            const inv = invoices.find((i) => i.pickup_id === p.id);
            return (
              <div key={p.id} className="rounded-2xl bg-white border border-slate-100 p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-[#0c3b24] text-sm">{inv.customer_name} <span className="ml-1 font-extrabold">{money(inv.amount)}</span></div>
                  <div className="text-xs text-slate-500 mt-0.5">Issued {inv.issued_date || "—"}{inv.paid_date ? ` · Paid ${inv.paid_date}` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${inv.status === "paid" ? "bg-[#1d9e56]/15 text-[#1d9e56]" : inv.status === "sent" ? "bg-sky-100 text-sky-700" : "bg-slate-200 text-slate-600"}`}>{inv.status}</span>
                  {inv.status === "draft" && (
                    <button onClick={() => setStatus(inv, "sent")} disabled={busyId === inv.id} className="rounded-full bg-[#0c3b24] text-[#1d9e56] px-3.5 py-1.5 text-xs font-bold flex items-center gap-1 disabled:opacity-60">
                      <Send className="w-3.5 h-3.5" /> Mark sent
                    </button>
                  )}
                  {inv.status !== "paid" && (
                    <button onClick={() => setStatus(inv, "paid")} disabled={busyId === inv.id} className="rounded-full bg-[#1d9e56]/15 text-[#1d9e56] px-3.5 py-1.5 text-xs font-bold flex items-center gap-1 disabled:opacity-60">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark paid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}