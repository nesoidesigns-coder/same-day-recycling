import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, TriangleAlert, BarChart3, Trello, Info } from 'lucide-react';
import FunnelStages from '@/components/admin/gbp/FunnelStages';
import PipelineBoard from '@/components/admin/gbp/PipelineBoard';

const RANGES = [
  { v: 7, label: 'Last 7 days' },
  { v: 30, label: 'Last 30 days' },
  { v: 90, label: 'Last 90 days' },
  { v: 0, label: 'All time' },
];

export default function AdminGbpPipeline() {
  const [tab, setTab] = useState('funnel');
  const [days, setDays] = useState(30);

  const funnel = useQuery({
    queryKey: ['gbpPipeline', days],
    queryFn: async () => (await base44.functions.invoke('gbpPipeline', { days })).data,
  });

  const data = funnel.data;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-[#102B2A]">Google Business Profile Funnel</h1>
        <p className="mt-1 text-sm text-slate-600">Google Business Profile → Customer inquiry → Quote → Completed job → Commission earned.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className="input py-2 text-xs max-w-[160px]" aria-label="Time range">
          {RANGES.map((r) => <option key={r.v} value={r.v}>{r.label}</option>)}
        </select>
        <div className="flex gap-1.5">
          <button onClick={() => setTab('funnel')} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${tab === 'funnel' ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}><BarChart3 className="w-3.5 h-3.5" /> Funnel</button>
          <button onClick={() => setTab('board')} className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${tab === 'board' ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 bg-white text-slate-600 hover:border-[#187B65]'}`}><Trello className="w-3.5 h-3.5" /> Pipeline board</button>
        </div>
      </div>

      {funnel.isPending && <div className="flex items-center gap-2 py-10 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading funnel data…</div>}
      {funnel.isError && <p className="flex items-center gap-2 py-6 text-sm text-red-600" role="alert"><TriangleAlert className="w-4 h-4" /> Funnel data could not be loaded right now.</p>}

      {data && tab === 'funnel' && <FunnelStages funnel={data.funnel} />}
      {data && tab === 'board' && <PipelineBoard leads={data.leads || []} />}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold text-[#102B2A] flex items-center gap-1.5"><Info className="w-3.5 h-3.5 text-[#187B65]" /> How attribution works</p>
        <ul className="mt-2 space-y-1 text-[11px] text-slate-500 leading-relaxed list-disc pl-4">
          <li>Visits count as "Google Business Profile" when they arrive from your Business Profile or a Maps listing, or from a link ending in <span className="font-bold">?src=gbp</span>. Add that tag to the website link on your Google Business Profile.</li>
          <li>Inquiries, bookings and commissions are matched to those visits through the anonymous session id — plus phone-number matching and inquiries you add manually on the board.</li>
          <li>Stages are counted only when the underlying records say so — nothing here is estimated. Commission amounts come from the job's recorded commission in dispatch.</li>
        </ul>
      </div>
    </div>
  );
}