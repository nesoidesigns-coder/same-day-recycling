import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowUpRight, Building2, Loader2, Truck, Users } from "lucide-react";
import { loadDualMarket } from "@/lib/dualMarket";

// Two connected businesses on one screen. Every figure is a recorded value;
// where a record type is empty the panel says so instead of showing a zero as
// if it were a measurement. Gross job value (the contractor's money) is never
// added to platform revenue — only commission and collected fees count.

const money = (n) =>
  n === null || n === undefined ? "—" : "$" + (Number(n) || 0).toLocaleString("en-CA", { maximumFractionDigits: 0 });
const pct = (n) => (n === null || n === undefined ? "—" : `${n}%`);
const num = (n) => (n === null || n === undefined ? "—" : Number(n).toLocaleString("en-CA"));

function Row({ label, value, sub, strong }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-li-steel/60 py-2 last:border-0">
      <div>
        <p className={`text-sm ${strong ? "font-bold text-li-carbon" : "font-semibold text-li-slate"}`}>{label}</p>
        {sub && <p className="text-[11px] text-li-slate">{sub}</p>}
      </div>
      <span className={`shrink-0 tabular-nums text-right ${strong ? "text-lg font-bold text-li-carbon" : "text-sm font-bold text-li-carbon"}`}>{value}</span>
    </div>
  );
}

function Notes({ items }) {
  if (!items?.length) return null;
  return (
    <ul className="mt-3 space-y-1 rounded-xl bg-ri-amber/10 px-3 py-2">
      {items.map((n) => (
        <li key={n} className="flex gap-1.5 text-[11px] font-semibold leading-snug text-ri-amber-ink">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
          {n}
        </li>
      ))}
    </ul>
  );
}

