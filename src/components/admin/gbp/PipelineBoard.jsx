import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Plus, Phone, MapPin, DollarSign, Loader2, Ban, RotateCcw, CheckCircle2, Send, CalendarCheck } from 'lucide-react';

const COLUMNS = [
  { id: 'inquiry', label: 'Inquiry' },
  { id: 'quote_sent', label: 'Quote sent' },
  { id: 'booked', label: 'Booked' },
  { id: 'completed', label: 'Job completed' },
  { id: 'commission', label: 'Commission earned' },
];

const BOOKING_LABEL = { new: 'New', confirmed: 'Confirmed', contacted: 'Contacted', scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' };

export default function PipelineBoard({ leads }) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', city: '', items_text: '' });
  const [quotingId, setQuotingId] = useState(null);
  const [estVal, setEstVal] = useState('');
  const [formError, setFormError] = useState('');
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['gbpPipeline'] });

  const createLead = async (e) => {
    e.preventDefault();
    if (!form.name.trim() && !form.phone.trim()) { setFormError('Enter at least a name or phone number.'); return; }
    setBusy(true);
    setFormError('');
    try {
      await base44.entities.QuoteLead.create({ ...form, source: 'google_business', status: 'new' });
      setForm({ name: '', phone: '', city: '', items_text: '' });
      setAdding(false);
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      refresh();
    } finally {
      setBusy(false);
    }
  };

  const markQuoteSent = (lead) =>
    run(async () => {
      await base44.entities.QuoteLead.update(lead.id, { status: 'contacted', estimate: estVal || lead.estimate || 'Quote sent' });
      setQuotingId(null);
      setEstVal('');
    });

  const active = (leads || []).filter((l) => l.stage !== 'lost');
  const lost = (leads || []).filter((l) => l.stage === 'lost');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-slate-500">{active.length} active lead{active.length === 1 ? '' : 's'} · moved through the real booking records</p>
        <button onClick={() => setAdding((a) => !a)} className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white hover:bg-[#125C4E] transition-colors"><Plus className="w-3.5 h-3.5" /> Add inquiry</button>
      </div>

      {adding && (
        <form onSubmit={createLead} className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
          <p className="text-xs font-bold text-[#102B2A]">New GBP inquiry (e.g. a call or message from your Business Profile)</p>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input py-2 text-sm" placeholder="Name" aria-label="Customer name" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input py-2 text-sm" placeholder="Phone" aria-label="Phone" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input py-2 text-sm" placeholder="City" aria-label="City" />
            <input value={form.items_text} onChange={(e) => setForm({ ...form, items_text: e.target.value })} className="input py-2 text-sm" placeholder="Items needed" aria-label="Items" />
          </div>
          {formError && <p className="text-xs text-red-600">{formError}</p>}
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setAdding(false)} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
            <button type="submit" disabled={busy} className="rounded-xl bg-[#187B65] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Save inquiry</button>
          </div>
        </form>
      )}

      {active.length === 0 && !adding && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm font-bold text-[#102B2A]">No GBP inquiries yet</p>
          <p className="mt-1 text-xs text-slate-500">Inquiries captured in a Business Profile session appear here automatically — or add a call-in inquiry manually.</p>
        </div>
      )}

      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {COLUMNS.map((col) => {
          const items = active.filter((l) => l.stage === col.id);
          return (
            <div key={col.id} className="shrink-0 w-60 sm:w-64">
              <div className="flex items-center justify-between px-1 mb-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{col.label} <span className="text-slate-400">({items.length})</span></p>
              </div>
              <div className="space-y-2">
                {items.map((lead) => (
                  <div key={lead.id} className="rounded-xl border border-slate-200 bg-white p-3">
                    <p className="text-sm font-bold text-[#102B2A] truncate">{lead.name || lead.phone || 'Inquiry'}</p>
                    <div className="mt-1 space-y-0.5 text-[11px] text-slate-500">
                      {lead.phone && <p className="flex items-center gap-1"><Phone className="w-3 h-3" />{lead.phone}</p>}
                      {lead.city && <p className="flex items-center gap-1"><MapPin className="w-3 h-3" />{lead.city}</p>}
                      {lead.items_text && <p className="line-clamp-2">{lead.items_text}</p>}
                    </div>
                    {lead.stage === 'quote_sent' && lead.estimate && <p className="mt-1.5 text-[11px] font-bold text-[#187B65]">{lead.estimate}</p>}
                    {lead.booking_ref && <p className="mt-1.5 text-[10px] font-semibold text-slate-500">Job {lead.booking_ref} · {BOOKING_LABEL[lead.booking_status] || lead.booking_status}</p>}
                    {lead.stage === 'commission' && <p className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#187B65]/10 px-2 py-0.5 text-[11px] font-bold text-[#187B65]"><DollarSign className="w-3 h-3" />${(lead.commission || 0).toFixed(2)} earned</p>}

                    {/* Stage actions */}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {lead.stage === 'inquiry' && (quotingId === lead.id ? (
                        <div className="w-full flex gap-1.5">
                          <input value={estVal} onChange={(e) => setEstVal(e.target.value)} className="input py-1 text-xs flex-1" placeholder="Quote amount (e.g. $180)" aria-label="Quote amount" autoFocus />
                          <button onClick={() => markQuoteSent(lead)} disabled={busy} className="shrink-0 rounded-lg bg-[#187B65] px-2.5 text-white"><Send className="w-3.5 h-3.5" /></button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => { setQuotingId(lead.id); setEstVal(lead.estimate || ''); }} className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors">Quote sent</button>
                          <button onClick={() => run(() => base44.entities.QuoteLead.update(lead.id, { status: 'lost' }))} disabled={busy} title="Mark lost" className="rounded-full p-1.5 text-slate-300 hover:text-red-500 transition-colors"><Ban className="w-3.5 h-3.5" /></button>
                        </>
                      ))}
                      {lead.stage === 'quote_sent' && (
                        <button onClick={() => run(() => base44.entities.QuoteLead.update(lead.id, { status: 'booked' }))} disabled={busy} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors"><CalendarCheck className="w-3 h-3" /> Booked</button>
                      )}
                      {lead.stage === 'booked' && lead.booking_id && lead.booking_status !== 'completed' && (
                        <button onClick={() => run(() => base44.entities.Booking.update(lead.booking_id, { status: 'completed' }))} disabled={busy} className="inline-flex items-center gap-1 rounded-full border border-[#187B65] px-2.5 py-1 text-[11px] font-bold text-[#187B65] hover:bg-[#187B65] hover:text-white transition-colors"><CheckCircle2 className="w-3 h-3" /> Mark job completed</button>
                      )}
                      {lead.stage === 'booked' && !lead.booking_id && (
                        <p className="text-[10px] text-slate-400">No linked job yet — it appears when this customer books (matched by session or phone).</p>
                      )}
                      {lead.stage === 'completed' && (
                        <p className="text-[10px] text-slate-400">Job completed — commission shows here once it is recorded in dispatch payouts.</p>
                      )}
                    </div>
                  </div>
                ))}
                {items.length === 0 && <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-[11px] text-slate-400">Empty</div>}
              </div>
            </div>
          );
        })}
      </div>

      {lost.length > 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Marked lost ({lost.length})</p>
          <div className="mt-2 space-y-1.5">
            {lost.map((lead) => (
              <div key={lead.id} className="flex items-center justify-between gap-2 text-xs text-slate-500">
                <span className="truncate">{lead.name || lead.phone || 'Inquiry'}{lead.city ? ` · ${lead.city}` : ''}</span>
                <button onClick={() => run(() => base44.entities.QuoteLead.update(lead.id, { status: 'new' }))} disabled={busy} className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-2.5 py-1 font-bold text-slate-500 hover:border-[#187B65] hover:text-[#187B65] transition-colors shrink-0"><RotateCcw className="w-3 h-3" /> Restore</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {busy && <div className="flex justify-center py-1"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /></div>}
    </div>
  );
}