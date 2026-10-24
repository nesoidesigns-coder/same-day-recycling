import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Users, MessageSquare, Briefcase, Flag, BookOpen, BadgeCheck, ShieldBan, Sparkles, Plus } from 'lucide-react';
import { memberTypeLabel, resourceCategoryLabel, RESOURCE_CATEGORIES } from '@/lib/communityShared';

const num = (n) => Number(n || 0).toLocaleString('en-CA');

export default function AdminCommunity() {
  const [tab, setTab] = useState('overview');
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-2xl font-extrabold text-[#102B2A]">Community Command Center</h1>
      <p className="mt-1 text-sm text-slate-500">Everything below is actual community data — never estimates.</p>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
        {[['overview', 'Overview'], ['moderation', 'Moderation'], ['members', 'Members'], ['library', 'Library'], ['insights', 'AI Insights']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-colors ${tab === id ? 'border-[#187B65] bg-[#187B65] text-white' : 'border-[#187B65]/30 text-slate-600 hover:border-[#187B65]'}`}>{label}</button>
        ))}
      </div>
      {tab === 'overview' && <OverviewTab />}
      {tab === 'moderation' && <ModerationTab />}
      {tab === 'members' && <MembersTab />}
      {tab === 'library' && <LibraryAdminTab />}
      {tab === 'insights' && <InsightsTab />}
    </div>
  );
}

const communityCall = async (payload) => (await base44.functions.invoke('communityAdmin', payload)).data;

function OverviewTab() {
  const metrics = useQuery({ queryKey: ['communityAdmin', 'metrics'], queryFn: () => communityCall({ action: 'metrics' }), refetchInterval: 120000, retry: false });
  const m = metrics.data?.metrics;
  const cards = [
    ['Registered members', m?.members_total, Users],
    ['Verified members', m?.members_verified, BadgeCheck],
    ['Active participants', m?.active_participants, Users],
    ['Discussions created', m?.discussions_total, MessageSquare],
    ['Questions answered', m?.questions_answered, MessageSquare],
    ['Comments', m?.comments_total, MessageSquare],
    ['Open opportunities', m?.opportunities_open, Briefcase],
    ['Open reports', m?.reports_open, Flag],
    ['Resources published', m?.resources_published, BookOpen],
    ['Member→software conversions', m?.member_to_software_conversions, Sparkles],
  ];
  return (
    <div className="space-y-4">
      {metrics.isPending && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Loading community metrics…</div>}
      {metrics.isError && <p role="alert" className="text-sm text-red-600">{metrics.error?.response?.data?.error || 'Metrics could not be loaded.'}</p>}
      {m && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {cards.map(([label, value, Icon]) => (
            <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400"><Icon className="w-3.5 h-3.5 text-[#187B65]" /> {label}</div>
              <div className="mt-1.5 text-xl font-bold text-[#102B2A] tabular-nums">{num(value)}</div>
            </div>
          ))}
        </div>
      )}
      {m && (
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Discussions by channel</div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(m.by_channel || {}).map(([c, n]) => (
              <span key={c} className="rounded-full bg-[#f4f7f5] border border-[#187B65]/30 px-3 py-1 text-xs font-bold text-[#102B2A]">{c.replace(/_/g, ' ')}: {n}</span>
            ))}
            {Object.keys(m.by_channel || {}).length === 0 && <span className="text-xs text-slate-400">No discussions yet.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

function ModerationTab() {
  const queryClient = useQueryClient();
  const queue = useQuery({ queryKey: ['communityAdmin', 'queue'], queryFn: () => communityCall({ action: 'queue' }), retry: false });
  const act = async (payload) => {
    await communityCall(payload);
    queryClient.invalidateQueries({ queryKey: ['communityAdmin'] });
  };
  const q = queue.data;
  return (
    <div className="space-y-4">
      {queue.isPending && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Loading queues…</div>}
      <QueueSection title={`Reported content (${(q?.reports || []).length})`}>
        {(q?.reports || []).map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200/80 bg-[#f6f8f7] p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 font-bold uppercase">{r.reason}</span>
              <span className="text-slate-500">{r.target_type} · {r.target_id.slice(0, 8)}… · {new Date(r.created_date).toLocaleDateString('en-CA')}</span>
            </div>
            {r.details && <p className="mt-2 text-sm text-slate-600">{r.details}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => act({ action: 'remove_post', post_id: r.target_id })} disabled={r.target_type !== 'post'} className="rounded-full bg-red-50 border border-red-400/40 px-3 py-1.5 text-xs font-bold text-red-700 disabled:opacity-40">Remove content</button>
              <button onClick={() => act({ action: 'resolve_report', report_id: r.id, status: 'actioned', note: 'Content removed.' })} className="rounded-full border border-[#187B65]/40 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-[#187B65]">Mark actioned</button>
              <button onClick={() => act({ action: 'resolve_report', report_id: r.id, status: 'dismissed', note: 'No violation found.' })} className="rounded-full border border-[#187B65]/40 px-3 py-1.5 text-xs font-bold text-slate-600 hover:border-[#187B65]">Dismiss</button>
            </div>
          </div>
        ))}
      </QueueSection>
      <QueueSection title={`Posts awaiting review (${(q?.flagged_posts || []).length})`}>
        {(q?.flagged_posts || []).map((p) => (
          <div key={p.id} className="rounded-xl border border-slate-200/80 bg-[#f6f8f7] p-4">
            <div className="text-sm font-bold text-[#102B2A]">{p.title}</div>
            <p className="mt-1 text-xs text-slate-500 line-clamp-2">{p.body}</p>
            <div className="mt-3 flex gap-2">
              <button onClick={() => act({ action: 'restore_post', post_id: p.id })} className="rounded-full bg-[#187B65] px-3 py-1.5 text-xs font-bold text-white">Approve & publish</button>
              <button onClick={() => act({ action: 'remove_post', post_id: p.id })} className="rounded-full bg-red-50 border border-red-400/40 px-3 py-1.5 text-xs font-bold text-red-700">Remove</button>
            </div>
          </div>
        ))}
      </QueueSection>
      <QueueSection title={`Resources pending review (${(q?.pending_resources || []).length})`}>
        {(q?.pending_resources || []).map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200/80 bg-[#f6f8f7] p-4">
            <div className="text-sm font-bold text-[#102B2A]">{r.title}</div>
            <div className="text-[11px] text-slate-400">{resourceCategoryLabel(r.category)}</div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => act({ action: 'publish_resource', resource_id: r.id, review_note: 'Reviewed by owner.' })} className="rounded-full bg-[#187B65] px-3 py-1.5 text-xs font-bold text-white">Publish</button>
            </div>
          </div>
        ))}
      </QueueSection>
    </div>
  );
}

const QueueSection = ({ title, children }) => (
  <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
    <h2 className="text-sm font-bold text-[#102B2A] mb-3">{title}</h2>
    {children}
  </div>
);

function MembersTab() {
  const queryClient = useQueryClient();
  const members = useQuery({ queryKey: ['communityAdmin', 'members'], queryFn: () => communityCall({ action: 'members' }), retry: false });
  const act = async (payload) => {
    await communityCall(payload);
    queryClient.invalidateQueries({ queryKey: ['communityAdmin'] });
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
      <h2 className="text-sm font-bold text-[#102B2A] mb-3">Member management ({num(members.data?.members?.length)})</h2>
      {members.isPending && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="w-4 h-4 animate-spin text-[#187B65]" /> Loading members…</div>}
      <div className="space-y-3">
        {(members.data?.members || []).map((m) => (
          <div key={m.id} className="rounded-xl border border-slate-200/80 bg-[#f6f8f7] p-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-bold text-[#102B2A] flex items-center gap-2">{m.display_name}
                {m.verification_status === 'verified' && <BadgeCheck className="w-4 h-4 text-[#187B65]" />}
                {m.suspended && <span className="rounded-full bg-red-50 text-red-700 px-2 py-0.5 text-[10px] font-bold uppercase">Suspended</span>}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">{memberTypeLabel(m.member_type)} · {m.email}{m.city ? ` · ${m.city}` : ''}</div>
              {m.verification_status === 'pending' && m.verification_note && <p className="mt-1.5 text-xs text-amber-700">Submitted evidence: {m.verification_note}</p>}
              {m.verified_details && <p className="mt-1 text-[11px] text-slate-400">Verified: {m.verified_details}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {m.verification_status !== 'verified' && (
                <button onClick={() => act({ action: 'verify_member', profile_id: m.id, decision: 'verified', verified_details: m.verification_note || 'Business credentials reviewed by the owner.' })} className="rounded-full bg-[#187B65] px-3 py-1.5 text-xs font-bold text-white">Verify</button>
              )}
              {m.verification_status === 'pending' && (
                <button onClick={() => act({ action: 'verify_member', profile_id: m.id, decision: 'declined' })} className="rounded-full border border-red-400/40 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700">Decline</button>
              )}
              {!m.suspended
                ? <button onClick={() => act({ action: 'suspend_member', profile_id: m.id })} className="rounded-full border border-red-400/40 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 flex items-center gap-1"><ShieldBan className="w-3.5 h-3.5" /> Suspend</button>
                : <button onClick={() => act({ action: 'reinstate_member', profile_id: m.id })} className="rounded-full border border-[#187B65]/40 px-3 py-1.5 text-xs font-bold text-slate-600">Reinstate</button>}
            </div>
          </div>
        ))}
        {members.data?.members?.length === 0 && <p className="text-xs text-slate-400">No members have joined yet.</p>}
      </div>
    </div>
  );
}

function LibraryAdminTab() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ title: '', category: 'starting_out', body: '', review_note: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const resources = useQuery({ queryKey: ['communityAdmin', 'resources'], queryFn: async () => (await base44.entities.CommunityResource.list({ limit: 200, sort: '-created_date' })).items || [], retry: false });
  const create = async (publish) => {
    setBusy(true);
    setError('');
    try {
      await communityCall({ action: 'create_resource', ...form, publish_now: publish });
      setForm({ title: '', category: 'starting_out', body: '', review_note: '' });
      queryClient.invalidateQueries({ queryKey: ['communityAdmin', 'resources'] });
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not save the resource.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
        <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><Plus className="w-4 h-4 text-[#187B65]" /> New library resource</h2>
        <p className="mt-1 text-[11px] text-slate-400">Topics on legal, tax, safety or regulation require a human review note before publishing.</p>
        <div className="mt-3 space-y-2.5">
          <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#102B2A] placeholder:text-slate-400" placeholder="Resource title" />
          <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#102B2A]">
            {RESOURCE_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
          <textarea value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} rows={6} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#102B2A] placeholder:text-slate-400 resize-none" placeholder="Resource content" />
          <input value={form.review_note} onChange={(e) => setForm((f) => ({ ...f, review_note: e.target.value }))} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[#102B2A] placeholder:text-slate-400" placeholder="Human review note (required for regulated topics)" />
          {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
          <div className="flex gap-2">
            <button onClick={() => create(true)} disabled={busy || !form.title || !form.body} className="rounded-full bg-[#187B65] px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Save & publish</button>
            <button onClick={() => create(false)} disabled={busy || !form.title || !form.body} className="rounded-full border border-[#187B65]/40 px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50">Save as draft</button>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4">
        <h2 className="text-sm font-bold text-[#102B2A] mb-3">All resources ({num(resources.data?.length)})</h2>
        <div className="space-y-2">
          {(resources.data || []).map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-[#f6f8f7] px-4 py-3">
              <div>
                <div className="text-sm font-bold text-[#102B2A]">{r.title}</div>
                <div className="text-[11px] text-slate-400">{resourceCategoryLabel(r.category)} · {r.status}</div>
              </div>
              {r.status !== 'published' && (
                <button onClick={async () => { await communityCall({ action: 'publish_resource', resource_id: r.id }); queryClient.invalidateQueries({ queryKey: ['communityAdmin', 'resources'] }); }} className="rounded-full bg-[#187B65] px-3 py-1.5 text-xs font-bold text-white">Publish</button>
              )}
            </div>
          ))}
          {resources.data?.length === 0 && <p className="text-xs text-slate-400">No resources yet.</p>}
        </div>
      </div>
    </div>
  );
}

function InsightsTab() {
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const run = async () => {
    setBusy(true);
    setError('');
    try {
      setData((await base44.functions.invoke('communityAdmin', { action: 'insights' })).data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Insights could not be generated.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5">
      <h2 className="text-sm font-bold text-[#102B2A] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#187B65]" /> AI-assisted community insights</h2>
      <p className="mt-1 text-xs text-slate-500 leading-relaxed">Analyzes actual community records — discussion titles, reply activity, member mix. Advisory only; nothing is executed.</p>
      <button onClick={run} disabled={busy} className="mt-3 rounded-full bg-[#187B65] px-5 py-2.5 text-xs font-bold text-white disabled:opacity-60 flex items-center gap-2">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Generate insights
      </button>
      {error && <p className="mt-3 text-sm text-red-600" role="alert">{error}</p>}
      {data?.insights && (
        <div className="mt-4 space-y-3 text-sm">
          <p className="text-[#102B2A] leading-relaxed">{data.insights.summary}</p>
          {(data.insights.recurring_questions || []).length > 0 && <InsightList title="Recurring member questions" items={data.insights.recurring_questions} />}
          {(data.insights.library_topics || []).length > 0 && <InsightList title="Knowledge library topics worth developing" items={data.insights.library_topics} />}
          {(data.insights.moderation_attention || []).length > 0 && <InsightList title="Needs moderator attention" items={data.insights.moderation_attention} />}
          {(data.insights.recommendations || []).length > 0 && <InsightList title="Recommendations" items={data.insights.recommendations} />}
          <p className="text-[11px] text-slate-400">{data.ai_note}</p>
        </div>
      )}
    </div>
  );
}

const InsightList = ({ title, items }) => (
  <div className="rounded-xl border border-slate-200/80 bg-[#f6f8f7] px-4 py-3">
    <div className="text-[10px] font-bold uppercase tracking-wider text-[#187B65]">{title}</div>
    <ul className="mt-1.5 space-y-1 text-xs text-slate-600 list-disc pl-4">
      {items.map((i, n) => <li key={n}>{i}</li>)}
    </ul>
  </div>
);