export default function DualMarketOverview() {
  const [data, setData] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    loadDualMarket()
      .then(setData)
      .catch(() => setFailed(true));
  }, []);

  if (failed) {
    return <p className="rounded-2xl border border-li-steel bg-white p-5 text-sm font-semibold text-li-slate">Both-business summary could not be loaded.</p>;
  }
  if (!data) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-li-steel bg-white p-5 text-sm text-li-slate">
        <Loader2 className="h-4 w-4 animate-spin text-li-infra" /> Reading service and contractor records…
      </div>
    );
  }

  const { service, contractor, combined, attention } = data;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-li-carbon">Two businesses, one platform</h2>
          <p className="font-plex text-xs text-li-slate">Service customers buying removal work · contractor customers buying the platform</p>
        </div>
        <Link to="/admin/all-pages" className="text-xs font-bold text-li-infra hover:underline">Page directory</Link>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {/* Market A */}
        <article className="rounded-2xl border border-li-steel bg-white p-4">
          <header className="mb-2 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-li-mint/30 text-li-forest"><Users className="h-4 w-4" /></span>
            <div>
              <h3 className="text-sm font-bold text-li-carbon">Service business</h3>
              <p className="font-plex text-[10px] uppercase tracking-[0.14em] text-li-slate">Customers buying removal & recycling</p>
            </div>
            <Link to="/admin/jobs" className="ml-auto text-li-slate hover:text-li-infra" aria-label="Open jobs"><ArrowUpRight className="h-4 w-4" /></Link>
          </header>
          <Row label="Qualified inquiries" value={num(service.qualifiedInquiries)} sub={`${num(service.requests)} service requests · ${num(service.bookings)} bookings`} strong />
          <Row label="Bookings" value={num(service.bookings)} sub={`${num(service.activeJobs)} still active`} />
          <Row label="Completed jobs" value={num(service.completedJobs)} sub={`${num(service.cancelledJobs)} cancelled`} />
          <Row label="Gross job value" value={money(service.grossJobValue)} sub="Customer price — contractor's money, not platform revenue" />
          <Row label="Platform commission" value={money(service.commissionEarned)} sub="Retained by the platform from completed jobs" />
          <Row label="Conversion" value={pct(service.conversionRate)} sub="Inbound demand that became a booking" />
          <Row label="Business pickup plans" value={num(service.businessPlans)} sub="Recurring plans held by businesses" />
          <Notes items={service.notes} />
        </article>

        {/* Market B */}
        <article className="rounded-2xl border border-li-steel bg-white p-4">
          <header className="mb-2 flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-ri-sky text-li-forest"><Building2 className="h-4 w-4" /></span>
            <div>
              <h3 className="text-sm font-bold text-li-carbon">Contractor software business</h3>
              <p className="font-plex text-[10px] uppercase tracking-[0.14em] text-li-slate">Operators buying Recycling OS</p>
            </div>
            <Link to="/admin/software" className="ml-auto text-li-slate hover:text-li-infra" aria-label="Open software customers"><ArrowUpRight className="h-4 w-4" /></Link>
          </header>
          <Row label="Contractor accounts" value={num(contractor.accounts)} sub={`${num(contractor.payingAccounts)} have paid for activation or a plan`} strong />
          <Row label="Active subscriptions" value={num(contractor.activeSubscriptions)} sub={`${num(contractor.cancelled)} cancelled`} />
          <Row label="Monthly recurring revenue" value={money(contractor.mrr)} sub="Active plans only — a run-rate, not cash received" />
          <Row label="Activation revenue" value={money(contractor.activationRevenue)} sub="Setup fees on paid licences" />
          <Row label="Average revenue per contractor" value={money(contractor.arpc)} sub="MRR ÷ active subscriptions" />
          <Row label="Churn" value={pct(contractor.churnRate)} sub="Cancelled licences of all licences" />
          <Row label="Contractor acquisition" value={num(contractor.acquisitionApplications)} sub={`${num(contractor.partners)} accounts · ${num(contractor.verifiedPartners)} verified to fulfil`} />
          <Notes items={contractor.notes} />
        </article>
      </div>

      {/* Combined */}
      <article className="rounded-2xl border border-li-steel bg-li-forest p-4 text-white">
        <header className="mb-2 flex items-center gap-2">
          <Truck className="h-4 w-4 text-li-mint" />
          <h3 className="text-sm font-bold">Combined platform</h3>
        </header>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="font-plex text-[10px] uppercase tracking-[0.14em] text-li-mint">Recognised platform revenue</p>
            <p className="text-xl font-bold tabular-nums">{money(combined.realisedRevenue)}</p>
            <p className="text-[10px] text-li-mint/80">Commission + activation fees, never gross job value</p>
          </div>
          <div>
            <p className="font-plex text-[10px] uppercase tracking-[0.14em] text-li-mint">Recurring run-rate</p>
            <p className="text-xl font-bold tabular-nums">{money(combined.mrr)}</p>
            <p className="text-[10px] text-li-mint/80">Monthly, active subscriptions only</p>
          </div>
          <div>
            <p className="font-plex text-[10px] uppercase tracking-[0.14em] text-li-mint">Gross transaction value</p>
            <p className="text-xl font-bold tabular-nums">{money(combined.grossTransactionValue)}</p>
            <p className="text-[10px] text-li-mint/80">Full job price, shown apart from revenue</p>
          </div>
          <div>
            <p className="font-plex text-[10px] uppercase tracking-[0.14em] text-li-mint">Customers & organisations</p>
            <p className="text-xl font-bold tabular-nums">{num(combined.serviceCustomers)} · {num(combined.organizations)}</p>
            <p className="text-[10px] text-li-mint/80">Service customers · contractor organisations</p>
          </div>
        </div>
        <div className="mt-3 grid gap-2 border-t border-white/15 pt-3 sm:grid-cols-3">
          <p className="text-xs"><span className="font-plex text-[10px] uppercase tracking-[0.14em] text-li-mint">Service coverage</span><br /><span className="font-bold">{num(combined.coverageCities)} cities</span></p>
          <p className="text-xs"><span className="font-plex text-[10px] uppercase tracking-[0.14em] text-li-mint">Contractor capacity</span><br /><span className="font-bold">{num(combined.capacity)} trucks verified</span></p>
          <p className="text-xs"><span className="font-plex text-[10px] uppercase tracking-[0.14em] text-li-mint">Demand vs capacity</span><br /><span className="font-bold">{combined.demandToCapacity}</span></p>
        </div>
      </article>

      {attention.length > 0 && (
        <article className="rounded-2xl border border-li-steel bg-white p-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-li-carbon">
            <AlertTriangle className="h-4 w-4 text-ri-amber" /> Needs attention
          </h3>
          <ul className="divide-y divide-li-steel/60">
            {attention.map((a) => (
              <li key={`${a.name}-${a.reason}`} className="py-2">
                <Link to={a.href} className="flex items-baseline justify-between gap-3 hover:text-li-infra">
                  <span className="text-sm font-bold text-li-carbon">{a.name}</span>
                  <span className="text-right text-[11px] text-li-slate">{a.reason} · {a.detail}</span>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      )}
    </section>
  );
}