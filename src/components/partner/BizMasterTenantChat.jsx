import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Send, GraduationCap, Database, TriangleAlert, Sparkles } from 'lucide-react';

export default function BizMasterTenantChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [learning, setLearning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ask = async (q) => {
    const question = String(q || input).trim();
    if (!question || busy) return;
    setMessages((m) => [...m, { role: 'owner', text: question }]);
    setInput('');
    setError('');
    setBusy(true);
    try {
      const res = await base44.functions.invoke('bizMasterTenant', { question, learning_mode: learning });
      const d = res?.data || {};
      setMessages((m) => [...m, { role: 'rex', text: d.answer || 'No answer was returned.', meta: d }]);
    } catch (e) {
      setError(e?.response?.data?.error || 'The advisor could not answer right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={panel}>
      <div className="p-5 md:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#187B65]" /> AI Business Master — your business, your data
            </h2>
            <p className="text-xs text-emerald-100/50 mt-1">
              Answers use only YOUR records (jobs, invoices, pickups, expenses). It explains its math, names missing data, and never treats a booking as payment.
            </p>
          </div>
          <label className="flex items-center gap-2 rounded-full border border-[#187B65]/30 bg-[#102B2A]/60 px-3 py-2 text-xs font-bold text-emerald-100/70 cursor-pointer">
            <input type="checkbox" checked={learning} onChange={(e) => setLearning(e.target.checked)} className="accent-[#187B65] w-4 h-4" />
            <GraduationCap className="w-4 h-4 text-[#187B65]" /> Learning mode
          </label>
        </div>

        <div className="mt-4 space-y-3">
          {messages.map((m, i) => (
            m.role === 'owner' ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl bg-[#187B65] text-[#032015] px-4 py-3 text-sm font-semibold">{m.text}</div>
              </div>
            ) : (
              <div key={i} className="max-w-[95%] rounded-2xl border border-[#187B65]/25 bg-[#0a2b1e]/60 px-4 py-3">
                <p className="text-sm text-emerald-50 whitespace-pre-line leading-relaxed">{m.text}</p>
                {m.meta?.next_action && <p className="mt-2 text-xs font-bold text-[#187B65]">Suggested next step: {m.meta.next_action}</p>}
                {Array.isArray(m.meta?.data_basis) && m.meta.data_basis.length > 0 && (
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] text-emerald-100/40">
                    <Database className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#187B65]" /> Data used: {m.meta.data_basis.join(' · ')}
                  </p>
                )}
                {Array.isArray(m.meta?.missing_data) && m.meta.missing_data.length > 0 && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-300">
                    <TriangleAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Missing data: {m.meta.missing_data.join(' · ')}
                  </p>
                )}
              </div>
            )
          ))}
          {busy && <div className="flex items-center gap-2 text-sm text-emerald-100/50" role="status"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Reviewing your verified records…</div>}
          {error && <p role="alert" className="text-sm text-red-400">{error}</p>}
        </div>

        <form className="mt-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(); }}>
          <input
            className="flex-1 rounded-xl border border-[#187B65]/25 bg-[#0a2b1e]/60 px-4 py-3 text-sm text-emerald-50 placeholder:text-emerald-100/30 focus:border-[#187B65] focus:outline-none"
            placeholder="e.g. What is my real margin per job?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={busy}
          />
          <button type="submit" disabled={busy || !input.trim()} className="shrink-0 rounded-xl bg-[#187B65] px-4 py-3 text-[#032015] font-bold disabled:opacity-40">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

const panel = 'relative rounded-2xl border border-[#187B65]/25 bg-[#102B2A]/50 backdrop-blur-sm';