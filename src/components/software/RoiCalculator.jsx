import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, TrendingUp, Clock, PiggyBank, CheckCircle2 } from "lucide-react";

// Conservative, clearly-stated assumptions — nothing here is a promised result.
const ASSUMPTIONS = {
  adminTimeSaved: 0.6,     // share of admin hours automated by scheduling, dispatch and invoicing tools
  recoveredJobs: 0.1,      // share of monthly jobs won back via automated follow-ups and faster quoting
  defaultWage: 30,         // CAD/hour cost of the admin hours
};

const CAD = (n) => "$" + Math.round(n).toLocaleString("en-CA");

function Slider({ label, min, max, value, onChange, format }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <label className="text-sm font-semibold text-emerald-100/80">{label}</label>
        <span className="text-sm font-extrabold text-[#54D9AE]">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#187B65] cursor-pointer"
      />
    </div>
  );
}

function ResultCard({ icon: Icon, label, value, sub }) {
  return (
    <div className="holo-panel-deep rounded-2xl border border-[#187B65]/25 p-5">
      <Icon className="w-5 h-5 text-[#187B65] mb-2" />
      <div className="text-2xl font-extrabold text-[#54D9AE] holo-glow-text">{value}</div>
      <div className="text-xs text-emerald-100/60 mt-1">{sub}</div>
      <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-emerald-100/40 mt-2">{label}</div>
    </div>
  );
}

