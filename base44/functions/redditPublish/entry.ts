import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { appToken, userToken, subredditRules, submitSelfPost, redditConfig } from '../../shared/reddit.ts';

// Owner-only Reddit publishing: AI drafts tailored to each community's public
// rules, blocked when the rules prohibit the content, and published strictly
// one at a time after explicit owner approval. Never automated, never an
// unsolicited reply, never a repeated advertisement.
const KINDS = ['contractor_recruitment', 'job_announcement', 'community_update'];
const SUB_RE = /^[A-Za-z0-9_]{2,21}$/;
const REPUBLISH_DAYS = 7;

const KIND_PROMPTS = {
  contractor_recruitment: 'A post inviting local contractors and removal operators to learn about joining the Same Day Recycling partner network (background: a Canadian recycling and junk removal platform looking for verified partners in the area).',
  job_announcement: 'A post announcing that same-day recycling and removal service is available in the community, with honest, non-promotional wording.',
  community_update: 'A brief, genuinely useful community update about recycling or removal services in the area.',
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'list';
    if (action === 'list') return await listDrafts(base44);
    if (action === 'draft') return await draftPost(base44, body);
    if (action === 'publish') return await publishDraft(base44, body);
    if (action === 'decline') return await declineDraft(base44, body);
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

async function listDrafts(base44) {
  const { items } = await base44.asServiceRole.entities.RedditPostDraft.filter({}, { sort: '-created_date', limit: 25 });
  const c = redditConfig();
  return Response.json({
    drafts: items.map((d) => ({
      id: d.id,
      subreddit: d.subreddit,
      post_kind: d.post_kind,
      title: d.title,
      body: d.body,
      rules_note: d.rules_note,
      rules_allowed: d.rules_allowed,
      status: d.status,
      reddit_url: d.reddit_url,
      review_note: d.review_note,
      created_date: d.created_date,
    })),
    publishing_configured: c.hasPublish,
    publishing_account: c.hasPublish ? c.username : '',
  });
}

async function draftPost(base44, body) {
  const sub = String(body.subreddit || '').replace(/^r\//i, '').trim();
  const kind = KINDS.includes(body.post_kind) ? body.post_kind : 'job_announcement';
  const details = String(body.details || '').trim().slice(0, 500);
  if (!SUB_RE.test(sub)) return Response.json({ error: 'Enter a valid subreddit name (letters, numbers, underscores).' }, { status: 400 });

  const tok = await appToken();
  if (!tok.token) {
    const msg = tok.error === 'credentials_missing'
      ? 'Reddit credentials are not set. Add REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET on the Secrets page first.'
      : `Could not reach Reddit: ${tok.error}`;
    return Response.json({ error: msg }, { status: 503 });
  }
  const rules = await subredditRules(tok.token, sub);
  const rulesText = rules.ok
    ? rules.rules.map((r) => `- ${r.name}: ${r.text}`).join('\n')
    : '(rules could not be retrieved — treat the community as strict and stay clearly allowed)';

  const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `Draft one Reddit post for the community r/${sub}.
Post purpose: ${KIND_PROMPTS[kind]}
Owner's extra details: ${details || '(none provided)'}
The community's public rules:
${rulesText}

Requirements:
- title: a clear, honest, human title (max 100 characters). No clickbait, no ALL CAPS.
- body: 120-250 words. Plain, respectful, honest. State clearly that this is from Same Day Recycling (samedayrecycling.ca), a Canadian recycling and junk removal platform. No pricing promises you cannot verify, no pressure, no marketing fluff, no emoji spam.
- allowed: true ONLY if a post of this kind does not appear to violate the community's rules (check for rules against self-promotion, advertising, business posts, or links). When unsure, set false and explain in the reason.
- reason: one or two sentences explaining the rules assessment, citing the relevant rule names.
Never write an unsolicited reply, never disguise the sender, never fabricate facts.`,
    response_json_schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        body: { type: 'string' },
        allowed: { type: 'boolean' },
        reason: { type: 'string' },
      },
      required: ['title', 'body', 'allowed'],
    },
  });

  const now = new Date().toISOString();
  const draft = await base44.asServiceRole.entities.RedditPostDraft.create({
    subreddit: sub,
    post_kind: kind,
    title: String(llm.title || '').slice(0, 300),
    body: String(llm.body || '').slice(0, 6000),
    rules_note: String(llm.reason || '').slice(0, 1000),
    rules_allowed: llm.allowed === true,
    status: llm.allowed === true ? 'pending_review' : 'blocked',
    review_note: rules.ok ? '' : `Rules could not be retrieved (${rules.error}).`,
    history: [{ date: now, event: 'generated', note: `AI draft for r/${sub} (${kind}) with rules check` }],
  });

  return Response.json({ ok: true, draft_id: draft.id, allowed: llm.allowed === true, status: draft.status });
}

