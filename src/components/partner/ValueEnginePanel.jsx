import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, TrendingUp, Coins, Users, Receipt, Repeat, Clock, Info } from 'lucide-react';

const money = (n) => (n == null ? '—' : Number(n).toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 }));
const num = (n) => (n == null ? '—' : Number(n).toLocaleString('en-CA'));

const Tile = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-xl border border-[#187B65]/20 bg-[#0a2b1e]/50 px-4 py-3">
    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-100/40">
      <Icon className="w-3.5 h-3.5 text-[#187B65]" /> {label}
    </div>
    <div className="mt-1 text-lg font-bold text-white tabular-nums">{value}</div>
    {sub && <div className="mt-0.5 text-[10px] text-emerald-100/30">{sub}</div>}
  </div>
);

export default function ValueEnginePanel() {
  const query = useQuery({
    queryKey: ['valueEngine'],
    queryFn: async () => (await base44.functions.invoke('valueEngine', {})).data,
    staleTime: 120000, retry: false,
  });
  const data = query.data;

  return (
    <div className="relative rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm p-5 md:p-6">
      <h2 className="text-lg font-bold text-white flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-[#187B65]" /> What Recycling OS does for your business
      </h2>
      <p className="mt-1 text-xs text-emerald-100/50">
        Directly measured results and estimates are kept separate. Every estimate shows its calculation method, and nothing is attributed to the software without supporting evidence.
      </p>

      {query.isPending && <div className="mt-6 flex items-center gap-2 text-sm text-emerald-100/50" role="status"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Measuring…</div>}
      {query.isError && <p role="alert" className="mt-6 text-sm text-red-400">{query.error?.response?.data?.error || 'Value metrics could not be loaded right now.'}</p>}

      {data && (
        <>
          <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-[#187B65]">Measured — from your own records</div>
          <div className="mt-2 grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile icon={Coins} label="Payments collected" value={money(data.measured.payments_collected)} sub={`${num(data.measured.invoices_paid)} invoices paid`} />
            <Tile icon={Receipt} label="Invoices issued" value={num(data.measured.invoices_issued)} sub={`${num(data.measured.pickups_scheduled)} pickups scheduled`} />
            <Tile icon={Users} label="Customers on file" value={num(data.measured.customers_in_database)} />
            <Tile icon={Repeat} label="Repeat customers" value={num(data.measured.repeat_customers)} sub={data.measured.repeat_rate_pct != null ? `${data.measured.repeat_rate_pct}% repeat rate` : null} />
            <Tile icon={TrendingUp} label="Platform jobs completed" value={num(data.measured.platform_jobs_completed)} sub={`${money(data.measured.platform_job_value)} job value`} />
            <Tile icon={Coins} label="Platform fees paid" value={money(data.measured.platform_fees_paid)} />
            <Tile icon={Receipt} label="Revenue outstanding" value={money(data.measured.revenue_outstanding)} sub="Invoices sent, not yet paid" />
            <Tile icon={Clock} label="Pickups completed" value={num(data.measured.pickups_completed)} />
          </div>

          <div className="mt-4 text-[10px] font-bold uppercase tracking-[0.2em] text-amber-300">Estimated — stated assumptions</div>
          <div className="mt-2 grid sm:grid-cols-2 gap-3">
            <div className="rounded-xl border border-amber-400/20 bg-[#0a2b1e]/50 px-4 py-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-300"><Clock className="w-3.5 h-3.5" /> Admin hours saved</div>
              <div className="mt-1 text-lg font-bold text-white tabular-nums">{num(data.estimated?.admin_hours_saved?.value)} h</div>
              <p className="mt-1 text-[10px] text-emerald-100/40 leading-relaxed">{data.estimated?.admin_hours_saved?.method}</p>
            </div>
            {data.estimated?.scheduling_efficiency && (
              <div className="rounded-xl border border-amber-400/20 bg-[#0a2b1e]/50 px-4 py-3">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-amber-300"><TrendingUp className="w-3.5 h-3.5" /> Scheduling completion</div>
                <div className="mt-1 text-lg font-bold text-white tabular-nums">{data.estimated.scheduling_efficiency.value}</div>
                <p className="mt-1 text-[10px] text-emerald-100/40 leading-relaxed">{data.estimated.scheduling_efficiency.method}</p>
              </div>
            )}
          </div>

          <p className="mt-4 flex items-start gap-1.5 text-[10px] text-emerald-100/40 leading-relaxed">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#187B65]" /> {data.method_note}
          </p>
        </>
      )}
    </div>
  );
}