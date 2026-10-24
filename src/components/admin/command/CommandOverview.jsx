import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Loader2, Users, UserPlus, DollarSign, Target, BadgeCheck } from "lucide-react";

const money = (n) => "$" + Math.round(Number(n) || 0).toLocaleString("en-CA");

function MetricCard({ icon: Icon, title, rows, footer }) {
  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5">
      <h3 className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500 mb-3 inline-flex items-center gap-2">
        <Icon className="w-3.5 h-3.5 text-[#187B65]" /> {title}
      </h3>
      <div className="space-y-2.5 text-sm">
        {rows.map((r) => (
          <div key={r.label} className="flex justify-between">
            <span className="text-slate-600">{r.label}</span>
            <span className={`font-bold ${r.accent ? "text-[#187B65]" : "text-[#102B2A]"}`}>{r.value}</span>
          </div>
        ))}
      </div>
      {footer}
    </div>
  );
}

// Combined business overview: both funnels side by side, then the money view.
// Every number is observed from records; estimates and recommendations are
// labelled separately in their own dashboards, never blended here.
export default function CommandOverview({ days }) {
  const [consumer, setConsumer] = useState(null);
  const [contractor, setContractor] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let live = true;
    setConsumer(null);
    setContractor(null);
    setError(null);
    Promise.all([
      base44.functions.invoke("conversionFunnel", { days }).then((r) => r.data),
      base44.functions.invoke("marketingCommand", { days }).then((r) => r.data),
    ])
      .then(([c, k]) => { if (live) { setConsumer(c); setContractor(k); } })
      .catch((e) => { if (live) setError(e.message); });
    return () => { live = false; };
  }, [days]);

  if (error) {
    return <div className="mt-6 rounded-2xl bg-white border border-red-200 px-5 py-4 text-sm text-red-700">{error}</div>;
  }
  if (!consumer || !contractor) {
    return <div className="flex items-center justify-center py-20 text-slate-500"><Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading combined overview…</div>;
  }

  const stage = (list, key) => list.find((s) => s.stage === key);

  return (
    <div className="mt-6">
      <div className="grid md:grid-cols-2 gap-4">
        <MetricCard
          icon={Users}
          title="Consumer funnel (observed)"
          rows={[
            { label: "Visitor sessions", value: consumer.funnel.visits.visitor_sessions },
            { label: "Quote requests", value: consumer.funnel.quote_leads.current },
            { label: "Confirmed bookings", value: consumer.funnel.confirmed.current },
            { label: "Completed jobs", value: consumer.funnel.completed.current },
            { label: "Quote → booking rate", value: consumer.rates.lead_to_booking_pct === null ? "—" : `${consumer.rates.lead_to_booking_pct}%`, accent: true },
          ]}
          footer={
            <Link to="/admin/conversion" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65] hover:underline">
              Full consumer funnel →
            </Link>
          }
        />
        <MetricCard
          icon={UserPlus}
          title="Contractor funnel (observed)"
          rows={[
            { label: "Discovery sessions", value: stage(contractor.contractor_funnel, "discovery")?.current ?? 0 },
            { label: "Applications (window)", value: stage(contractor.contractor_funnel, "application")?.current ?? 0 },
            { label: "Verified contractors", value: contractor.partners.verified },
            { label: "Activated (completed a job)", value: contractor.partners.activated, accent: true },
            { label: "Completed jobs (window)", value: contractor.jobs.completed_current },
          ]}
          footer={
            <Link to="/admin/contractor-acquisition" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65] hover:underline">
              Contractor acquisition detail →
            </Link>
          }
        />
      </div>

      <div className="mt-4 grid md:grid-cols-3 gap-4">
        <MetricCard
          icon={DollarSign}
          title="Revenue (verified)"
          rows={[
            { label: "Completed job value", value: money(contractor.money.completed_job_value) },
            { label: "Commission earned", value: money(contractor.money.commission_earned), accent: true },
            { label: "Recurring software / mo", value: money(contractor.money.software_recurring_monthly) },
            { label: "Setup fees collected", value: money(contractor.money.software_setup_collected) },
          ]}
        />
        <MetricCard
          icon={Target}
          title="Marketing spend (recorded)"
          rows={[
            { label: "This window", value: money(contractor.money.marketing_expense_current) },
            { label: "Previous window", value: money(contractor.money.marketing_expense_previous) },
          ]}
          footer={<p className="mt-3 text-[11px] text-slate-500">Only expenses booked under "marketing" in the financial records. Unrecorded spend is never estimated.</p>}
        />
        <MetricCard
          icon={BadgeCheck}
          title="Where estimates live"
          rows={[
            { label: "Observed results", value: "This page + funnel tabs" },
            { label: "Market projections", value: "Rex estimate, labelled" },
            { label: "AI recommendations", value: "Growth & Business Master" },
          ]}
          footer={
            <Link to="/admin/growth" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-[#187B65] hover:underline">
              Growth Intelligence →
            </Link>
          }
        />
      </div>

      <p className="mt-4 text-[11px] text-slate-500">
        Bots, owner testing, unclassified traffic, cancelled requests and internal test records are excluded everywhere above.
        {consumer.tests.current > 0 && ` ${consumer.tests.current} internal test booking(s) in this window are visible in the conversion dashboard and never counted.`}
      </p>
    </div>
  );
}