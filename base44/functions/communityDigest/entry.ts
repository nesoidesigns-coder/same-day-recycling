import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const items = (r) => (r && r.items ? r.items : Array.isArray(r) ? r : []);
const SITE = 'https://samedayrecycling.ca';
const MAX_RECIPIENTS = 300;

// Weekly community digest. Computes genuinely popular discussions (replies +
// helpful reactions over the last 7 days, padded from all-time popularity so
// every slot is real content) and recently published library guides, then
// emails opted-in community members. Sends nothing when there is not enough
// real content to fill the template, and never invents engagement.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    if (body?.action === 'preview') {
      const content = await computeDigest(base44);
      return Response.json(content);
    }

    const content = await computeDigest(base44);
    if (content.reason) return Response.json({ sent: 0, reason: content.reason });

    const profiles = items(await base44.asServiceRole.entities.CommunityProfile.filter({ suspended: false }, { limit: 1000 }));
    const recipients = [...new Set(profiles.map((p) => p.owner_email).filter(Boolean))].slice(0, MAX_RECIPIENTS);
    if (!recipients.length) return Response.json({ sent: 0, reason: 'no_recipients' });

    let sent = 0, failed = 0;
    for (let i = 0; i < recipients.length; i += 6) {
      const batch = recipients.slice(i, i + 6);
      const results = await Promise.allSettled(batch.map((email) =>
        base44.asServiceRole.integrations.Core.SendEmail({
          to: email,
          template_name: 'CommunityDigest',
          variables: {
            first_name: displayName(email),
            week_label: content.week_label,
            t1_title: content.topics[0].title, t1_url: content.topics[0].url, t1_replies: content.topics[0].replies,
            t2_title: content.topics[1].title, t2_url: content.topics[1].url, t2_replies: content.topics[1].replies,
            t3_title: content.topics[2].title, t3_url: content.topics[2].url, t3_replies: content.topics[2].replies,
            g1_title: content.guides[0].title, g1_url: content.guides[0].url,
            g2_title: content.guides[1].title, g2_url: content.guides[1].url,
          },
        })
      ));
      for (const r of results) r.status === 'fulfilled' ? sent++ : failed++;
    }
    return Response.json({ sent, failed, recipients: recipients.length, topics: content.topics.map((t) => t.title), guides: content.guides.map((g) => g.title) });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function displayName(email) {
  const handle = String(email || '').split('@')[0].replace(/[._-]+/g, ' ').trim();
  return handle ? handle.charAt(0).toUpperCase() + handle.slice(1) : 'there';
}

async function computeDigest(base44) {
  const weekLabel = `Week of ${new Date(Date.now() - 7 * 86400000).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}`;
  const cutoff = new Date(Date.now() - 7 * 86400000).toISOString();
  const recentCutoff = new Date(Date.now() - 28 * 86400000).toISOString();

  const [postsRes, weekComments, weekReactions, allComments, allReactions, guidesRes] = await Promise.all([
    base44.asServiceRole.entities.CommunityPost.filter({ status: 'published' }, { sort: '-created_date', limit: 200 }),
    base44.asServiceRole.entities.CommunityComment.aggregate({ query: { status: 'published', created_date: { $gte: cutoff } }, groupBy: 'post_id' }),
    base44.asServiceRole.entities.CommunityReaction.aggregate({ query: { target_type: 'post', created_date: { $gte: cutoff } }, groupBy: 'target_id' }),
    base44.asServiceRole.entities.CommunityComment.aggregate({ query: { status: 'published', created_date: { $gte: recentCutoff } }, groupBy: 'post_id' }),
    base44.asServiceRole.entities.CommunityReaction.aggregate({ query: { target_type: 'post', created_date: { $gte: recentCutoff } }, groupBy: 'target_id' }),
    base44.asServiceRole.entities.CommunityResource.filter({ status: 'published' }, { sort: '-created_date', limit: 20 }),
  ]);

  const posts = items(postsRes);
  if (!posts.length) return { reason: 'no_content', week_label: weekLabel };

  const toMap = (res) => {
    const map = {};
    for (const row of (res?.rows || [])) map[row.post_id || row.target_id] = row.count || 0;
    return map;
  };
  const week = { comments: toMap(weekComments), reactions: toMap(weekReactions) };
  const all = { comments: toMap(allComments), reactions: toMap(allReactions) };

  const score = (p, m) => 2 * (m.comments[p.id] || 0) + (m.reactions[p.id] || 0);
  const thisWeek = posts
    .filter((p) => p.created_date >= cutoff)
    .sort((a, b) => score(b, week) - score(a, week));
  const padPool = posts
    .filter((p) => p.created_date < cutoff && !thisWeek.some((w) => w.id === p.id))
    .sort((a, b) => score(b, all) - score(a, all));

  const topics = [...thisWeek, ...padPool]
    .slice(0, 3)
    .map((p) => ({
      title: p.title,
      url: `${SITE}/community?post=${p.id}`,
      replies: `${(all.comments[p.id] || 0)} ${(all.comments[p.id] || 0) === 1 ? 'reply' : 'replies'} in the community`,
    }));
  if (topics.length < 3) return { reason: 'not_enough_discussions', week_label: weekLabel };

  const guides = items(guidesRes)
    .filter((g) => g.title)
    .map((g) => ({ title: g.title, url: `${SITE}/community` }));
  if (guides.length < 2) return { reason: 'not_enough_guides', week_label: weekLabel };

  return { week_label: weekLabel, topics, guides: guides.slice(0, 2) };
}