export default function RoiCalculator() {
  const [jobs, setJobs] = useState(40);
  const [avgValue, setAvgValue] = useState(350);
  const [adminHours, setAdminHours] = useState(15);
  const [wage, setWage] = useState(ASSUMPTIONS.defaultWage);

  const r = useMemo(() => {
    const jobsPerMonth = jobs * 4.33;
    const hoursSavedPerMonth = adminHours * 4.33 * ASSUMPTIONS.adminTimeSaved;
    const adminSaved = hoursSavedPerMonth * wage;
    const recoveredRevenue = jobsPerMonth * avgValue * ASSUMPTIONS.recoveredJobs;
    const totalBenefit = adminSaved + recoveredRevenue;

    const plan = jobs < 40 ? "starter" : jobs <= 120 ? "growth" : "network";
    const fees = { starter: { setup: 2500, monthly: 199, name: "Starter" }, growth: { setup: 4500, monthly: 399, name: "Growth" }, network: { setup: 9500, monthly: 799, name: "Network" } };
    const fee = fees[plan];
    const netMonthly = totalBenefit - fee.monthly;
    const roiMultiple = fee.monthly > 0 ? totalBenefit / fee.monthly : 0;
    const setupPaybackMonths = netMonthly > 0 ? fee.setup / netMonthly : null;
    const firstYearNet = netMonthly * 12 - fee.setup;

    return { jobsPerMonth, hoursSavedPerMonth, adminSaved, recoveredRevenue, totalBenefit, plan, fee, netMonthly, roiMultiple, setupPaybackMonths, firstYearNet };
  }, [jobs, avgValue, adminHours, wage]);

  const barMax = Math.max(r.totalBenefit, r.fee.monthly) || 1;

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16">
      <div className="holo-panel-deep rounded-3xl border border-[#187B65]/25 p-6 md:p-10">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#187B65]/40 bg-[#187B65]/10 px-4 py-1.5 text-xs font-bold tracking-[0.18em] uppercase text-[#54D9AE]">
            <Calculator className="w-3.5 h-3.5" /> Interactive estimate
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight admin-headline mt-4">What does the OS return on your operation?</h2>
          <p className="text-emerald-100/60 mt-3 max-w-2xl mx-auto text-sm">
            Move the sliders to match your business. Estimates use conservative assumptions and are not a guarantee of results.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-6">
            <Slider label="Pickup jobs per week" min={5} max={200} value={jobs} onChange={setJobs} format={(v) => `${v} jobs`} />
            <Slider label="Average job value" min={150} max={1200} value={avgValue} onChange={setAvgValue} format={(v) => CAD(v)} />
            <Slider label="Admin hours per week (scheduling, dispatch, invoicing)" min={2} max={60} value={adminHours} onChange={setAdminHours} format={(v) => `${v} h`} />
            <Slider label="Cost of that admin time" min={15} max={80} value={wage} onChange={setWage} format={(v) => `${CAD(v)}/h`} />
            <div className="text-xs text-emerald-100/50 leading-relaxed border-t border-[#187B65]/20 pt-4">
              Assumptions: the dashboard automates ~60% of scheduling, dispatch and invoicing admin time, and automated follow-ups win back ~10% of jobs that would otherwise slip. Adjust your wage input to reflect your own team.
            </div>
          </div>

          {/* Outputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ResultCard icon={Clock} label="Admin time saved" value={`${Math.round(r.hoursSavedPerMonth)} h/mo`} sub={`${CAD(r.adminSaved)}/mo in admin cost`} />
              <ResultCard icon={TrendingUp} label="Recovered revenue" value={CAD(r.recoveredRevenue)} sub="per month from follow-ups" />
            </div>

            <div className="holo-panel-deep rounded-2xl border border-[#187B65]/25 p-5">
              <div className="flex items-baseline justify-between mb-3">
                <span className="text-xs font-bold tracking-[0.14em] uppercase text-emerald-100/50">Monthly estimate</span>
                <span className="text-sm font-semibold text-emerald-100/60">{CAD(r.totalBenefit)} benefit · {CAD(r.fee.monthly)} license</span>
              </div>
              <div className="space-y-2.5">
                <div className="h-4 rounded-full bg-[#187B65] network-pulse" style={{ width: `${Math.min(100, (r.totalBenefit / barMax) * 100)}%` }} />
                <div className="h-4 rounded-full bg-emerald-100/25" style={{ width: `${Math.max(3, (r.fee.monthly / barMax) * 100)}%` }} />
              </div>
              <div className="flex items-baseline justify-between mt-4 pt-3 border-t border-[#187B65]/20">
                <span className="text-sm font-semibold text-emerald-100/70">Estimated net per month</span>
                <span className={`text-2xl font-extrabold ${r.netMonthly > 0 ? "text-[#54D9AE] holo-glow-text" : "text-amber-400"}`}>{CAD(r.netMonthly)}</span>
              </div>
              <div className="text-xs text-emerald-100/50 mt-1">{r.roiMultiple.toFixed(1)}x return on the license fee</div>
            </div>

            <div className="holo-panel-deep rounded-2xl border-2 border-[#187B65] p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-[#187B65]" />
                <span className="text-xs font-bold tracking-[0.14em] uppercase text-[#54D9AE]">Recommended plan</span>
              </div>
              <div className="flex items-baseline justify-between">
                <div>
                  <div className="text-xl font-extrabold text-white">{r.fee.name}</div>
                  <div className="text-xs text-emerald-100/50 mt-0.5">{CAD(r.fee.setup)} one-time setup · {CAD(r.fee.monthly)}/mo</div>
                </div>
                <div className="text-right">
                  {r.setupPaybackMonths !== null && (
                    <div className="text-sm font-bold text-[#54D9AE]">Setup paid back in ~{Math.max(1, Math.ceil(r.setupPaybackMonths))} mo</div>
                  )}
                  <div className={`text-sm font-bold mt-1 ${r.firstYearNet > 0 ? "text-[#54D9AE]" : "text-amber-400"}`}>Year-1 net: {CAD(r.firstYearNet)}</div>
                </div>
              </div>
              <Link
                to={r.plan === "network" ? "#enterprise" : `/software/start?plan=${r.plan}`}
                className="mt-5 block w-full rounded-full bg-[#187B65] text-[#102B2A] font-bold px-6 py-3 hover:bg-[#125C4E] transition-colors text-center"
              >
                {r.plan === "network" ? "Talk to our team" : `Start with ${r.fee.name}`}
              </Link>
            </div>

            <div className="flex items-center gap-2 text-xs text-emerald-100/40">
              <PiggyBank className="w-3.5 h-3.5 shrink-0" /> Figures are planning estimates based on your inputs — not a performance guarantee.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}