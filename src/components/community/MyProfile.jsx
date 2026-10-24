import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, BadgeCheck, Camera, Info, Globe } from 'lucide-react';
import { MEMBER_TYPES, PROVINCES, memberTypeLabel } from '@/lib/communityShared';

export default function MyProfile({ me }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [verifyNote, setVerifyNote] = useState('');
  const [evidence, setEvidence] = useState(null);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyDone, setVerifyDone] = useState(false);

  const profileQuery = useQuery({
    queryKey: ['communityProfile', me.email],
    queryFn: async () => {
      const rows = (await base44.entities.CommunityProfile.filter({ owner_email: me.email }, { limit: 1 })).items || [];
      return rows[0] || null;
    },
  });

  useEffect(() => {
    if (!profileQuery.isSuccess) return;
    const p = profileQuery.data;
    setForm({
      display_name: p?.display_name || me?.full_name || '',
      member_type: p?.member_type || 'general_member',
      business_name: p?.business_name || '',
      bio: p?.bio || '',
      city: p?.city || '',
      province_code: p?.province_code || 'BC',
      website: p?.website || '',
    });
  }, [profileQuery.isSuccess, profileQuery.data, me?.full_name]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (profileQuery.data) {
        await base44.entities.CommunityProfile.update(profileQuery.data.id, form);
      } else {
        await base44.entities.CommunityProfile.create({ ...form, owner_email: me.email });
      }
      queryClient.invalidateQueries({ queryKey: ['communityProfile', me.email] });
      queryClient.invalidateQueries({ queryKey: ['communityDirectory'] });
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save your profile.');
    } finally {
      setBusy(false);
    }
  };

  const requestVerification = async () => {
    setVerifyBusy(true);
    setError('');
    try {
      let evidence_uri = profileQuery.data?.verification_evidence_uri || '';
      if (evidence) {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: evidence });
        evidence_uri = file_uri;
      }
      await base44.entities.CommunityProfile.update(profileQuery.data.id, {
        verification_status: 'pending',
        verification_note: verifyNote.slice(0, 1000),
        verification_evidence_uri: evidence_uri,
      });
      setVerifyDone(true);
      queryClient.invalidateQueries({ queryKey: ['communityProfile', me.email] });
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not submit the verification request.');
    } finally {
      setVerifyBusy(false);
    }
  };

  if (!form) {
    return <div className="flex items-center gap-2 py-10 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading your profile…</div>;
  }

  const profile = profileQuery.data;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-[#102B2A]">{profile ? 'Your community profile' : 'Join the community'}</h3>
          {profile?.verification_status === 'verified' && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[#187B65]/10 text-[#187B65] px-2.5 py-1 text-[10px] font-bold"><BadgeCheck className="w-3.5 h-3.5" /> Verified business</span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">Community membership is free. Software subscriptions remain entirely optional.</p>
        {profile && <a href={`/community/member/${profile.id}`} className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#187B65] px-3.5 py-1.5 text-[11px] font-bold text-[#187B65] hover:bg-[#187B65] hover:text-white transition-colors"><Globe className="w-3.5 h-3.5" /> View your public profile</a>}

        {profile?.verification_status === 'pending' && (
          <p className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-semibold text-amber-800">Verification under review — the Same Day Recycling team will review your submitted evidence shortly.</p>
        )}
        {profile?.verification_status === 'declined' && (
          <p className="mt-3 rounded-xl bg-red-50 border border-red-200 px-4 py-2.5 text-xs font-semibold text-red-700">Your verification request was declined. You can submit new evidence.</p>
        )}

        <form onSubmit={save} className="mt-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-bold text-[#102B2A]">Display name *</span>
              <input value={form.display_name} onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))} required maxLength={80} className="input mt-1" placeholder="How members will see you" />
            </label>
            <label className="block"><span className="text-xs font-bold text-[#102B2A]">Member type *</span>
              <select value={form.member_type} onChange={(e) => setForm((f) => ({ ...f, member_type: e.target.value }))} className="input mt-1">
                {MEMBER_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-bold text-[#102B2A]">Business name (self-reported)</span>
              <input value={form.business_name} onChange={(e) => setForm((f) => ({ ...f, business_name: e.target.value }))} maxLength={120} className="input mt-1" placeholder="Your operating name, if any" />
            </label>
            <label className="block"><span className="text-xs font-bold text-[#102B2A]">Website</span>
              <input value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} maxLength={300} className="input mt-1" placeholder="https://" />
            </label>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block"><span className="text-xs font-bold text-[#102B2A]">City</span>
              <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} maxLength={80} className="input mt-1" placeholder="e.g. Vancouver" />
            </label>
            <label className="block"><span className="text-xs font-bold text-[#102B2A]">Region</span>
              <select value={form.province_code} onChange={(e) => setForm((f) => ({ ...f, province_code: e.target.value }))} className="input mt-1">
                {PROVINCES.filter((p) => p.id !== 'national').map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
              </select>
            </label>
          </div>
          <label className="block"><span className="text-xs font-bold text-[#102B2A]">About you</span>
            <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} rows={3} maxLength={1000} className="input mt-1 resize-none" placeholder="What you do, what you're working on, what you can help others with." />
          </label>
          {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
          <button disabled={busy} className="rounded-full bg-[#187B65] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#125C4E] transition-colors disabled:opacity-60 flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {profile ? 'Save profile' : 'Create my free profile'}
          </button>
        </form>
      </div>

      {profile && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-[#187B65]" /> Business verification (optional)</h3>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            Verification adds a Verified badge to your profile and lets you post on the contractor opportunity board. It reviews that your business exists and operates — it is not a customer review and says nothing about service quality.
          </p>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] text-slate-500"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Self-reported details (like your business name above) stay clearly separate from verified credentials.</p>
          {profile.verification_status !== 'verified' && (
            <div className="mt-3 space-y-2">
              <textarea value={verifyNote} onChange={(e) => setVerifyNote(e.target.value)} rows={2} maxLength={1000} className="input resize-none" placeholder="Tell us what you're submitting (e.g. business registration number, municipal license)" />
              <label className="flex items-center gap-2 input cursor-pointer hover:border-[#187B65] transition-colors">
                <Camera className="w-4 h-4 text-[#187B65]" />
                <span className="text-slate-500 truncate text-sm">{evidence ? evidence.name : 'Attach proof (photo or document)'}</span>
                <input type="file" accept="image/*,.pdf" onChange={(e) => setEvidence(e.target.files?.[0] || null)} className="hidden" />
              </label>
              <button onClick={requestVerification} disabled={verifyBusy || (!verifyNote && !evidence)} className="rounded-full border border-[#187B65] px-5 py-2 text-xs font-bold text-[#187B65] hover:bg-[#187B65] hover:text-white transition-colors disabled:opacity-50 flex items-center gap-2">
                {verifyBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} {verifyDone ? 'Submitted for review' : 'Submit for verification'}
              </button>
            </div>
          )}
          {profile.verified_details && <p className="mt-2 text-[11px] text-slate-500"><span className="font-bold">What was verified:</span> {profile.verified_details}</p>}
        </div>
      )}
    </div>
  );
}