import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BrainCircuit, Loader2, TriangleAlert, TrendingUp, Users, Receipt, Repeat } from 'lucide-react';

const money = (n) => (n == null ? '—' : Number(n).toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }));
const num = (n) => (n == null ? '—' : Number(n).toLocaleString('en-CA'));

const Metric = ({ label, value, sub }) => (
  <div className="rounded-2xl bg-slate-50 px-4 py-4">
    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</div>
    <div className="mt-1 text-lg font-extrabold text-[#102B2A] tabular-nums">{value}</div>
    {sub && <div className="mt-0.5 text-[11px] text-slate-500">{sub}</div>}
  </div>
);

export default function OsOversightPanel() {
  const query = useQuery({
    queryKey: ['osOversight'],
    queryFn: async () => (await base44.functions.invoke('osOversight', {})).data,
    staleTime: 120000, retry: false,
  });
  const data = query.data;

  return (
    <div className="space-y-5">
      <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
        <h2 className="text-lg font-extrabold text-[#102B2A] flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-[#187B65]" /> Software business oversight
        </h2>
        <p className="mt-1 text-xs text-slate-500">Verified subscription, adoption and retention metrics — kept strictly separate from service commissions. The AI challenges unsupported assumptions and labels projections.</p>

        {query.isPending && <div className="mt-6 flex items-center gap-2 text-sm text-slate-500" role="status"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Aggregating software metrics…</div>}
        {query.isError && <p role="alert" className="mt-6 text-sm text-red-600">{query.error?.response?.data?.error || 'Oversight data could not be loaded right now.'}</p>}

        {data && (
          <>
            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
              <Metric label="Active licenses" value={num(data.metrics.active_licenses)} sub={`${num(data.metrics.paused_licenses)} paused`} />
              <Metric label="MRR" value={money(data.metrics.mrr)} sub={`ARR ${money(data.metrics.arr)}`} />
              <Metric label="Cancelled" value={num(data.metrics.cancelled_licenses)} sub={data.metrics.churn_pct != null ? `${data.metrics.churn_pct}% churn` : 'churn undefined'} />
              <Metric label="Avg tenure" value={data.metrics.avg_tenure_months != null ? `${data.metrics.avg_tenure_months} mo` : '—'} />
              <Metric label="Software revenue (lifetime)" value={money(data.metrics.software_revenue_lifetime)} />
              <Metric label="Service commissions (lifetime)" value={money(data.metrics.service_commission_lifetime)} sub="Separate category — never merged" />
              <Metric label="Feature adoption" value={data.metrics.adoption.adoption_rate_pct != null ? `${data.metrics.adoption.adoption_rate_pct}%` : '—'} sub={`${data.metrics.adoption.licenses_with_invoices} invoicing · ${data.metrics.adoption.licenses_with_pickups} dispatching`} />
              <Metric label="Contractors on network" value={num(data.metrics.partners_active)} sub={`${num(data.metrics.partners_total)} total`} />
            </div>
            {(data.metrics.mrr_by_plan || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {data.metrics.mrr_by_plan.map((p) => (
                  <span key={p.plan} className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-[#102B2A]">
                    {p.plan}: {num(p.count)} active · {money(p.mrr)} MRR
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {data && (
        <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
          <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">Rex strategic analysis</h2>
          <p className="mt-2 text-sm text-[#102B2A] leading-relaxed">{data.analysis.summary}</p>
          <div className="mt-4 space-y-3">
            {data.analysis.recommendations.map((r, i) => (
              <div key={i} className="rounded-2xl bg-slate-50 px-4 py-4">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${r.confidence === 'high' ? 'bg-[#187B65]/10 text-[#187B65]' : r.confidence === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-500'}`}>{r.confidence} confidence</span>
                  <TrendingUp className="w-3.5 h-3.5 text-[#187B65]" />
                </div>
                <div className="mt-2 text-sm font-bold text-[#102B2A]">{r.business_opportunity}</div>
                <p className="mt-1 text-xs text-slate-600"><strong>Evidence:</strong> {r.verified_evidence}</p>
                <p className="mt-1 text-xs text-slate-600"><strong>Financial:</strong> {r.financial_implications}</p>
                <p className="mt-1 text-xs text-slate-600"><strong>Risks:</strong> {r.risks_and_uncertainties}</p>
                <p className="mt-1.5 text-xs font-bold text-[#187B65]">Next action: {r.recommended_next_action}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-start gap-1.5 text-[11px] text-slate-500">
            <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <span>{data.data_gaps.join(' · ')}</span>
          </div>
        </div>
      )}
    </div>
  );
}