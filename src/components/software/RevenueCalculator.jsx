import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, TrendingUp, Briefcase, CalendarCheck } from "lucide-react";

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

function ResultCard({ icon: Icon, label, value, sub, highlight }) {
  return (
    <div className={`rounded-2xl p-5 ${highlight ? "border-2 border-[#187B65] holo-panel-deep" : "holo-panel-deep border border-[#187B65]/25"}`}>
      <Icon className="w-5 h-5 text-[#187B65] mb-2" />
      <div className="text-2xl font-extrabold text-[#54D9AE] holo-glow-text">{value}</div>
      <div className="text-xs text-emerald-100/60 mt-1">{sub}</div>
      <div className="text-[10px] font-bold tracking-[0.14em] uppercase text-emerald-100/40 mt-2">{label}</div>
    </div>
  );
}

export default function RevenueCalculator() {
  const [monthlyJobs, setMonthlyJobs] = useState(40);
  const [avgJobValue, setAvgJobValue] = useState(350);
  const [additionalJobs, setAdditionalJobs] = useState(8);

  const r = useMemo(() => {
    const currentMonthly = monthlyJobs * avgJobValue;
    const addedMonthly = additionalJobs * avgJobValue;
    return {
      currentMonthly,
      addedMonthly,
      projectedMonthly: currentMonthly + addedMonthly,
      projectedAnnual: (currentMonthly + addedMonthly) * 12,
      addedAnnual: addedMonthly * 12,
    };
  }, [monthlyJobs, avgJobValue, additionalJobs]);

  return (
    <div className="max-w-6xl mx-auto px-4 pb-16" id="revenue-calculator">
      <div className="holo-panel-deep rounded-3xl border border-[#187B65]/25 p-6 md:p-10">
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#187B65]/40 bg-[#187B65]/10 px-4 py-1.5 text-xs font-bold tracking-[0.18em] uppercase text-[#54D9AE]">
            <Calculator className="w-3.5 h-3.5" /> Interactive projection
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight admin-headline mt-4">Contractor Revenue Calculator</h2>
          <p className="text-emerald-100/60 mt-3 max-w-2xl mx-auto text-sm">
            Enter your current job volume and average job value, then add hypothetical extra jobs to see how your revenue picture changes.
          </p>
          <p className="mt-3 text-xs font-bold text-amber-400/90 max-w-2xl mx-auto">
            Illustrative projection only — based entirely on the figures you enter. Not a forecast and not a guarantee of earnings.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Inputs */}
          <div className="space-y-6">
            <Slider label="Jobs you complete per month" min={5} max={300} value={monthlyJobs} onChange={setMonthlyJobs} format={(v) => `${v} jobs`} />
            <Slider label="Average job value" min={100} max={1500} value={avgJobValue} onChange={setAvgJobValue} format={(v) => CAD(v)} />
            <Slider label="Hypothetical additional jobs per month" min={0} max={60} value={additionalJobs} onChange={setAdditionalJobs} format={(v) => `+${v} jobs`} />
            <div className="text-xs text-emerald-100/50 leading-relaxed border-t border-[#187B65]/20 pt-4">
              The additional-jobs slider is a what-if scenario — for example, jobs you could take on with faster quoting and better organized dispatch. It is not a promise the OS will produce them.
            </div>
          </div>

          {/* Outputs */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <ResultCard icon={Briefcase} label="Current monthly revenue" value={CAD(r.currentMonthly)} sub={`${monthlyJobs} jobs × ${CAD(avgJobValue)}`} />
              <ResultCard icon={TrendingUp} label="Added monthly revenue" value={CAD(r.addedMonthly)} sub={`+${additionalJobs} hypothetical jobs × ${CAD(avgJobValue)}`} />
            </div>
            <ResultCard icon={CalendarCheck} label="Projected monthly revenue" value={CAD(r.projectedMonthly)} sub="Current + hypothetical additional jobs" highlight />
            <div className="holo-panel-deep rounded-2xl border border-[#187B65]/25 p-5 flex items-baseline justify-between">
              <span className="text-sm font-semibold text-emerald-100/70">Projected annual revenue</span>
              <span className="text-2xl font-extrabold text-[#54D9AE] holo-glow-text">{CAD(r.projectedAnnual)}</span>
            </div>
            <p className="text-xs text-emerald-100/40">
              Illustrative projection based on the figures you enter — not guaranteed earnings, and not a performance claim about this software.
            </p>
          </div>
        </div>

        <div className="mt-10 text-center">
          <Link to="/software#licensing" className="inline-flex items-center gap-2 rounded-full bg-[#187B65] text-[#102B2A] font-bold px-8 py-4 hover:bg-[#125C4E] transition-colors">
            Explore the Operating System
          </Link>
        </div>
      </div>
    </div>
  );
}