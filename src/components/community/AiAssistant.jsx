import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Sparkles, Send, X, Loader2, BookOpen, MessageSquare } from 'lucide-react';

export default function AiAssistant({ open, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const ask = async (e) => {
    e.preventDefault();
    const question = input.trim();
    if (!question || busy) return;
    setMessages((m) => [...m, { role: 'member', text: question }]);
    setInput('');
    setBusy(true);
    setError('');
    try {
      const res = await base44.functions.invoke('communityAI', { question });
      const d = res?.data || {};
      setMessages((m) => [...m, { role: 'rex', text: d.answer || 'No answer was returned.', meta: d }]);
    } catch (err) {
      setError(err?.response?.data?.error || 'The assistant could not answer right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" role="dialog" aria-modal="true" aria-label="AI community assistant">
      <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#187B65]" />
            <div>
              <div className="text-sm font-bold text-[#102B2A]">AI Business Master</div>
              <div className="text-[10px] text-slate-500">Community knowledge assistant</div>
            </div>
          </div>
          <button onClick={onClose} aria-label="Close assistant" className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (
            <div className="rounded-2xl bg-[#f4f7f5] p-4 text-xs text-slate-600 leading-relaxed">
              Ask about running a junk removal or recycling business: pricing, cash flow, equipment, customer service, Canadian recycling practices, business terminology. It can also point you to existing community discussions.
              <div className="mt-3 flex flex-wrap gap-2">
                {['How do I price a full truck load?', 'What is negative working capital?', 'How do I find my break-even point?'].map((q) => (
                  <button key={q} onClick={() => setInput(q)} className="rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors">{q}</button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            m.role === 'member' ? (
              <div key={i} className="flex justify-end"><div className="max-w-[85%] rounded-2xl bg-[#187B65] px-4 py-3 text-sm font-semibold text-white">{m.text}</div></div>
            ) : (
              <div key={i} className="max-w-[95%] rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3">
                <span className="rounded-full bg-[#187B65]/10 text-[#187B65] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">AI-generated</span>
                <p className="mt-2 text-sm text-slate-700 whitespace-pre-line leading-relaxed">{m.text}</p>
                {(m.meta?.related_resources || []).length > 0 && (
                  <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500"><BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Library: {m.meta.related_resources.join(', ')}</p>
                )}
                {(m.meta?.related_discussions || []).length > 0 && (
                  <p className="mt-1 flex items-start gap-1.5 text-[11px] text-slate-500"><MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Related discussions: {m.meta.related_discussions.join(', ')}</p>
                )}
                {m.meta?.suggested_channel && <p className="mt-1 text-[11px] text-slate-500">No related discussion found — consider posting in {m.meta.suggested_channel}.</p>}
              </div>
            )
          ))}
          {busy && <div className="flex items-center gap-2 text-sm text-slate-500" role="status"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Thinking…</div>}
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </div>
        <form onSubmit={ask} className="flex gap-2 border-t border-slate-100 p-3">
          <input value={input} onChange={(e) => setInput(e.target.value)} className="input flex-1" placeholder="Ask a business question…" disabled={busy} />
          <button type="submit" disabled={busy || !input.trim()} className="shrink-0 rounded-xl bg-[#187B65] px-4 text-white disabled:opacity-40"><Send className="w-4 h-4" /></button>
        </form>
        <p className="px-4 pb-3 text-[10px] text-slate-400">General education only — never professional, legal or tax advice. The assistant never sees your private business records.</p>
      </div>
    </div>
  );
}