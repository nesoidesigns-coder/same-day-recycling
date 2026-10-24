import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Send, GraduationCap, Database, AlertTriangle, Sparkles } from 'lucide-react';

const SUGGESTIONS = [
  'What is cash flow?',
  'How do Canadian business taxes work?',
  'Should I reinvest my commission?',
  'What makes a contractor profitable?',
  'How do I calculate operating margins?',
  'How do I grow nationally without losing control?',
];

export default function BizMasterChat() {
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
      const res = await base44.functions.invoke('businessMaster', { question, learning_mode: learning });
      const d = res?.data || {};
      setMessages((m) => [...m, { role: 'rex', text: d.answer || 'No answer was returned.', meta: d }]);
    } catch (e) {
      setError(e?.response?.data?.error || 'The Business Master could not answer right now. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#102B2A] flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#187B65]" /> Ask the Business Master
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Answers use your verified Recycling OS data (lifetime finances, funnel, coverage, market observations) and never fabricate figures. Advisory only — nothing is executed or spent.
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 cursor-pointer">
          <input type="checkbox" checked={learning} onChange={(e) => setLearning(e.target.checked)} className="accent-[#187B65] w-4 h-4" />
          <GraduationCap className="w-4 h-4 text-[#187B65]" /> Learning mode — explain terms simply
        </label>
      </div>

      {messages.length === 0 && !busy && (
        <div className="mt-4 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button key={s} onClick={() => ask(s)} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-[#102B2A] hover:border-[#187B65] hover:text-[#187B65] transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 space-y-3">
        {messages.map((m, i) => (
          m.role === 'owner' ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl bg-[#102B2A] text-white px-4 py-3 text-sm">{m.text}</div>
            </div>
          ) : (
            <div key={i} className="max-w-[95%] rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-sm text-[#102B2A] whitespace-pre-line leading-relaxed">{m.text}</p>
              {m.meta?.next_action && (
                <p className="mt-2 text-xs font-semibold text-[#187B65]">Suggested next step: {m.meta.next_action}</p>
              )}
              {Array.isArray(m.meta?.data_basis) && m.meta.data_basis.length > 0 && (
                <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500">
                  <Database className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[#187B65]" />
                  <span>Data used: {m.meta.data_basis.join(' · ')}</span>
                </p>
              )}
              {Array.isArray(m.meta?.unavailable) && m.meta.unavailable.length > 0 && (
                <p className="mt-1.5 flex items-start gap-1.5 text-[11px] text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>Not available: {m.meta.unavailable.join(' · ')}</span>
                </p>
              )}
            </div>
          )
        ))}
        {busy && (
          <div className="flex items-center gap-2 text-sm text-slate-500" role="status">
            <Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Reviewing verified business data…
          </div>
        )}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => { e.preventDefault(); ask(); }}
      >
        <input
          className="input flex-1"
          placeholder={learning ? 'Ask anything — explanations stay simple…' : 'Ask about finances, operations, taxes, growth…'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={busy}
        />
        <button type="submit" disabled={busy || !input.trim()} className="shrink-0 rounded-xl bg-[#187B65] px-4 py-3 text-white font-bold disabled:opacity-40 flex items-center gap-2">
          <Send className="w-4 h-4" /> Ask
        </button>
      </form>
    </div>
  );
}