import { Building2, Users, Truck, Receipt } from "lucide-react";
import { money, statusBadge, NotTracked } from "./shared";

export default function CommandOperations({ licenses, customers, pickups, invoices }) {
  return (
    <>
      <h2 className="text-sm font-bold tracking-wide text-emerald-100/60 uppercase mb-3">Active instance operations ({licenses.filter((l) => l.status === "active").length} live)</h2>
      {licenses.length === 0 && (
        <div className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-10 text-center text-emerald-100/50">
          <Building2 className="w-8 h-8 mx-auto text-emerald-100/20" />
          <p className="mt-3">No company instances to monitor yet.</p>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        {licenses.map((c) => {
          const email = (c.email || "").toLowerCase();
          const cust = customers.filter((x) => (x.license_email || "").toLowerCase() === email);
          const picks = pickups.filter((x) => (x.license_email || "").toLowerCase() === email);
          const scheduled = picks.filter((p) => p.status === "scheduled" || p.status === "dispatched");
          const completed = picks.filter((p) => p.status === "completed");
          const openInvs = invoices.filter((x) => (x.license_email || "").toLowerCase() === email && (x.status === "draft" || x.status === "sent"));
          const openTotal = openInvs.reduce((s, i) => s + (Number(i.amount) || 0), 0);
          const hasData = cust.length + picks.length + invoices.filter((x) => (x.license_email || "").toLowerCase() === email).length > 0;
          return (
            <div key={c.id} className="holo-panel-deep rounded-2xl border border-[#187B65]/20 p-5">
              <div className="flex items-center gap-2 flex-wrap mb-4">
                <span className="font-bold text-[#54D9AE]">{c.company}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wide rounded-full px-2.5 py-0.5 ${statusBadge(c.status)}`}>{c.status}</span>
                <span className="text-[10px] font-bold uppercase tracking-wide rounded-full bg-[#102B2A] text-[#187B65] px-2.5 py-0.5 border border-[#187B65]/30">{c.plan}</span>
                {!hasData && <NotTracked label="no ops data yet" />}
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-[#06251b] border border-[#187B65]/15 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100/50"><Users className="w-3 h-3 text-[#187B65]" /> Customers</div>
                  <div className="text-lg font-bold text-[#54D9AE] mt-1">{cust.length || <span className="text-xs text-emerald-100/30">not tracked</span>}</div>
                </div>
                <div className="rounded-xl bg-[#06251b] border border-[#187B65]/15 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100/50"><Truck className="w-3 h-3 text-[#187B65]" /> Pickups</div>
                  <div className="text-lg font-bold text-[#54D9AE] mt-1">{picks.length ? <>{scheduled.length} <span className="text-xs text-emerald-100/40 font-medium">open · {completed.length} done</span></> : <span className="text-xs text-emerald-100/30">not tracked</span>}</div>
                </div>
                <div className="rounded-xl bg-[#06251b] border border-[#187B65]/15 p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-100/50"><Receipt className="w-3 h-3 text-[#187B65]" /> Invoices</div>
                  <div className="text-lg font-bold text-[#54D9AE] mt-1">{openInvs.length ? <>{openInvs.length} <span className="text-xs text-emerald-100/40 font-medium">· {money(openTotal)}</span></> : <span className="text-xs text-emerald-100/30">not tracked</span>}</div>
                </div>
              </div>
              {picks.length > 0 && (
                <div className="mt-3 h-2 rounded-full bg-[#187B65]/10 overflow-hidden">
                  <div className="h-full rounded-full bg-[#187B65] network-pulse" style={{ width: `${Math.round((completed.length / picks.length) * 100)}%` }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}