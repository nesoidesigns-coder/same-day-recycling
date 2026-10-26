import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Radar, Loader2, Play, Info, ShieldCheck, ShieldAlert, ExternalLink, Sparkles, Send, X, Briefcase, KeyRound } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { provinceLabel } from '@/lib/communityShared';
import { CLASSIFICATIONS, JOB_STATUSES, serviceCategoryLabel, jobStatusMeta } from '@/lib/discoveryShared';

const HEALTH = {
  connected: { label: 'Connected', tone: 'bg-[#187B65] text-white', dot: 'bg-[#187B65]' },
  credentials_missing: { label: 'Credentials needed', tone: 'bg-amber-100 text-amber-800', dot: 'bg-amber-400' },
  error: { label: 'API error', tone: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

const KINDS = [
  { id: 'job_announcement', label: 'Job announcement' },
  { id: 'contractor_recruitment', label: 'Contractor recruitment' },
  { id: 'community_update', label: 'Community update' },
];

export default function AdminDiscovery() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [runMsg, setRunMsg] = useState('');

  const status = useQuery({
    queryKey: ['discoveryStatus'],
    queryFn: async () => (await base44.functions.invoke('demandDiscovery', { action: 'status' })).data,
  });
  const jobs = useQuery({
    queryKey: ['adminLiveJobs'],
    queryFn: async () => (await base44.entities.PublicOpportunity.filter({ status: 'open' }, { sort: '-posted_at', limit: 30 })).items || [],
  });
  const drafts = useQuery({
    queryKey: ['publishDrafts'],
    queryFn: async () => (await base44.functions.invoke('redditPublish', { action: 'list' })).data,
  });

  const settings = status.data?.settings;
  const total = status.data?.total || 0;
  const health = status.data?.health || null;
  const byClassification = status.data?.by_classification || [];
  const byProvince = (status.data?.by_province || []).filter((r) => r.province_code);
  const maxCls = Math.max(1, ...byClassification.map((r) => r.count));
  const maxProv = Math.max(1, ...byProvince.map((r) => r.count));
  const healthMeta = health ? (HEALTH[health.status] || HEALTH.error) : null;

  const toggle = async (field, value) => {
    if (!settings) return;
    setBusy(true);
    try {
      await base44.entities.PublicDiscoverySettings.update(settings.id, { [field]: value });
      queryClient.invalidateQueries({ queryKey: ['discoveryStatus'] });
    } finally {
      setBusy(false);
    }
  };

  const runNow = async () => {
    setBusy(true);
    setRunMsg('');
    try {
      const res = await base44.functions.invoke('demandDiscovery', { action: 'run' });
      const d = res.data || {};
      setRunMsg(d.skipped
        ? `Skipped: ${d.reason}`
        : `Run finished (${d.status}): ${d.opportunities_saved} new saved from ${d.posts_fetched} posts — ${d.duplicates_skipped} duplicates, ${d.irrelevant_filtered} filtered as irrelevant.`);
      queryClient.invalidateQueries({ queryKey: ['discoveryStatus'] });
      queryClient.invalidateQueries({ queryKey: ['adminLiveJobs'] });
    } catch (err) {
      setRunMsg(err?.response?.data?.error || 'Run failed.');
    } finally {
      setBusy(false);
    }
  };

  if (status.isPending) {
    return <div className="flex items-center gap-2 py-10 text-sm text-slate-500" role="status"><Loader2 className="w-5 h-5 animate-spin text-[#187B65]" /> Loading discovery control center…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#102B2A] flex items-center gap-2"><Radar className="w-6 h-6 text-[#187B65]" /> National Discovery Control Center</h1>
        <p className="mt-1 text-sm text-slate-600">Reddit connection health, run audit logs, Live Jobs management and approval-gated publishing for the community's opportunity network.</p>
      </div>

      {/* Reddit connection health */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#187B65]" /> Reddit connection</h2>
        {health ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${healthMeta.tone}`}>
                <span className={`w-2 h-2 rounded-full ${healthMeta.dot}`} /> {healthMeta.label}
              </span>
              <span className="text-xs text-slate-500">Publishing account: {health.publishing ? health.account : 'not configured'}</span>
            </div>
            {health.message && <p className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 leading-relaxed"><KeyRound className="w-3.5 h-3.5 shrink-0 mt-0.5" /> {health.message}</p>}
            <div className="mt-3 grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-100 bg-[#f4f7f5] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last synchronization</p>
                <p className="mt-1 text-sm font-bold text-[#102B2A]">{settings?.last_run_at ? new Date(settings.last_run_at).toLocaleString('en-CA') : 'Never'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-[#f4f7f5] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Access mode</p>
                <p className="mt-1 text-sm font-bold text-[#102B2A]">{health.status === 'connected' ? 'Official OAuth API' : 'Not connected'}</p>
              </div>
              <div className="rounded-xl border border-slate-100 bg-[#f4f7f5] px-4 py-3">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recent API errors</p>
                <p className="mt-1 text-sm font-bold text-[#102B2A]">{(status.data?.runs || []).filter((r) => r.error).length} of {(status.data?.runs || []).length} recent runs</p>
              </div>
            </div>
          </>
        ) : <p className="mt-2 text-xs text-slate-500">Checking connection…</p>}
      </div>

      {/* Source controls */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-[#102B2A]">Authorized sources</h2>
        <p className="mt-1 text-xs text-slate-500 leading-relaxed">Only official public read endpoints are used through Reddit's authorized API. No logins are bypassed, no private or restricted content is accessed, and posts are stored as brief attributed excerpts with links.</p>
        <div className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-[#f4f7f5] px-4 py-3">
            <div>
              <p className="text-sm font-bold text-[#102B2A]">Reddit · public city-subreddit search</p>
              <p className="text-[11px] text-slate-500">Official OAuth read endpoint · 10 communities · brief excerpts + links only</p>
            </div>
            <Switch checked={!!settings?.reddit_enabled} onCheckedChange={(v) => toggle('reddit_enabled', v)} disabled={busy} />
          </div>
          <div className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-red-50 px-4 py-3">
            <div>
              <p className="text-sm font-bold text-red-800">Pause all discovery</p>
              <p className="text-[11px] text-red-600">Owner kill-switch — stops scheduled and manual runs.</p>
            </div>
            <Switch checked={!!settings?.paused} onCheckedChange={(v) => toggle('paused', v)} disabled={busy} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button onClick={runNow} disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-[#187B65] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#125C4E] transition-colors disabled:opacity-60">
            <Play className="w-4 h-4" /> Run discovery now
          </button>
          {settings?.last_run_at && <span className="text-xs text-slate-500">Last run: {new Date(settings.last_run_at).toLocaleString('en-CA')}</span>}
        </div>
        {runMsg && <p className="mt-3 rounded-xl bg-[#f4f7f5] border border-slate-100 px-4 py-2.5 text-xs font-semibold text-[#102B2A]">{runMsg}</p>}
      </div>

      {/* Live Jobs management */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><Briefcase className="w-4 h-4 text-[#187B65]" /> Live Jobs pipeline</h2>
        <p className="mt-1 text-xs text-slate-500">Move discovered requests through the pipeline. Reddit discussions stay potential leads until the customer confirms a booking; link the Recycling OS booking id when one is confirmed.</p>
        {jobs.isPending ? (
          <p className="mt-3 text-xs text-slate-500">Loading jobs…</p>
        ) : (jobs.data || []).length === 0 ? (
          <p className="mt-3 text-xs text-slate-500">No open opportunities yet. Run discovery once the Reddit connection is active.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {jobs.data.map((job) => <AdminJobRow key={job.id} job={job} onSaved={() => queryClient.invalidateQueries({ queryKey: ['adminLiveJobs'] })} />)}
          </div>
        )}
      </div>

      {/* Verified discoveries */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-[#187B65]" /> Verified public discoveries</h2>
        <p className="mt-1 text-xs text-slate-500">Currently open opportunities stored from verified public posts: <span className="font-bold text-[#102B2A]">{total}</span></p>
        <div className="mt-4 grid md:grid-cols-2 gap-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">By classification</p>
            {byClassification.length === 0 ? <p className="text-xs text-slate-500">No discoveries collected yet — they appear after the next discovery run.</p> : (
              <div className="space-y-2">
                {byClassification.map((r) => (
                  <div key={r.classification}>
                    <div className="flex justify-between text-xs font-semibold text-[#102B2A]"><span>{(CLASSIFICATIONS.find((c) => c.id === r.classification) || {}).label || r.classification}</span><span>{r.count}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-[#187B65]" style={{ width: `${(r.count / maxCls) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">By province</p>
            {byProvince.length === 0 ? <p className="text-xs text-slate-500">No discoveries collected yet — they appear after the next discovery run.</p> : (
              <div className="space-y-2">
                {byProvince.map((r) => (
                  <div key={r.province_code}>
                    <div className="flex justify-between text-xs font-semibold text-[#102B2A]"><span>{provinceLabel(r.province_code)}</span><span>{r.count}</span></div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 rounded-full bg-[#187B65]" style={{ width: `${(r.count / maxProv) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="mt-4 flex items-start gap-1.5 text-[11px] text-slate-500"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" /> These counts are indexed public posts — not an estimate of total Canadians seeking services. Source coverage limits apply and are shown below.</p>
      </div>

      {/* Publish center */}
      <PublishCenter drafts={drafts} onDone={() => queryClient.invalidateQueries({ queryKey: ['publishDrafts'] })} />

      {/* Run history / audit log */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-bold text-[#102B2A]">Run history &amp; audit log</h2>
        {(status.data?.runs || []).length === 0 ? (
          <p className="mt-2 text-xs text-slate-500">No discovery runs yet. Use "Run discovery now" or the daily schedule.</p>
        ) : (
          <table className="mt-3 w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-2 pr-3">Run</th><th className="py-2 pr-3">Status</th><th className="py-2 pr-3">Fetched</th><th className="py-2 pr-3">Dupes</th><th className="py-2 pr-3">Irrelevant</th><th className="py-2">Saved</th>
              </tr>
            </thead>
            <tbody className="text-slate-600">
              {status.data.runs.map((r) => (
                <tr key={r.id} className="border-t border-slate-100">
                  <td className="py-2 pr-3 font-semibold text-[#102B2A]">{new Date(r.started_at || r.created_date).toLocaleString('en-CA', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                  <td className="py-2 pr-3">{r.status}</td>
                  <td className="py-2 pr-3">{r.posts_fetched}</td>
                  <td className="py-2 pr-3">{r.duplicates_skipped}</td>
                  <td className="py-2 pr-3">{r.irrelevant_filtered}</td>
                  <td className="py-2 font-bold text-[#187B65]">{r.opportunities_saved}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {status.data?.runs?.some((r) => r.error) && (
          <p className="mt-3 flex items-start gap-1.5 text-[11px] text-red-600"><ShieldAlert className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Some runs reported source errors — see the run details in the database. Failed sources show as unavailable rather than producing fabricated results.</p>
        )}
      </div>
    </div>
  );
}

// One discovered job: advance status, add a supported value, link the booking.
function AdminJobRow({ job, onSaved }) {
  const [open, setOpen] = useState(false);
  const [jobStatus, setJobStatus] = useState(job.job_status || 'potential_lead');
  const [value, setValue] = useState(job.estimated_value || '');
  const [bookingId, setBookingId] = useState(job.booking_id || '');
  const [claimedBy, setClaimedBy] = useState(job.claimed_by_name || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const statusMeta = jobStatusMeta(job.job_status);

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
      setMsg('Saved.');
      onSaved();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Could not save.');
    }
    setBusy(false);
  };

  return (
    <div className="rounded-xl border border-slate-100 bg-[#f4f7f5] p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusMeta.tone}`}>{statusMeta.label}</span>
            <span className="text-[10px] font-semibold text-slate-500">{serviceCategoryLabel(job.service_category)}{job.city ? ` · ${job.city}` : ''}{job.province_code ? `, ${provinceLabel(job.province_code)}` : ''}</span>
          </div>
          <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="mt-1 flex items-center gap-1 text-xs font-bold text-[#102B2A] hover:text-[#187B65] break-words">
            {job.title} <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
        <button onClick={() => setOpen(!open)} className="shrink-0 rounded-full bg-[#102B2A] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0a3020]">{open ? 'Close' : 'Manage'}</button>
      </div>
      {open && (
        <div className="mt-3 grid sm:grid-cols-2 gap-2">
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Status
            <select value={jobStatus} onChange={(e) => setJobStatus(e.target.value)} className="input py-2 text-xs mt-1">
              {JOB_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Assigned to
            <input value={claimedBy} onChange={(e) => setClaimedBy(e.target.value)} className="input py-2 text-xs mt-1" placeholder="Partner name" />
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Estimated value (only if actual info supports it)
            <input value={value} onChange={(e) => setValue(e.target.value)} className="input py-2 text-xs mt-1" placeholder="e.g. $120 stated budget" />
          </label>
          <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Recycling OS booking id
            <input value={bookingId} onChange={(e) => setBookingId(e.target.value)} className="input py-2 text-xs mt-1" placeholder="When the customer confirms" />
          </label>
          <div className="sm:col-span-2 flex items-center gap-2">
            <button onClick={save} disabled={busy} className="rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white hover:bg-[#125C4E] disabled:opacity-60">{busy ? 'Saving…' : 'Save job'}</button>
            {msg && <span className="text-xs font-semibold text-slate-600">{msg}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

// Approval-gated Reddit publishing: AI draft → owner review → publish.
function PublishCenter({ drafts, onDone }) {
  const [sub, setSub] = useState('');
  const [kind, setKind] = useState('job_announcement');
  const [details, setDetails] = useState('');
  const [drafting, setDrafting] = useState(false);
  const [draftMsg, setDraftMsg] = useState('');
  const [publishMsg, setPublishMsg] = useState('');
  const [publishingId, setPublishingId] = useState('');

  const generate = async () => {
    if (!sub.trim()) { setDraftMsg('Enter a subreddit name first, e.g. vancouver.'); return; }
    setDrafting(true);
    setDraftMsg('');
    try {
      const res = await base44.functions.invoke('redditPublish', { action: 'draft', subreddit: sub.trim().replace(/^r\//i, ''), post_kind: kind, details });
      const d = res.data || {};
      setDraftMsg(d.allowed === false ? `Draft saved but BLOCKED: ${d.status}. Check the rules note before discarding.` : 'Draft generated and waiting for your review.');
      setDetails('');
      onDone();
    } catch (e) {
      setDraftMsg(e?.response?.data?.error || 'Could not generate the draft.');
    }
    setDrafting(false);
  };

  const publish = async (d) => {
    setPublishingId(d.id);
    setPublishMsg('');
    try {
      const res = await base44.functions.invoke('redditPublish', { action: 'publish', draft_id: d.id });
      setPublishMsg(`Published: ${res.data.reddit_url}`);
      onDone();
    } catch (e) {
      setPublishMsg(e?.response?.data?.error || 'Publish failed.');
    }
    setPublishingId('');
  };

  const decline = async (d) => {
    setPublishingId(d.id);
    try {
      await base44.functions.invoke('redditPublish', { action: 'decline', draft_id: d.id, note: 'Declined by the owner.' });
      onDone();
    } catch (e) {
      setPublishMsg(e?.response?.data?.error || 'Could not decline.');
    }
    setPublishingId('');
  };

  const list = drafts.data?.drafts || [];

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><Send className="w-4 h-4 text-[#187B65]" /> Publish to Reddit</h2>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">AI drafts tailored to each community's public rules, reviewed by you, published one at a time through the authorized Reddit API. Communities whose rules prohibit this content are blocked automatically. Max one post per community per week.</p>

      <div className="mt-4 grid sm:grid-cols-3 gap-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Subreddit
          <input value={sub} onChange={(e) => setSub(e.target.value)} className="input py-2 text-xs mt-1" placeholder="e.g. vancouver" />
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Post type
          <select value={kind} onChange={(e) => setKind(e.target.value)} className="input py-2 text-xs mt-1">
            {KINDS.map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
          </select>
        </label>
        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Extra details (optional)
          <input value={details} onChange={(e) => setDetails(e.target.value)} className="input py-2 text-xs mt-1" placeholder="What to include" />
        </label>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button onClick={generate} disabled={drafting} className="inline-flex items-center gap-2 rounded-full bg-[#102B2A] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#0a3020] disabled:opacity-60">
          <Sparkles className="w-4 h-4" /> {drafting ? 'Drafting with rules check…' : 'Generate AI draft'}
        </button>
        {draftMsg && <span className="text-xs font-semibold text-[#102B2A]">{draftMsg}</span>}
      </div>

      {list.length > 0 && (
        <div className="mt-5 space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Drafts &amp; published posts</p>
          {list.map((d) => (
            <div key={d.id} className="rounded-xl border border-slate-100 bg-[#f4f7f5] p-3">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide">
                <span className="rounded-full bg-slate-200 text-slate-700 px-2 py-0.5">r/{d.subreddit}</span>
                <span className="rounded-full bg-slate-100 text-slate-600 px-2 py-0.5">{(KINDS.find((k) => k.id === d.post_kind) || {}).label || d.post_kind}</span>
                <span className={`rounded-full px-2 py-0.5 ${d.status === 'published' ? 'bg-[#187B65] text-white' : d.status === 'blocked' ? 'bg-red-100 text-red-700' : d.status === 'declined' ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-800'}`}>{d.status.replace('_', ' ')}</span>
              </div>
              <p className="mt-1.5 text-xs font-bold text-[#102B2A] break-words">{d.title}</p>
              <details className="mt-1">
                <summary className="cursor-pointer text-[11px] font-semibold text-slate-500">Read full draft</summary>
                <p className="mt-1 whitespace-pre-wrap text-[11px] text-slate-600 leading-relaxed">{d.body}</p>
              </details>
              {d.rules_note && <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed"><span className="font-bold">Rules check:</span> {d.rules_note}</p>}
              {d.reddit_url && <a href={d.reddit_url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#187B65] hover:underline"><ExternalLink className="w-3 h-3" /> View on Reddit</a>}
              {d.status === 'pending_review' && (
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => publish(d)} disabled={publishingId === d.id} className="inline-flex items-center gap-1.5 rounded-full bg-[#187B65] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#125C4E] disabled:opacity-60"><Send className="w-3 h-3" /> {publishingId === d.id ? 'Publishing…' : 'Approve &amp; publish'}</button>
                  <button onClick={() => decline(d)} disabled={publishingId === d.id} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:border-red-300 hover:text-red-600"><X className="w-3 h-3" /> Decline</button>
                </div>
              )}
            </div>
          ))}
          {publishMsg && <p className="text-xs font-semibold text-[#102B2A]">{publishMsg}</p>}
          {!drafts.data?.publishing_configured && (
            <p className="flex items-start gap-1.5 text-[11px] text-amber-700"><KeyRound className="w-3.5 h-3.5 shrink-0 mt-0.5" /> Publishing also needs the full Reddit credentials (client ID, secret, account username and password) on the Secrets page.</p>
          )}
        </div>
      )}
    </div>
  );
}