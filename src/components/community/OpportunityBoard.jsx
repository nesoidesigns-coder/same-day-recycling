import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Briefcase, BadgeCheck, MapPin, CalendarDays, Plus, X } from 'lucide-react';
import { Image } from '@/components/ui/image';
import { OPPORTUNITY_TYPES, PROVINCES, opportunityTypeLabel } from '@/lib/communityShared';
import { trackGA } from '@/lib/communityAnalytics';

const CATS = ['junk_removal', 'furniture_removal', 'appliance_removal', 'electronics', 'scrap_metal', 'bin_rentals', 'cleanouts', 'other'];

export default function OpportunityBoard({ me }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'overflow_job', title: '', description: '', city: '', province_code: 'BC', service_category: 'junk_removal', requirements: '', deadline: '', contact_method: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const eligibility = useQuery({
    queryKey: ['communityOpportunityEligibility'],
    enabled: !!me,
    queryFn: async () => (await base44.functions.invoke('communityBoard', { action: 'eligibility' })).data,
    staleTime: 60000, retry: false,
  });

  const opportunities = useQuery({
    queryKey: ['communityOpportunities'],
    queryFn: async () => (await base44.entities.CommunityOpportunity.filter({ status: 'open' }, { sort: '-created_date', limit: 60 })).items || [],
  });

  const eligible = !!eligibility.data?.eligible;

  useEffect(() => {
    trackGA('community_board_view', {});
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await base44.functions.invoke('communityBoard', { action: 'create', ...form });
      setOpen(false);
      setForm({ type: 'overflow_job', title: '', description: '', city: '', province_code: 'BC', service_category: 'junk_removal', requirements: '', deadline: '', contact_method: '' });
      queryClient.invalidateQueries({ queryKey: ['communityOpportunities'] });
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not post right now.');
    } finally {
      setBusy(false);
    }
  };

  const close = async (o, status) => {
    await base44.entities.CommunityOpportunity.update(o.id, { status });
    queryClient.invalidateQueries({ queryKey: ['communityOpportunities'] });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><Briefcase className="w-4 h-4 text-[#187B65]" /> Contractor opportunity board</h3>
            <p className="mt-1 text-xs text-slate-500 max-w-xl leading-relaxed">
              Member-to-member professional networking: overflow work, subcontracting, partnerships, equipment and crew availability. Accepting an opportunity never creates a booking or payment obligation — you arrange terms directly.
            </p>
          </div>
          {me ? (
          <button
            onClick={() => setOpen(true)}
            disabled={!eligible}
            className="rounded-full bg-[#187B65] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#125C4E] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Post opportunity
          </button>
          ) : (
          <a href="/register?returnTo=/community" className="rounded-full bg-[#187B65] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#125C4E] transition-colors flex items-center gap-2">
            <Plus className="w-4 h-4" /> Join free to post
          </a>
          )}
        </div>
        {eligibility.data && !eligible && (
          <p className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-800">{eligibility.data.reason}</p>
        )}
      </div>

      {opportunities.isPending && <div className="flex items-center gap-2 py-10 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading opportunities…</div>}
      {opportunities.data && opportunities.data.length === 0 && (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm font-bold text-[#102B2A]">No open opportunities yet.</p>
          <p className="mt-1 text-xs text-slate-500">Verified contractors will post here as the network grows.</p>
        </div>
      )}
      <div className="space-y-3">
        {(opportunities.data || []).map((o) => (
          <article key={o.id} className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              <span className="rounded-full bg-[#187B65]/10 text-[#187B65] px-2 py-0.5">{opportunityTypeLabel(o.type)}</span>
              {o.service_category && <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">{o.service_category.replace(/_/g, ' ')}</span>}
              {o.poster_verified && <span className="inline-flex items-center gap-1 rounded-full bg-[#187B65]/10 text-[#187B65] px-2 py-0.5"><BadgeCheck className="w-3 h-3" /> Verified poster</span>}
            </div>
            {o.image_url && (
              <div className="mt-2 rounded-xl overflow-hidden">
                <Image src={o.image_url} alt="" className="w-full h-44" fittingType="fill" />
              </div>
            )}
            <h4 className="mt-2 text-base font-bold text-[#102B2A]">{o.title}</h4>
            {o.description && <p className="mt-1.5 text-sm text-slate-600 whitespace-pre-line leading-relaxed">{o.description}</p>}
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
              {(o.city || o.province_code) && <span className="inline-flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{[o.city, o.province_code].filter(Boolean).join(', ')}</span>}
              {o.deadline && <span className="inline-flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />Needed by {o.deadline}</span>}
              <span>Posted by {o.poster_name || 'a member'}</span>
            </div>
            {o.requirements && <p className="mt-2 text-xs text-slate-500"><span className="font-bold text-slate-600">Requirements:</span> {o.requirements}</p>}
            {o.contact_method && <p className="mt-1 text-xs text-slate-500"><span className="font-bold text-slate-600">Apply:</span> {o.contact_method}</p>}
            {me && o.created_by === me.email && (
              <div className="mt-3 flex gap-2">
                <button onClick={() => close(o, 'filled')} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors">Mark filled</button>
                <button onClick={() => close(o, 'expired')} className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-slate-400 transition-colors">Mark expired</button>
              </div>
            )}
          </article>
        ))}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-6" role="dialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#102B2A]">Post an opportunity</h3>
              <button onClick={() => setOpen(false)} aria-label="Close" className="text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={submit} className="space-y-3">
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} className="input" aria-label="Opportunity type">
                {OPPORTUNITY_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} required maxLength={200} className="input" placeholder="Title, e.g. 'Overflow loads — 2 this week, Lower Mainland'" />
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} maxLength={3000} className="input resize-none" placeholder="General job requirements, scope and expectations. Never include customer addresses or private contact details." />
              <div className="grid grid-cols-2 gap-3">
                <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="input" placeholder="City" />
                <select value={form.province_code} onChange={(e) => setForm((f) => ({ ...f, province_code: e.target.value }))} className="input" aria-label="Province">
                  {PROVINCES.filter((p) => p.id !== 'national').map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <select value={form.service_category} onChange={(e) => setForm((f) => ({ ...f, service_category: e.target.value }))} className="input" aria-label="Service category">
                  {CATS.map((c) => <option key={c} value={c}>{c.replace(/_/g, ' ')}</option>)}
                </select>
                <input value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} type="date" className="input" aria-label="Availability deadline" />
              </div>
              <input value={form.requirements} onChange={(e) => setForm((f) => ({ ...f, requirements: e.target.value }))} maxLength={1000} className="input" placeholder="Requirements (truck size, insurance, equipment…)" />
              <input value={form.contact_method} onChange={(e) => setForm((f) => ({ ...f, contact_method: e.target.value }))} maxLength={200} required className="input" placeholder="How to apply (e.g. 'Message me via community chat' or business email)" />
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <button disabled={busy} className="w-full rounded-full bg-[#187B65] py-3 text-sm font-bold text-white hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Post opportunity
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}