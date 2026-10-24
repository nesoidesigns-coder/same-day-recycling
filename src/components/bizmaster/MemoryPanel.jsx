import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Check, Loader2, NotebookPen, Pencil, Plus, Trash2, X } from 'lucide-react';

const TYPES = [
  ['milestone', 'Milestone'],
  ['financial_milestone', 'Financial milestone'],
  ['decision', 'Decision'],
  ['model_change', 'Model change'],
  ['agreement', 'Contractor agreement'],
  ['lesson', 'Operational lesson'],
  ['objective', 'Objective'],
  ['recommendation', 'Recommendation'],
];
const TYPE_LABEL = Object.fromEntries(TYPES);
const today = () => new Date().toISOString().slice(0, 10);

export default function MemoryPanel() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['businessMemory'],
    queryFn: async () => (await base44.entities.BusinessMemory.list({ sort: '-entry_date', limit: 200 })).items,
    staleTime: 30000,
  });
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({ entry_type: 'milestone', title: '', detail: '', entry_date: today() });
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['businessMemory'] });

  const add = async () => {
    if (!draft.title.trim() || busy) return;
    setBusy(true);
    try {
      await base44.entities.BusinessMemory.create({
        ...draft,
        source: 'owner',
        history: [{ date: new Date().toISOString(), event: 'created', note: 'Recorded by owner' }],
      });
      setDraft({ entry_type: 'milestone', title: '', detail: '', entry_date: today() });
      setAdding(false);
      invalidate();
    } finally {
      setBusy(false);
    }
  };

  const startEdit = (m) => {
    setEditingId(m.id);
    setEditDraft({ entry_type: m.entry_type, title: m.title, detail: m.detail || '', status: m.status || 'active', history: m.history || [] });
  };

  const saveEdit = async () => {
    if (!editDraft?.title?.trim() || busy) return;
    setBusy(true);
    try {
      await base44.entities.BusinessMemory.update(editingId, {
        entry_type: editDraft.entry_type,
        title: editDraft.title,
        detail: editDraft.detail,
        status: editDraft.status,
        history: [...(editDraft.history || []), { date: new Date().toISOString(), event: 'corrected', note: 'Corrected by owner' }],
      });
      setEditingId(null);
      setEditDraft(null);
      invalidate();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (m) => {
    if (busy || !window.confirm(`Delete "${m.title}" from business memory?`)) return;
    setBusy(true);
    try {
      await base44.entities.BusinessMemory.delete(m.id);
      invalidate();
    } finally {
      setBusy(false);
    }
  };

  const rows = query.data || [];

  return (
    <div className="rounded-3xl bg-white border border-slate-100 shadow-sm p-5 md:p-7">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-[#102B2A] flex items-center gap-2">
            <NotebookPen className="w-5 h-5 text-[#187B65]" /> Business Memory
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            The permanent record of decisions, milestones, lessons and past recommendations. You can correct any entry — every correction is logged in the entry's history.
          </p>
        </div>
        <button onClick={() => setAdding((v) => !v)} className="rounded-xl bg-[#187B65] px-4 py-2.5 text-white text-sm font-bold flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add entry
        </button>
      </div>

      {adding && (
        <div className="mt-4 rounded-2xl bg-slate-50 p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs font-bold text-slate-500">
              Type
              <select className="input mt-1" value={draft.entry_type} onChange={(e) => setDraft((d) => ({ ...d, entry_type: e.target.value }))}>
                {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="text-xs font-bold text-slate-500">
              Date it happened
              <input type="date" className="input mt-1" value={draft.entry_date} onChange={(e) => setDraft((d) => ({ ...d, entry_date: e.target.value }))} />
            </label>
          </div>
          <input className="input" placeholder="Title — e.g. 'First platform commission earned'" value={draft.title} onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))} />
          <textarea className="input" rows={3} placeholder="Details, lessons learned, or expected impact…" value={draft.detail} onChange={(e) => setDraft((d) => ({ ...d, detail: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={add} disabled={busy || !draft.title.trim()} className="rounded-xl bg-[#187B65] px-4 py-2.5 text-white text-sm font-bold disabled:opacity-40 flex items-center gap-2">
              <Check className="w-4 h-4" /> Save
            </button>
            <button onClick={() => setAdding(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-500">Cancel</button>
          </div>
        </div>
      )}

      {query.isPending && <div className="mt-6 flex items-center gap-2 text-sm text-slate-500" role="status"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Loading memory…</div>}
      {query.isError && <p role="alert" className="mt-6 text-sm text-red-600">Business memory could not be loaded right now.</p>}
      {!query.isPending && rows.length === 0 && (
        <p className="mt-6 text-sm text-slate-500">No entries yet. Record your first milestone — the AI Business Master uses this history when advising you.</p>
      )}

      <div className="mt-5 space-y-3">
        {rows.map((m) => (
          <div key={m.id} className="rounded-2xl border border-slate-200 px-4 py-3">
            {editingId === m.id ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <select className="input max-w-52" value={editDraft.entry_type} onChange={(e) => setEditDraft((d) => ({ ...d, entry_type: e.target.value }))}>
                    {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                  <select className="input max-w-40" value={editDraft.status} onChange={(e) => setEditDraft((d) => ({ ...d, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="superseded">Superseded</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <input className="input" value={editDraft.title} onChange={(e) => setEditDraft((d) => ({ ...d, title: e.target.value }))} />
                <textarea className="input" rows={3} value={editDraft.detail} onChange={(e) => setEditDraft((d) => ({ ...d, detail: e.target.value }))} />
                <div className="flex gap-2">
                  <button onClick={saveEdit} disabled={busy} className="rounded-xl bg-[#187B65] px-4 py-2 text-white text-sm font-bold disabled:opacity-40 flex items-center gap-2"><Check className="w-4 h-4" /> Save correction</button>
                  <button onClick={() => { setEditingId(null); setEditDraft(null); }} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-500 flex items-center gap-2"><X className="w-4 h-4" /> Cancel</button>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <span className="rounded-full bg-[#187B65]/10 text-[#187B65] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{TYPE_LABEL[m.entry_type] || m.entry_type}</span>
                    {m.status !== 'active' && <span className="ml-1.5 rounded-full bg-slate-100 text-slate-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">{m.status}</span>}
                    <span className="ml-2 text-[11px] text-slate-400">{m.entry_date || '—'}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(m)} className="p-2 text-slate-400 hover:text-[#187B65]" aria-label="Correct entry"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => remove(m)} className="p-2 text-slate-400 hover:text-red-600" aria-label="Delete entry"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="mt-1 text-sm font-bold text-[#102B2A]">{m.title}</div>
                {m.detail && <p className="mt-1 text-xs text-slate-600 leading-relaxed">{m.detail}</p>}
                {(m.history || []).length > 0 && (
                  <p className="mt-1 text-[10px] text-slate-400">History: {m.history.map((h) => `${h.event} ${String(h.date || '').slice(0, 10)}`).join(' · ')}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}