import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, PenLine, X, Camera } from 'lucide-react';
import { CHANNELS, PROVINCES } from '@/lib/communityShared';

export default function PostComposer({ me, profileName, onDone, defaultChannel = 'general' }) {
  const [open, setOpen] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [form, setForm] = useState({ channel: defaultChannel, province: 'national', title: '', body: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const queryClient = useQueryClient();

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      let image_url = '';
      if (photo) {
        // Community photos are public by nature — stored publicly so every
        // visitor (guests included) can view them.
        const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: photo });
        image_url = file_url;
      }
      await base44.entities.CommunityPost.create({
        channel: form.channel,
        province: form.channel === 'provincial' ? form.province : 'national',
        title: form.title,
        body: form.body,
        image_url,
        author_name: profileName || (me.email ? me.email.split('@')[0] : 'Member'),
      });
      setForm({ channel: defaultChannel, province: 'national', title: '', body: '' });
      setPhoto(null);
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['communityPosts'] });
      onDone?.();
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not post right now.');
    } finally {
      setBusy(false);
    }
  };

  const channels = CHANNELS.filter((c) => c.id !== 'announcements' || me.role === 'admin');

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      {!open ? (
        <button onClick={() => setOpen(true)} className="flex w-full items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 text-left text-sm text-slate-500 hover:bg-slate-100 transition-colors">
          <PenLine className="w-4 h-4 text-[#187B65]" /> Start a discussion…
        </button>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#102B2A]">New discussion</h3>
            <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required maxLength={200} className="input" placeholder="Topic title — make it searchable, e.g. 'Dump fees rising in the Lower Mainland?'" />
          <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} required rows={4} maxLength={5000} className="input resize-none" placeholder="Share the details, context or question." />
          <label className="flex items-center gap-2 input cursor-pointer hover:border-[#187B65] transition-colors">
            <Camera className="w-4 h-4 text-[#187B65]" />
            <span className="text-slate-500 truncate text-sm">{photo ? photo.name : 'Add a photo (optional)'}</span>
            <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} className="hidden" />
          </label>
          <div className="grid sm:grid-cols-2 gap-3">
            <select value={form.channel} onChange={(e) => setForm((f) => ({ ...f, channel: e.target.value }))} className="input">
              {channels.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
            {form.channel === 'provincial' && (
              <select value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} className="input">
                {PROVINCES.filter((p) => p.id !== 'national').map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            )}
          </div>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button disabled={busy} className="rounded-full bg-[#187B65] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Post discussion
          </button>
        </form>
      )}
    </div>
  );
}