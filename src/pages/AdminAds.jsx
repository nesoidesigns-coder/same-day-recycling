import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Megaphone, Plus, Loader2, X, Trash2, ShieldAlert, Eye, MousePointerClick } from 'lucide-react';
import { CHANNELS, PROVINCES } from '@/lib/communityShared';

const KIND_LABEL = { house: 'House ad', sponsored: 'Sponsored (paid)' };
const STATUS_STYLE = {
  active: 'bg-[#187B65]/10 text-[#187B65]',
  draft: 'bg-slate-100 text-slate-500',
  paused: 'bg-amber-100 text-amber-700',
  expired: 'bg-slate-100 text-slate-400',
};

const emptyForm = () => ({
  name: '', ad_kind: 'house', advertiser_name: '', headline: '', body: '',
  cta_label: 'Learn more', link_url: '', image_url: '', topics: [], provinces: [], status: 'draft',
});

export default function AdminAds() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ads = useQuery({
    queryKey: ['adminCommunityAds'],
    queryFn: async () => (await base44.entities.CommunityAd.filter({}, { sort: '-created_date', limit: 100 })).items || [],
  });

  const settings = useQuery({
    queryKey: ['adminAdNetworkSettings'],
    queryFn: async () => (await base44.entities.AdNetworkSettings.filter({ network: 'adsense' }, { limit: 1 })).items || [],
  });

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = {
        name: form.name, ad_kind: form.ad_kind, advertiser_name: form.ad_kind === 'sponsored' ? form.advertiser_name : '',
        headline: form.headline, body: form.body, cta_label: form.cta_label || 'Learn more', link_url: form.link_url,
        image_url: form.image_url, topics: form.topics, provinces: form.provinces, status: form.status,
      };
      if (form.id) await base44.entities.CommunityAd.update(form.id, payload);
      else await base44.entities.CommunityAd.create(payload);
      setForm(null);
      queryClient.invalidateQueries({ queryKey: ['adminCommunityAds'] });
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save the campaign.');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (ad, status) => {
    await base44.entities.CommunityAd.update(ad.id, { status });
    queryClient.invalidateQueries({ queryKey: ['adminCommunityAds'] });
  };

  const remove = async (ad) => {
    if (!window.confirm(`Delete campaign "${ad.name}"? Its counted metrics go with it.`)) return;
    await base44.entities.CommunityAd.delete(ad.id);
    queryClient.invalidateQueries({ queryKey: ['adminCommunityAds'] });
  };

  const rows = ads.data || [];
  const totals = rows.reduce(
    (acc, ad) => {
      acc[ad.ad_kind] = acc[ad.ad_kind] || { impressions: 0, clicks: 0 };
      acc[ad.ad_kind].impressions += ad.impressions || 0;
      acc[ad.ad_kind].clicks += ad.clicks || 0;
      return acc;
    },
    {}
  );

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-[#102B2A]">
            <Megaphone className="h-6 w-6 text-[#187B65]" /> Community Ads
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-500">
            Hybrid allocation: house and sponsored campaigns share the feed at one promotional card per ~10 organic posts, matched to discussion topics and region. External networks serve only after you activate them.
          </p>
        </div>
        <button onClick={() => setForm(emptyForm())} className="flex items-center gap-2 rounded-xl bg-[#187B65] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#125C4E] transition-colors">
          <Plus className="h-4 w-4" /> New campaign
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {['house', 'sponsored'].map((kind) => (
          <div key={kind} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{KIND_LABEL[kind]}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xl font-extrabold text-[#102B2A]"><Eye className="h-4 w-4 text-[#187B65]" /> {(totals[kind]?.impressions || 0).toLocaleString('en-CA')}</p>
            <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-slate-500"><MousePointerClick className="h-3.5 w-3.5" /> {(totals[kind]?.clicks || 0).toLocaleString('en-CA')} clicks</p>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active campaigns</p>
          <p className="mt-1 text-xl font-extrabold text-[#102B2A]">{rows.filter((a) => a.status === 'active').length}</p>
          <p className="mt-0.5 text-xs text-slate-500">of {rows.length} total</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">External network</p>
          <p className="mt-1 text-sm font-extrabold text-[#102B2A]">{adSenseStatusLabel(settings.data?.[0])}</p>
          <p className="mt-0.5 text-xs text-slate-500">House ads keep the slots warm meanwhile</p>
        </div>
      </div>

      <AdSenseCard settings={settings.data?.[0]} onSaved={() => queryClient.invalidateQueries({ queryKey: ['adminAdNetworkSettings'] })} />

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4 text-sm font-bold text-[#102B2A]">Campaigns</div>
        {ads.isPending && <div className="flex items-center gap-2 p-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin text-[#187B65]" /> Loading…</div>}
        {rows.length === 0 && !ads.isPending && (
          <p className="p-6 text-sm text-slate-500">No campaigns yet. Create a house ad to start filling feed slots.</p>
        )}
        <div className="divide-y divide-slate-100">
          {rows.map((ad) => (
            <div key={ad.id} className="flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[ad.status] || 'bg-slate-100 text-slate-500'}`}>{ad.status}</span>
                  <span className="text-xs font-bold text-slate-500">{KIND_LABEL[ad.ad_kind] || ad.ad_kind}</span>
                  {ad.advertiser_name && <span className="text-xs text-slate-400">by {ad.advertiser_name}</span>}
                </div>
                <p className="mt-1 truncate text-sm font-bold text-[#102B2A]">{ad.headline}</p>
                <p className="text-xs text-slate-500">{(ad.impressions || 0).toLocaleString('en-CA')} impressions · {(ad.clicks || 0).toLocaleString('en-CA')} clicks · {ad.impressions ? `${(((ad.clicks || 0) / ad.impressions) * 100).toFixed(1)}% CTR` : '—'}</p>
              </div>
              <div className="flex items-center gap-1.5">
                {ad.status !== 'active' && <button onClick={() => setStatus(ad, 'active')} className="rounded-lg bg-[#187B65] px-3 py-1.5 text-xs font-bold text-white">Activate</button>}
                {ad.status === 'active' && <button onClick={() => setStatus(ad, 'paused')} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">Pause</button>}
                <button onClick={() => setForm({ ...emptyForm(), ...ad, topics: ad.topics || [], provinces: ad.provinces || [] })} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">Edit</button>
                <button onClick={() => remove(ad)} className="rounded-lg p-1.5 text-slate-400 hover:text-red-500" aria-label="Delete campaign"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {form && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4" role="dialog" aria-modal="true">
          <form onSubmit={save} className="my-8 w-full max-w-2xl space-y-3 rounded-2xl bg-white p-5 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#102B2A]">{form.id ? 'Edit campaign' : 'New campaign'}</h2>
              <button type="button" onClick={() => setForm(null)} aria-label="Close" className="text-slate-400 hover:text-slate-600"><X className="h-4 w-4" /></button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-500">Internal name
                <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="input mt-1" placeholder="SDR same-day booking" />
              </label>
              <label className="text-xs font-semibold text-slate-500">Type
                <select value={form.ad_kind} onChange={(e) => setForm((f) => ({ ...f, ad_kind: e.target.value }))} className="input mt-1">
                  <option value="house">House ad (our services)</option>
                  <option value="sponsored">Sponsored (paid, verified advertiser)</option>
                </select>
              </label>
            </div>
            {form.ad_kind === 'sponsored' && (
              <label className="block text-xs font-semibold text-slate-500">Advertiser name (shown on the card)
                <input value={form.advertiser_name} onChange={(e) => setForm((f) => ({ ...f, advertiser_name: e.target.value }))} required className="input mt-1" placeholder="e.g. a verified Canadian business" />
              </label>
            )}
            <label className="block text-xs font-semibold text-slate-500">Headline
              <input required maxLength={120} value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} className="input mt-1" />
            </label>
            <label className="block text-xs font-semibold text-slate-500">Body
              <textarea rows={2} maxLength={500} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} className="input resize-none mt-1" />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold text-slate-500">Button label
                <input maxLength={40} value={form.cta_label} onChange={(e) => setForm((f) => ({ ...f, cta_label: e.target.value }))} className="input mt-1" />
              </label>
              <label className="text-xs font-semibold text-slate-500">Link (path or URL)
                <input required maxLength={300} value={form.link_url} onChange={(e) => setForm((f) => ({ ...f, link_url: e.target.value }))} className="input mt-1" placeholder="/request-service" />
              </label>
            </div>
            <label className="block text-xs font-semibold text-slate-500">Image URL (optional)
              <input maxLength={500} value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className="input mt-1" />
            </label>
            <Field label="Relevant channels (empty = broadly relevant)">
              <div className="flex flex-wrap gap-1.5">
                {CHANNELS.map((c) => (
                  <Chip key={c.id} active={form.topics.includes(c.id)} onClick={() => toggleList(form, setForm, 'topics', c.id)} label={c.label} />
                ))}
              </div>
            </Field>
            <Field label="Target regions (empty = all)">
              <div className="flex flex-wrap gap-1.5">
                {PROVINCES.filter((p) => p.id !== 'national').map((p) => (
                  <Chip key={p.id} active={form.provinces.includes(p.id)} onClick={() => toggleList(form, setForm, 'provinces', p.id)} label={p.label} />
                ))}
              </div>
            </Field>
            <label className="block text-xs font-semibold text-slate-500">Status
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="input mt-1">
                {['draft', 'active', 'paused', 'expired'].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
            {error && <p className="flex items-center gap-1.5 text-sm text-red-600" role="alert"><ShieldAlert className="h-4 w-4" /> {error}</p>}
            <button disabled={busy} className="flex items-center gap-2 rounded-xl bg-[#187B65] px-5 py-2.5 text-sm font-bold text-white disabled:opacity-60">
              {busy && <Loader2 className="h-4 w-4 animate-spin" />} Save campaign
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

const toggleList = (form, setForm, key, value) => {
  const list = form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value];
  setForm((f) => ({ ...f, [key]: list }));
};

const Chip = ({ active, onClick, label }) => (
  <button type="button" onClick={onClick} aria-pressed={active} className={`rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${active ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-slate-200 text-slate-600 hover:border-[#187B65]'}`}>{label}</button>
);

const Field = ({ label, children }) => (
  <div className="text-xs font-semibold text-slate-500">
    {label}
    <div className="mt-1.5">{children}</div>
  </div>
);

function adSenseStatusLabel(s) {
  if (!s || s.status === 'not_configured') return 'Not configured';
  return { pending_owner_approval: 'Awaiting your approval', active: 'Active', paused: 'Paused' }[s.status] || s.status;
}

function AdSenseCard({ settings, onSaved }) {
  const queryClient = useQueryClient();
  const s = settings || {};
  const [publisherId, setPublisherId] = useState(s.publisher_id || '');
  const [slotId, setSlotId] = useState(s.adsense_slot_id || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const persist = async (status) => {
    setBusy(true);
    setError('');
    try {
      const payload = { network: 'adsense', publisher_id: publisherId.trim(), adsense_slot_id: slotId.trim(), status };
      if (settings) await base44.entities.AdNetworkSettings.update(settings.id, payload);
      else await base44.entities.AdNetworkSettings.create(payload);
      onSaved();
      queryClient.invalidateQueries({ queryKey: ['adminAdNetworkSettings'] });
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save AdSense settings.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-[#102B2A]">Google AdSense (future activation)</h2>
        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${s.status === 'active' ? 'bg-[#187B65]/10 text-[#187B65]' : 'bg-slate-100 text-slate-500'}`}>{adSenseStatusLabel(s)}</span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
        Add your publisher ID and one in-feed responsive ad unit once your AdSense account is approved for samedayrecycling.ca. Until you press Activate, only house and sponsored campaigns serve — nothing is replaced automatically. Activation is yours to approve.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-slate-500">Publisher ID
          <input value={publisherId} onChange={(e) => setPublisherId(e.target.value)} placeholder="ca-pub-XXXXXXXXXXXXXXXX" className="input mt-1" />
        </label>
        <label className="text-xs font-semibold text-slate-500">Ad unit slot ID
          <input value={slotId} onChange={(e) => setSlotId(e.target.value)} placeholder="1234567890" className="input mt-1" />
        </label>
      </div>
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        <button disabled={busy} onClick={() => persist(settings ? s.status : 'pending_owner_approval')} className="rounded-xl bg-[#102B2A] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">Save settings</button>
        {s.status === 'pending_owner_approval' && <button disabled={busy} onClick={() => persist('active')} className="rounded-xl bg-[#187B65] px-4 py-2 text-xs font-bold text-white disabled:opacity-60">Approve & activate</button>}
        {s.status === 'active' && <button disabled={busy} onClick={() => persist('paused')} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-60">Pause network</button>}
      </div>
    </div>
  );
}