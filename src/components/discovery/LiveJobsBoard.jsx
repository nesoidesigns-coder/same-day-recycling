import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, ExternalLink, BookmarkPlus, Bookmark, Briefcase, ShieldCheck, Search } from 'lucide-react';
import { PROVINCES } from '@/lib/communityShared';
import { SERVICE_CATEGORIES, JOB_STATUSES, serviceCategoryLabel, jobStatusMeta, classificationMeta } from '@/lib/discoveryShared';
import { trackGA } from '@/lib/communityAnalytics';

// Live Jobs: the dedicated opportunity board inside Live Discovery. Every
// entry is a real, sourced public post — never fabricated, never an estimate
// of national demand. Reddit discussions stay potential leads until a
// customer confirms a booking through Recycling OS.
export default function LiveJobsBoard({ me }) {
  const queryClient = useQueryClient();
  const [province, setProvince] = useState('all');
  const [category, setCategory] = useState('all');
  const [jobStatus, setJobStatus] = useState('all');
  const [city, setCity] = useState('');
  const isAdmin = me?.role === 'admin';

  const jobs = useQuery({
    queryKey: ['liveJobs', province, category, jobStatus],
    queryFn: async () => {
      const q = { status: 'open' };
      if (province !== 'all') q.province_code = province;
      if (category !== 'all') q.service_category = category;
      if (jobStatus !== 'all') q.job_status = jobStatus;
      q.posted_at = { $gte: new Date(Date.now() - 45 * 86400000).toISOString() };
      return (await base44.entities.PublicOpportunity.filter(q, { sort: '-posted_at', limit: 60 })).items || [];
    },
  });

  const rows = (jobs.data || []).filter(
    (j) => !city.trim() || (j.city || '').toLowerCase().includes(city.trim().toLowerCase())
  );

  return (
    <div className="space-y-3" id="live-jobs">
      <div className="rounded-2xl border border-[#187B65]/25 bg-[#f4f7f5] px-4 py-3 flex items-start gap-2.5">
        <Briefcase className="w-4 h-4 shrink-0 mt-0.5 text-[#187B65]" />
        <p className="text-xs text-[#102B2A] leading-relaxed">
          <span className="font-bold">Live Jobs</span> — every listing is a real public post, linked to its source with the date it was discovered. Discussions stay potential leads until a customer confirms a booking; nothing here is estimated or invented.
        </p>
      </div>

      {/* Province / city / category / status filters */}
      <div className="grid grid-cols-2 gap-2">
        <select value={province} onChange={(e) => setProvince(e.target.value)} className="input py-2.5 text-xs" aria-label="Province filter">
          <option value="all">All provinces</option>
          {PROVINCES.filter((p) => p.id !== 'national').map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="input py-2.5 text-xs" aria-label="Service category filter">
          <option value="all">All services</option>
          {SERVICE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
        </select>
        <select value={jobStatus} onChange={(e) => setJobStatus(e.target.value)} className="input py-2.5 text-xs" aria-label="Job status filter">
          <option value="all">All statuses</option>
          {JOB_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={city} onChange={(e) => setCity(e.target.value)} className="input pl-9 py-2.5 text-xs" placeholder="Filter by city…" aria-label="City filter" />
        </div>
      </div>

      {jobs.isLoading && (
        <div className="flex items-center gap-2 py-6 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading live jobs…</div>
      )}
      {jobs.isError && <p className="py-6 text-sm text-red-600" role="alert">The jobs board could not be loaded right now.</p>}

      {!jobs.isLoading && !jobs.isError && (
        <>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#187B65]">{rows.length} live job{rows.length === 1 ? '' : 's'}</p>
          {rows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
              <p className="text-sm font-bold text-[#102B2A]">No live jobs match these filters yet.</p>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                The board only shows real public posts the engine has discovered and verified. It never fills itself with placeholders — check back after the next discovery run, or try broader filters.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {rows.map((job) => <JobCard key={job.id} job={job} me={me} isAdmin={isAdmin} onChange={() => queryClient.invalidateQueries({ queryKey: ['liveJobs'] })} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function JobCard({ job, me, isAdmin, onChange }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const status = jobStatusMeta(job.job_status);
  const classification = classificationMeta(job.classification);
  const summary = String(job.description || '').trim();

  const save = async () => {
    setSaving(true);
    try {
      await base44.entities.CommunitySavedOpportunity.create({ opportunity_id: job.id, owner_email: me.email });
      trackGA('discovery_job_saved', { source: job.source });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const onViewSource = () => trackGA('discovery_job_source_view', { source: job.source });

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 hover:border-[#187B65]/50 transition-colors">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${status.tone}`}>{status.label}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${classification.tone}`}>{classification.label}</span>
        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-600 flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-[#187B65]" /> {job.source === 'reddit' ? 'Reddit' : job.source === 'recycling_os' ? 'Recycling OS' : 'Public forum'}
        </span>
        {job.estimated_value && (
          <span className="rounded-full bg-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#8a6410]">Est. {job.estimated_value}</span>
        )}
      </div>

      <h3 className="mt-2 text-sm font-bold text-[#102B2A] leading-snug break-words">{job.title}</h3>

      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
        <span><span className="font-semibold text-slate-600">Service:</span> {serviceCategoryLabel(job.service_category)}</span>
        {(job.city || job.province_code) && <span><span className="font-semibold text-slate-600">Location:</span> {[job.city, job.province_code && PROVINCES.find((p) => p.id === job.province_code)?.label].filter(Boolean).join(', ')}</span>}
        {job.posted_at && <span><span className="font-semibold text-slate-600">Discovered:</span> {new Date(job.posted_at).toLocaleDateString('en-CA')}</span>}
      </div>

      {job.excerpt && <p className="mt-2 text-xs text-slate-600 leading-relaxed line-clamp-3">{job.excerpt}</p>}

      {summary && (
        <div className="mt-2 rounded-xl bg-[#f4f7f5] border border-[#187B65]/20 px-3 py-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#187B65]">AI summary</p>
          <p className="mt-0.5 text-xs text-[#102B2A] leading-relaxed">{summary}</p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={job.source_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onViewSource}
          className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-[#187B65] hover:text-[#187B65] transition-colors"
        >
          <ExternalLink className="w-3 h-3" /> View source
        </a>
        {me && !isAdmin && (
          <button
            onClick={save}
            disabled={saving || saved}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#125C4E] transition-colors disabled:opacity-60"
          >
            {saved ? <><Bookmark className="w-3 h-3" /> Saved</> : <><BookmarkPlus className="w-3 h-3" /> Save &amp; track</>}
          </button>
        )}
        {isAdmin && <AdminJobControls job={job} onChange={onChange} />}
      </div>

      {job.claimed_by_name && (
        <p className="mt-2 text-[11px] text-slate-500">Assigned to <span className="font-bold text-[#102B2A]">{job.claimed_by_name}</span>{job.booking_id ? ` · linked to Recycling OS booking ${String(job.booking_id).slice(0, 8)}` : ''}</p>
      )}
    </article>
  );
}

// Owner claim workflow: advance the job status, add a supported value estimate,
// and link the Recycling OS booking when the customer confirms.
function AdminJobControls({ job, onChange }) {
  const [open, setOpen] = useState(false);
  const [jobStatus, setJobStatus] = useState(job.job_status || 'potential_lead');
  const [value, setValue] = useState(job.estimated_value || '');
  const [bookingId, setBookingId] = useState(job.booking_id || '');
  const [claimedBy, setClaimedBy] = useState(job.claimed_by_name || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const save = async () => {
    setBusy(true);
    setMsg('');
    try {
      await base44.entities.PublicOpportunity.update(job.id, {
        job_status: jobStatus,
        estimated_value: value.trim().slice(0, 60),
        booking_id: bookingId.trim(),
        claimed_by_name: claimedBy.trim().slice(0, 120),
      });
      trackGA('discovery_job_status_updated', { to: jobStatus });
      setMsg('Saved.');
      onChange();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Could not save.');
    }
    setBusy(false);
  };

  return (
    <>
      <button onClick={() => setOpen(!open)} className="inline-flex items-center gap-1.5 rounded-full bg-[#102B2A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0a3020] transition-colors">
        {jobStatusMeta(job.job_status).label} ▾
      </button>
      {open && (
        <div className="mt-2 w-full rounded-xl border border-slate-200 bg-[#f4f7f5] p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status
              <select value={jobStatus} onChange={(e) => setJobStatus(e.target.value)} className="input py-2 text-xs mt-1">
                {JOB_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </label>
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned to
              <input value={claimedBy} onChange={(e) => setClaimedBy(e.target.value)} className="input py-2 text-xs mt-1" placeholder="Partner name" />
            </label>
          </div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimated value (only if actual info supports it)
            <input value={value} onChange={(e) => setValue(e.target.value)} className="input py-2 text-xs mt-1" placeholder="e.g. $120 quoted budget" />
          </label>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">Recycling OS booking id (when customer confirms)
            <input value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="input py-2 text-xs mt-1" placeholder="Booking id from dispatch" />
          </label>
          <div className="flex items-center gap-2">
            <button onClick={save} disabled={busy} className="rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white hover:bg-[#125C4E] disabled:opacity-60">{busy ? 'Saving…' : 'Save job'}</button>
            {msg && <span className="text-xs font-semibold text-slate-600">{msg}</span>}
          </div>
        </div>
      )}
    </>
  );
}