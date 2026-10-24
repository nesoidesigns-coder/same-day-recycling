import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ExternalLink, ChevronDown, ChevronRight, ShieldCheck, ClipboardList, Phone } from 'lucide-react';
import { JOB_STATUSES, jobStatusMeta, classificationMeta, serviceCategoryLabel } from '@/lib/discoveryShared';
import { fmtTime } from './useObservatory';

const PIPELINE_STATUSES = ['potential_lead', 'verified_request', 'available_job', 'assigned', 'completed'];

// Opportunity-to-booking pipeline — admin only. Every action is a deliberate
// human step: nothing is auto-contacted, auto-published or auto-booked.
export default function OpportunityPipeline({ feedData }) {
  const [open, setOpen] = useState(null);
  const jobs = useQuery({
    queryKey: ['observatoryPipelineJobs'],
    queryFn: async () => {
      const res = await base44.entities.PublicOpportunity.filter(
        { status: 'open', classification: { $in: ['active_request', 'potential_opportunity'] } },
        { sort: '-posted_at', limit: 40 },
      );
      return res.items || [];
    },
  });
  const partners = useQuery({
    queryKey: ['observatoryPipelinePartners'],
    queryFn: async () => (await base44.entities.Partner.filter({}, { limit: 500 })).items || [],
  });

  const coveredBy = (city) => {
    const c = String(city || '').trim().toLowerCase();
    if (!c) return [];
    return (partners.data || []).filter(
      (p) => p.active && p.verified
        && ([p.city, ...(p.service_cities || [])].some((x) => String(x || '').trim().toLowerCase() === c)),
    );
  };

  return (
    <div className="rounded-3xl border border-market-line bg-market-surface p-4 sm:p-6">
      <h3 className="text-sm font-extrabold text-market-ink">Opportunity-to-Booking Pipeline</h3>
      <p className="mt-0.5 text-xs text-market-muted">
        Admin workspace for qualified public opportunities: review the original source, check verified territory coverage, advance the lead manually. No automatic contacting, publishing or booking.
      </p>

      {jobs.isLoading && <p className="mt-4 text-xs text-market-muted">Loading qualified opportunities…</p>}
      {jobs.isError && <p className="mt-4 text-xs text-red-300">Could not load the pipeline right now.</p>}
      {jobs.data && jobs.data.length === 0 && (
        <p className="mt-4 text-xs text-market-muted">No qualified public opportunities in the pipeline yet. The discovery engine only adds real, classified public requests.</p>
      )}

      <div className="mt-3 space-y-2">
        {(jobs.data || []).map((job) => {
          const status = jobStatusMeta(job.job_status);
          const classification = classificationMeta(job.classification);
          const coverage = coveredBy(job.city);
          const isOpen = open === job.id;
          return (
            <div key={job.id} className="rounded-2xl border border-market-line bg-market-bg">
              <button onClick={() => setOpen(isOpen ? null : job.id)} className="flex w-full flex-wrap items-center gap-2 px-3.5 py-3 text-left" aria-expanded={isOpen}>
                {isOpen ? <ChevronDown className="h-3.5 w-3.5 text-market-accent" /> : <ChevronRight className="h-3.5 w-3.5 text-market-muted" />}
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest ${status.tone}`}>{status.label}</span>
                <span className="text-xs font-bold text-market-ink flex-1 min-w-[180px]">{job.title}</span>
                {job.city && <span className="text-[11px] text-market-muted">{job.city}</span>}
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold tracking-widest ${classification.tone}`}>{classification.label}</span>
              </button>
              {isOpen && <PipelineDetail job={job} coverage={coverage} feedData={feedData} onSaved={() => jobs.refetch()} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PipelineDetail({ job, coverage, onSaved }) {
  const [jobStatus, setJobStatus] = useState(job.job_status || 'potential_lead');
  const [claimedBy, setClaimedBy] = useState(job.claimed_by_name || '');
  const [bookingId, setBookingId] = useState(job.booking_id || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const idx = Math.max(0, PIPELINE_STATUSES.indexOf(jobStatus));
  const next = PIPELINE_STATUSES[idx + 1];

  const save = async (patch) => {
    setBusy(true);
    setMsg('');
    try {
      await base44.entities.PublicOpportunity.update(job.id, {
        job_status: jobStatus,
        claimed_by_name: claimedBy.trim().slice(0, 120),
        booking_id: bookingId.trim(),
        ...(patch || {}),
      });
      setMsg('Saved.');
      onSaved();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Could not save.');
    }
    setBusy(false);
  };

  return (
    <div className="border-t border-market-line px-3.5 py-3 text-[11px] text-market-muted space-y-3">
      <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-wider">
        {PIPELINE_STATUSES.map((s, i) => (
          <span key={s} className={`rounded-full px-2 py-0.5 ${i <= idx ? 'bg-[#187B65]/25 text-[#54D9AE]' : 'bg-white/10 text-market-muted'}`}>{s.replace(/_/g, ' ')}</span>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="text-[10px] font-bold uppercase tracking-wider text-market-muted">
          Lead status
          <select value={jobStatus} onChange={(e) => setJobStatus(e.target.value)} className="mt-1 w-full rounded-xl border border-market-line bg-market-bg px-3 py-2 text-xs text-market-ink">
            {JOB_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wider text-market-muted">
          Assigned contractor (manual)
          <input value={claimedBy} onChange={(e) => setClaimedBy(e.target.value)} className="mt-1 w-full rounded-xl border border-market-line bg-market-bg px-3 py-2 text-xs text-market-ink" placeholder="Verified partner name" />
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wider text-market-muted">
          Booking id (when customer confirms)
          <input value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="mt-1 w-full rounded-xl border border-market-line bg-market-bg px-3 py-2 text-xs text-market-ink" placeholder="From dispatch" />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-market-line px-3 py-1.5 font-bold text-[#54D9AE] hover:underline">
          <ExternalLink className="h-3 w-3" /> View original source
        </a>
        {next && (
          <button onClick={() => { setJobStatus(next); }} disabled={busy} className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] px-3 py-1.5 font-bold text-white disabled:opacity-60">
            <ClipboardList className="h-3 w-3" /> Advance to {next.replace(/_/g, ' ')}
          </button>
        )}
        <button onClick={() => save()} disabled={busy} className="rounded-full border border-market-line px-3 py-1.5 font-bold text-market-ink disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
        {msg && <span className="self-center font-semibold text-[#54D9AE]">{msg}</span>}
      </div>

      <div className="rounded-xl border border-market-line px-3 py-2.5">
        <p className="font-bold text-market-ink"><ShieldCheck className="mr-1 inline h-3 w-3 text-[#54D9AE]" /> Verified territory coverage for {job.city || 'this city'}:</p>
        {coverage.length ? (
          <ul className="mt-1 space-y-0.5">
            {coverage.slice(0, 5).map((p) => (
              <li key={p.id}>• {p.name} — home: {p.city}{(p.service_cities || []).length ? ` · serves ${(p.service_cities || []).length} additional municipalities` : ''} · {p.truck_capacity || 1} truck/day</li>
            ))}
          </ul>
        ) : (
          <p className="mt-1">No verified contractor covers this city yet — recorded as unmatched demand, not as availability.</p>
        )}
      </div>

      <details className="rounded-xl border border-market-line px-3 py-2.5">
        <summary className="cursor-pointer font-bold text-market-ink">Prepare a compliant response (draft only — nothing sends)</summary>
        <p className="mt-2 leading-relaxed">
          Template: "Hi — I saw your public post about {serviceCategoryLabel(job.service_category)} in {job.city || 'your area'} (posted {fmtTime(job.posted_at)}). Same Day Recycling coordinates verified, insured local contractors. If you'd like a quote, you can reach us at (604) 849-1745 or book online. We responded here because your post was public; no other personal details were collected."
        </p>
        <p className="mt-1.5 text-market-muted">Use this only where the source platform permits business replies. Copy it manually — the platform never auto-contacts anyone.</p>
        <p className="mt-1.5 inline-flex items-center gap-1.5 font-bold text-[#54D9AE]"><Phone className="h-3 w-3" /> Prefer the customer to confirm through Recycling OS before creating any booking.</p>
      </details>
    </div>
  );
}