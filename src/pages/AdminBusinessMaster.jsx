import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BrainCircuit, FlaskConical, History, MessageCircle, NotebookPen, ShieldCheck } from 'lucide-react';
import BizMasterChat from '@/components/bizmaster/BizMasterChat';
import LifetimePanels from '@/components/bizmaster/LifetimePanels';
import DecisionSimulator from '@/components/bizmaster/DecisionSimulator';
import MemoryPanel from '@/components/bizmaster/MemoryPanel';

const TABS = [
  { id: 'master', label: 'Business Master', icon: MessageCircle },
  { id: 'lifetime', label: 'Lifetime Intelligence', icon: History },
  { id: 'simulator', label: 'Decision Simulator', icon: FlaskConical },
  { id: 'memory', label: 'Business Memory', icon: NotebookPen },
];

export default function AdminBusinessMaster() {
  const [tab, setTab] = useState('master');
  const lifetime = useQuery({
    queryKey: ['businessLifetime'],
    queryFn: async () => (await base44.functions.invoke('businessLifetime', {})).data,
    staleTime: 120000,
    retry: false,
  });

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#102B2A] flex items-center gap-2">
            <BrainCircuit className="w-6 h-6 text-[#187B65]" /> AI Business Master
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Your business strategist, financial analyst, operations advisor and educator. It measures progress from the beginning of the business's real history — every dollar, job and lesson counts.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#187B65]/30 bg-[#187B65]/10 px-3 py-1.5 text-[11px] font-bold text-[#187B65]">
          <ShieldCheck className="w-3.5 h-3.5" /> Owner-only · advisory · audited
        </span>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors ${
              tab === t.id ? 'bg-[#102B2A] text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:text-[#102B2A]'
            }`}
          >
            <t.icon className={`w-4 h-4 ${tab === t.id ? 'text-[#187B65]' : 'text-slate-400'}`} /> {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'master' && <BizMasterChat />}
        {tab === 'lifetime' && <LifetimePanels data={lifetime.data} loading={lifetime.isPending} error={lifetime.error} />}
        {tab === 'simulator' && <DecisionSimulator />}
        {tab === 'memory' && <MemoryPanel />}
      </div>
    </div>
  );
}