async function publishDraft(base44, body) {
  const { items } = await base44.asServiceRole.entities.RedditPostDraft.filter({ id: body.draft_id }, { limit: 1 });
  const draft = items[0];
  if (!draft) return Response.json({ error: 'Draft not found.' }, { status: 404 });
  if (draft.status === 'published') return Response.json({ error: 'This draft is already published.' }, { status: 400 });
  if (draft.status === 'blocked' || draft.rules_allowed === false) {
    return Response.json({ error: 'This draft was blocked by the community rules check and can never be published.' }, { status: 400 });
  }

  // Politeness cap: at most one published post per community per week.
  const weekAgo = new Date(Date.now() - REPUBLISH_DAYS * 86400000).toISOString();
  const { items: recent } = await base44.asServiceRole.entities.RedditPostDraft.filter(
    { subreddit: draft.subreddit, status: 'published' },
    { limit: 10 }
  );
  if (recent.some((r) => (r.created_date || '') > weekAgo)) {
    return Response.json({ error: `A post was already published to r/${draft.subreddit} this week. Wait before posting again.` }, { status: 429 });
  }

  const tok = await userToken();
  if (!tok.token) {
    const msg = tok.error === 'publish_credentials_missing'
      ? 'Publishing needs the full Reddit credentials (REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD) on the Secrets page.'
      : `Could not authorize with Reddit: ${tok.error}`;
    return Response.json({ error: msg }, { status: 503 });
  }

  let url = '';
  try {
    url = await submitSelfPost(tok.token, draft.subreddit, draft.title, draft.body);
  } catch (e) {
    const now = new Date().toISOString();
    await base44.asServiceRole.entities.RedditPostDraft.update(draft.id, {
      review_note: `Publish failed: ${String(e?.message || e).slice(0, 900)}`,
      history: [...(draft.history || []), { date: now, event: 'publish_failed', note: String(e?.message || e).slice(0, 200) }],
    });
    return Response.json({ error: `Reddit refused the post: ${e?.message || e}` }, { status: 502 });
  }

  const now = new Date().toISOString();
  await base44.asServiceRole.entities.RedditPostDraft.update(draft.id, {
    status: 'published',
    reddit_url: url,
    history: [...(draft.history || []), { date: now, event: 'published', note: url }],
  });
  return Response.json({ ok: true, reddit_url: url });
}

async function declineDraft(base44, body) {
  const { items } = await base44.asServiceRole.entities.RedditPostDraft.filter({ id: body.draft_id }, { limit: 1 });
  const draft = items[0];
  if (!draft) return Response.json({ error: 'Draft not found.' }, { status: 404 });
  if (draft.status === 'published') return Response.json({ error: 'Already published.' }, { status: 400 });
  const now = new Date().toISOString();
  await base44.asServiceRole.entities.RedditPostDraft.update(draft.id, {
    status: 'declined',
    review_note: String(body.note || 'Declined by the owner.').slice(0, 1000),
    history: [...(draft.history || []), { date: now, event: 'declined', note: String(body.note || '').slice(0, 200) }],
  });
  return Response.json({ ok: true });
}