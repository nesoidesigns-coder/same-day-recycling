import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { FlaskConical, Loader2, TriangleAlert } from 'lucide-react';

const money = (n) => (n == null ? '—' : Number(n).toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }));

const PRESETS = [
  { label: '10 jobs completed daily', patch: { jobs_per_day: 10, contractor_subscribers: 0, cost_increase_pct: 0, extra_monthly_jobs: 0 } },
  { label: '50 contractors subscribe', patch: { jobs_per_day: 0, contractor_subscribers: 50, cost_increase_pct: 0, extra_monthly_jobs: 0 } },
  { label: 'Operating costs +20%', patch: { jobs_per_day: 0, contractor_subscribers: 0, cost_increase_pct: 20, extra_monthly_jobs: 0 } },
  { label: 'Expand into another province', patch: { jobs_per_day: 0, contractor_subscribers: 0, cost_increase_pct: 10, extra_monthly_jobs: 40 } },
];

const FIELDS = [
  { key: 'jobs_per_day', label: 'Completed jobs per day' },
  { key: 'extra_monthly_jobs', label: 'Extra completed jobs per month' },
  { key: 'contractor_subscribers', label: 'Contractors subscribing to Recycling OS' },
  { key: 'cost_increase_pct', label: 'Operating cost change (%)' },
];

const ResultRow = ({ label, value, sub }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-4">
    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
    <div className="mt-1 text-lg font-extrabold text-[#102B2A] tabular-nums">{value}</div>
    {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
  </div>
);

export default function DecisionSimulator() {
  const [inputs, setInputs] = useState({ jobs_per_day: 0, contractor_subscribers: 0, cost_increase_pct: 0, extra_monthly_jobs: 0 });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('businessSimulator', inputs);
      setResult(res?.data || null);
    } catch (e) {
      setError(e?.response?.data?.error || 'The simulation could not run right now.');
      setResult(null);
    } finally {
      setBusy(false);
    }
  };

  const marginLabel = (pct) => (pct == null ? 'Margin —' : `Margin ${pct}%`);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
        <div className="flex items-center gap-2">
          <FlaskConical className="w-5 h-5 text-[#187B65]" />
          <h2 className="text-lg font-extrabold text-[#102B2A]">Business Decision Simulator</h2>
        </div>
        <p className="mt-1 text-xs text-slate-500">
          Every scenario is arithmetic on your verified baseline averages. Results are HYPOTHETICAL illustrations, never forecasts of actual results or guarantees of revenue.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button key={p.label} onClick={() => setInputs((v) => ({ ...v, ...p.patch }))} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#102B2A] hover:border-[#187B65] hover:text-[#187B65] transition-colors">
              {p.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="text-xs font-bold text-slate-500">
              {f.label}
              <input
                type="number"
                className="input mt-1"
                value={inputs[f.key]}
                min={f.key === 'cost_increase_pct' ? -90 : 0}
                onChange={(e) => setInputs((v) => ({ ...v, [f.key]: Number(e.target.value) || 0 }))}
              />
            </label>
          ))}
        </div>
        <button onClick={run} disabled={busy} className="mt-4 rounded-xl bg-[#187B65] px-5 py-3 text-white font-bold disabled:opacity-40 flex items-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />} Run simulation
        </button>
        {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {result && (
        <div className="rounded-3xl border-2 border-amber-300 bg-white shadow-sm p-5 md:p-7">
          <div className="flex items-start gap-2 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 text-xs font-bold text-amber-800">
            <TriangleAlert className="w-4 h-4 shrink-0 mt-0.5" />
            HYPOTHETICAL SIMULATION — built from your baseline averages ({result.basis_summary}). Not a prediction of actual results.
          </div>

          <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <ResultRow label="Monthly platform revenue" value={money(result.scenario.monthly_platform_revenue)} sub={`Baseline ${money(result.baseline.monthly_platform_revenue)}`} />
            <ResultRow label="Monthly OS revenue" value={money(result.scenario.monthly_os_revenue)} sub={`Baseline ${money(result.baseline.monthly_os_revenue)}`} />
            <ResultRow label="Monthly expenses" value={money(result.scenario.monthly_expenses)} sub={`Baseline ${money(result.baseline.monthly_expenses)}`} />
            <ResultRow label="Monthly net (est.)" value={money(result.scenario.monthly_net_estimate)} sub={marginLabel(result.scenario.monthly_margin_pct)} />
            <ResultRow label="12-month platform revenue" value={money(result.twelve_month.platform_revenue)} />
            <ResultRow label="12-month OS revenue" value={money(result.twelve_month.os_revenue)} />
            <ResultRow label="12-month expenses" value={money(result.twelve_month.expenses)} />
            <ResultRow label="12-month net (est.)" value={money(result.twelve_month.net_estimate)} />
            <ResultRow label="Contractors needed" value={result.capacity.contractors_needed} sub={result.capacity.assumption} />
            <ResultRow label="Contractors active today" value={result.capacity.contractors_active} sub={result.capacity.gap} />
          </div>

          <div className="mt-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Assumptions (all from verified data)</div>
            <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc pl-4">
              {result.assumptions.map((a, i) => <li key={i}>{a}</li>)}
            </ul>
          </div>
          {(result.risks || []).length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Risks to watch</div>
              <ul className="mt-2 space-y-1 text-xs text-slate-600 list-disc pl-4">
                {result.risks.map((r, i) => <li key={i}>{r}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}