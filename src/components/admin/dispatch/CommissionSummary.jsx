const money = (n) => "$" + (Math.round((Number(n) || 0) * 100) / 100).toFixed(2);

export default function CommissionSummary({ bookings }) {
  const referralJobs = bookings.filter((b) => b.referred_by_admin);
  const estimated = bookings.reduce((s, b) => s + (Number(b.job_value) || 0), 0);
  const invoiced = bookings.reduce((s, b) => s + (Number(b.final_invoice) || 0), 0);
  const earned = bookings.reduce((s, b) => s + (Number(b.commission_earned) || 0), 0);
  const paid = bookings.reduce((s, b) => s + (Number(b.commission_paid) || 0), 0);
  const outstanding = Math.max(0, earned - paid);

  const cells = [
    { label: "Estimated value", value: money(estimated), sub: `${bookings.length} jobs listed` },
    { label: "Final invoices", value: money(invoiced), sub: "completed jobs" },
    { label: "Commission earned", value: money(earned), sub: `${referralJobs.length} referral job${referralJobs.length === 1 ? "" : "s"}` },
    { label: "Commission paid", value: money(paid), sub: "paid out" },
    { label: "Outstanding", value: money(outstanding), sub: "earned − paid" },
  ];

  return (
    <div className="rounded-2xl bg-white border border-slate-200/70 shadow-sm p-4">
      <h3 className="text-sm font-bold uppercase tracking-[0.15em] text-[#102B2A] mb-3">Referral commission — filtered jobs</h3>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {cells.map((c) => (
          <div key={c.label} className="rounded-xl bg-[#f6f8f7] p-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.label}</div>
            <div className={`text-lg font-bold ${c.label === "Outstanding" && outstanding > 0 ? "text-amber-600" : "text-[#102B2A]"}`}>{c.value}</div>
            <div className="text-[10px] text-slate-400">{c.sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}