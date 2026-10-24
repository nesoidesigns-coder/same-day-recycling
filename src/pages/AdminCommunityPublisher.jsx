import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Loader2, Bot, Check, X, Lightbulb, ShieldAlert, Sparkles, FileText, ExternalLink } from 'lucide-react';
import { channelLabel } from '@/lib/communityShared';

const CATEGORY_LABELS = {
  business_intelligence: 'Business Intelligence',
  recycling_knowledge: 'Recycling Knowledge',
  homeowner_advice: 'Homeowner Advice',
  industry_insights: 'Industry Insights',
};

const KIND_LABELS = {
  educational: 'Educational post',
  question: 'Discussion question',
  insight: 'Weekly business insight',
  feature: 'Recycling feature',
};

export default function AdminCommunityPublisher() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState('');
  const [ideas, setIdeas] = useState([]);

  const settingsQ = useQuery({
    queryKey: ['publisherSettings'],
    queryFn: async () => (await base44.entities.CommunityPublisherSettings.filter({}, { limit: 1 })).items?.[0] || null,
  });
  const queueQ = useQuery({
    queryKey: ['publisherQueue'],
    queryFn: async () => (await base44.entities.CommunityDraft.filter({ status: 'pending_review' }, { sort: 'created_date', limit: 30 })).items || [],
  });
  const publishedQ = useQuery({
    queryKey: ['publisherPublished'],
    queryFn: async () => (await base44.entities.CommunityPost.filter({ ai_generated: true }, { sort: '-created_date', limit: 25 })).items || [],
  });
  const reportsQ = useQuery({
    queryKey: ['publisherReports'],
    queryFn: async () => (await base44.entities.CommunityReport.filter({ status: 'open' }, { limit: 20 })).items || [],
  });
  const postTitlesQ = useQuery({
    queryKey: ['publisherPostTitles'],
    queryFn: async () => (await base44.entities.CommunityPost.filter({ status: 'published' }, { sort: '-created_date', limit: 200 })).items || [],
  });

  const settings = settingsQ.data;
  const run = async (label, fn) => {
    setBusy(label);
    setMsg('');
    try {
      const result = await fn();
      qc.invalidateQueries({ queryKey: ['publisherQueue'] });
      qc.invalidateQueries({ queryKey: ['publisherPublished'] });
      qc.invalidateQueries({ queryKey: ['publisherSettings'] });
      if (result) setMsg(typeof result === 'string' ? result : JSON.stringify(result));
    } catch (e) {
      setMsg(e?.response?.data?.error || e?.message || 'Action failed.');
    } finally {
      setBusy('');
    }
  };

  const saveSettings = (patch) => run('settings', async () => {
    if (settings) await base44.entities.CommunityPublisherSettings.update(settings.id, patch);
    else await base44.entities.CommunityPublisherSettings.create(patch);
    return 'Saved.';
  });

  const publishDraft = (d) => run(`pub-${d.id}`, async () => {
    const res = await base44.functions.invoke('communityPublisher', { action: 'publish_draft', draft_id: d.id });
    return res.data?.published ? 'Published to the community feed.' : 'Could not publish.';
  });
  const declineDraft = (d) => run(`dec-${d.id}`, async () => {
    const note = window.prompt('Why is this draft declined? (recorded in the audit trail)') || '';
    await base44.functions.invoke('communityPublisher', { action: 'decline', draft_id: d.id, note });
    return 'Draft declined.';
  });
  const generateDraft = (topic) => run('generate', async () => {
    const res = await base44.functions.invoke('communityPublisher', { action: 'generate', topic });
    return res.data?.draft ? `Draft created: ${res.data.draft.title}` : 'No draft returned.';
  });
  const suggestTopics = () => run('suggest', async () => {
    const res = await base44.functions.invoke('communityPublisher', { action: 'suggest' });
    setIdeas(res.data?.ideas || []);
    return null;
  });

  const postTitleById = {};
  for (const p of postTitlesQ.data || []) postTitleById[p.id] = p.title;
  const aiPostIds = new Set((publishedQ.data || []).map((p) => p.id));
  const alerts = (reportsQ.data || []).filter((r) => r.target_type === 'post' && postTitleById[r.target_id] && aiPostIds.has(r.target_id));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Bot className="w-6 h-6 text-mint" /> AI Community Publisher</h1>
        <p className="mt-1 text-sm text-emerald-100/70">Recycling OS Intelligence drafts, approval queue, calendar and controls. Auto-publish stays off until you turn it on after moderation testing.</p>
      </div>

      {msg && <div className="rounded-xl border border-[#187B65]/40 bg-[#0c3b24] px-4 py-2.5 text-sm text-emerald-100 break-words">{msg}</div>}

      {/* Controls */}
      <section className="rounded-2xl border border-white/10 bg-[#0c3b24]/60 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-mint">Publishing controls</h2>
        {settingsQ.isPending ? (
          <div className="mt-3 text-sm text-emerald-100/60"><Loader2 className="w-4 h-4 inline animate-spin" /> Loading…</div>
        ) : (
          <div className="mt-3 grid sm:grid-cols-2 gap-3">
            <Toggle label="Paused (kill-switch)" desc="Stops all AI publishing immediately." on={!!settings?.paused} onToggle={() => saveSettings({ paused: !settings?.paused })} busy={busy === 'settings'} />
            <Toggle label="Automatic publishing" desc="Publish new low-risk drafts without approval." on={!!settings?.auto_publish} onToggle={() => saveSettings({ auto_publish: !settings?.auto_publish })} busy={busy === 'settings'} />
            <Toggle label="Generate images on publish" desc="Creates an AI image for posts without one." on={!!settings?.generate_images} onToggle={() => saveSettings({ generate_images: !settings?.generate_images })} busy={busy === 'settings'} />
            <div className="rounded-xl border border-white/10 px-4 py-3 text-sm text-emerald-100/80">
              <p className="font-bold text-white">Daily schedule</p>
              <p className="mt-1 text-xs text-emerald-100/60">One draft per day at 6am (kind rotates: educational how-tos, discussion questions, weekly insight, weekly feature). Generation pauses when {settings?.queue_max || 3} drafts await review.</p>
            </div>
          </div>
        )}
      </section>

      {/* Approval queue */}
      <section className="rounded-2xl border border-white/10 bg-[#0c3b24]/60 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-mint">Draft approval queue ({queueQ.data?.length || 0})</h2>
          <div className="flex gap-2">
            <button onClick={() => suggestTopics()} disabled={busy === 'suggest'} className="inline-flex items-center gap-1.5 rounded-full border border-mint/40 px-3 py-1.5 text-xs font-bold text-mint hover:bg-mint/10 transition-colors disabled:opacity-50"><Lightbulb className="w-3.5 h-3.5" /> Topic ideas</button>
            <button onClick={() => generateDraft()} disabled={busy === 'generate'} className="inline-flex items-center gap-1.5 rounded-full bg-mint px-3 py-1.5 text-xs font-bold text-[#051511] hover:bg-mint/80 transition-colors disabled:opacity-50"><Sparkles className="w-3.5 h-3.5" /> Generate draft now</button>
          </div>
        </div>
        {ideas.length > 0 && (
          <div className="mt-3 rounded-xl border border-white/10 p-3">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-100/60">Suggested topics</p>
            <div className="mt-2 space-y-1.5">
              {ideas.map((idea, i) => (
                <div key={i} className="flex items-center justify-between gap-2 rounded-lg bg-white/5 px-3 py-2">
                  <div className="min-w-0"><p className="text-sm font-semibold text-white truncate">{idea.topic}</p><p className="text-xs text-emerald-100/60 truncate">{idea.why}</p></div>
                  <button onClick={() => generateDraft(idea.topic)} disabled={busy === 'generate'} className="shrink-0 rounded-full border border-mint/40 px-2.5 py-1 text-[11px] font-bold text-mint hover:bg-mint/10 transition-colors disabled:opacity-50">Draft it</button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="mt-3 space-y-3">
          {(queueQ.data || []).map((d) => (
            <div key={d.id} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                <span className="rounded-full bg-mint/15 text-mint px-2 py-0.5">{CATEGORY_LABELS[d.category]}</span>
                <span className="rounded-full bg-white/10 text-emerald-100/70 px-2 py-0.5">{KIND_LABELS[d.kind]}</span>
                <span className="text-emerald-100/40">{channelLabel(d.channel)}</span>
              </div>
              <h3 className="mt-2 text-sm font-bold text-white">{d.title}</h3>
              <p className="mt-1.5 text-sm text-emerald-100/70 whitespace-pre-line leading-relaxed">{d.body}</p>
              {d.source_note && <p className="mt-2 text-xs text-gold">Source note: {d.source_note}</p>}
              <div className="mt-3 flex gap-2">
                <button onClick={() => publishDraft(d)} disabled={busy === `pub-${d.id}`} className="inline-flex items-center gap-1.5 rounded-full bg-mint px-4 py-2 text-xs font-bold text-[#051511] hover:bg-mint/80 transition-colors disabled:opacity-50"><Check className="w-3.5 h-3.5" /> Approve & publish</button>
                <button onClick={() => declineDraft(d)} disabled={busy === `dec-${d.id}`} className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-4 py-2 text-xs font-bold text-emerald-100/70 hover:border-red-400 hover:text-red-300 transition-colors disabled:opacity-50"><X className="w-3.5 h-3.5" /> Decline</button>
              </div>
            </div>
          ))}
          {!queueQ.isPending && (queueQ.data || []).length === 0 && <p className="text-sm text-emerald-100/50">Queue is empty. The daily schedule adds one draft per day, or generate one now.</p>}
        </div>
      </section>

      {/* Published */}
      <section className="rounded-2xl border border-white/10 bg-[#0c3b24]/60 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-mint flex items-center gap-2"><FileText className="w-4 h-4" /> Published AI posts</h2>
        <div className="mt-3 space-y-2">
          {(publishedQ.data || []).map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                <p className="text-xs text-emerald-100/50">{KIND_LABELS[p.ai_kind] || 'Post'} · {channelLabel(p.channel)} · {new Date(p.created_date).toLocaleDateString('en-CA')}</p>
              </div>
              <a href={`/community?post=${p.id}`} target="_blank" rel="noreferrer" className="shrink-0 text-mint hover:underline text-xs font-bold inline-flex items-center gap-1"><ExternalLink className="w-3 h-3" /> View</a>
            </div>
          ))}
          {!publishedQ.isPending && (publishedQ.data || []).length === 0 && <p className="text-sm text-emerald-100/50">Nothing published yet.</p>}
        </div>
      </section>

      {/* Moderation alerts */}
      <section className="rounded-2xl border border-white/10 bg-[#0c3b24]/60 p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-mint flex items-center gap-2"><ShieldAlert className="w-4 h-4" /> Moderation alerts</h2>
        <div className="mt-3 space-y-2">
          {alerts.map((r) => (
            <div key={r.id} className="rounded-xl bg-white/5 px-4 py-2.5 text-sm">
              <p className="font-semibold text-white">{postTitleById[r.target_id]}</p>
              <p className="text-xs text-emerald-100/60">{r.reason} · {r.details}</p>
            </div>
          ))}
          {!reportsQ.isPending && alerts.length === 0 && <p className="text-sm text-emerald-100/50">No open reports on AI posts.</p>}
        </div>
      </section>
    </div>
  );
}

function Toggle({ label, desc, on, onToggle, busy }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-white/10 px-4 py-3">
      <div>
        <p className="text-sm font-bold text-white">{label}</p>
        <p className="mt-0.5 text-xs text-emerald-100/60">{desc}</p>
      </div>
      <button
        onClick={onToggle}
        disabled={busy}
        role="switch"
        aria-checked={on}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? 'bg-mint' : 'bg-white/20'} disabled:opacity-50`}
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-5.5 translate-x-0' : 'left-0.5'}`} style={{ left: on ? '22px' : '2px' }} />
      </button>
    </div>
  );
}