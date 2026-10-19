import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getFacebookPage } from '../../shared/facebook.ts';

const GRAPH = "https://graph.facebook.com/v25.0";

async function runDigest(base44: any) {
  const svc = base44.asServiceRole;
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { items: logs } = await svc.entities.FacebookMessageLog.filter({ created_date: { $gte: since } }, { sort: '-created_date', limit: 100 });

  // Unanswered: live conversations whose latest customer message was never replied to
  let unansweredList: string[] = [];
  try {
    const { pageId, pageToken } = await getFacebookPage(svc);
    const convRes = await fetch(
      `${GRAPH}/${pageId}/conversations?fields=id,messages.limit(1){id,from,message,created_time}&limit=15`,
      { headers: { Authorization: `Bearer ${pageToken}` }, signal: AbortSignal.timeout(15000) }
    );
    const convData = await convRes.json();
    const unanswered: string[] = [];
    for (const conv of convData.data || []) {
      const msg = conv.messages && conv.messages.data && conv.messages.data[0];
      if (!msg || !msg.from || String(msg.from.id) === String(pageId) || !msg.message) continue;
      const replied = await svc.entities.FacebookMessageLog.filter({ message_id: msg.id });
      if (!replied.items || replied.items.length === 0) {
        unanswered.push(`${(msg.from && msg.from.name) || 'Facebook user'}: ${String(msg.message).slice(0, 140)}`);
      }
      if (unanswered.length >= 5) break;
    }
    unansweredList = unanswered;
  } catch {}

  const transcript = logs.map((l: any) =>
    `${l.sender_name || 'Customer'} asked: ${String(l.message_text || '').slice(0, 160)}\nAI replied: ${String(l.reply_text || l.error || '(no reply)').slice(0, 160)}${l.lead_captured ? '\n(booking captured)' : ''}`
  ).join('\n---\n');

  let ai: any = null;
  if (transcript) {
    ai = await svc.integrations.Core.InvokeLLM({
      prompt:
        'You analyze Facebook Messenger conversations for Same Day Recycling, a same-day junk removal service in British Columbia, Canada. ' +
        'Below are the last 24 hours of conversations (customer message + the AI receptionist reply). ' +
        'Produce: 1) a 2-3 sentence summary of the day\u2019s chats; 2) hot_leads (0-3 people showing clear buying intent who are NOT yet booked as a customer, with what they want and urgency); ' +
        '3) follow_ups (0-3 short concrete actions, e.g. who to call and why).\n\nConversations:\n' + transcript +
        (unansweredList.length ? '\n\nMessages still unanswered:\n' + unansweredList.join('\n') : ''),
      response_json_schema: {
        type: 'object',
        properties: {
          summary: { type: 'string' },
          hot_leads: {
            type: 'array',
            items: {
              type: 'object',
              properties: { name: { type: 'string' }, what: { type: 'string' }, urgency: { type: 'string' } },
              required: ['name', 'what'],
            },
          },
          follow_ups: { type: 'array', items: { type: 'string' } },
        },
        required: ['summary', 'hot_leads', 'follow_ups'],
      },
    });
  }

  const bookings = logs.filter((l: any) => l.lead_captured).length;
  const leads = ((ai && ai.hot_leads) || []).map((l: any) => `${l.name}: ${l.what}${l.urgency ? ' (' + l.urgency + ')' : ''}`).slice(0, 3);
  const followups = ((ai && ai.follow_ups) || []).slice(0, 3);
  const followupsText = followups.length ? followups.join(' | ') : unansweredList.join(' | ');

  return Response.json({
    ok: true,
    messages_count: logs.length,
    bookings_captured: bookings,
    unanswered_count: unansweredList.length,
    summary: (ai && ai.summary) || (logs.length ? 'Conversations recorded, but no analysis was returned.' : 'No Messenger messages in the last 24 hours.'),
    leads,
    lead_1: leads[0] || '',
    lead_2: leads[1] || '',
    lead_3: leads[2] || '',
    followups_text: followupsText,
  });
}

async function runEngagement(base44: any) {
  const svc = base44.asServiceRole;
  const { pageId, pageToken } = await getFacebookPage(base44);
  const headers = { Authorization: `Bearer ${pageToken}` };

  const postsRes = await fetch(
    `${GRAPH}/${pageId}/posts?fields=id,message,created_time,insights.metric(post_media_view){values}&limit=10`,
    { headers, signal: AbortSignal.timeout(15000) }
  );
  const postsData = await postsRes.json();
  if (postsData.error) {
    return Response.json({ error: postsData.error.message || 'Facebook posts unavailable' }, { status: 502 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const records = (postsData.data || []).map((p: any) => {
    const ins = p.insights && p.insights.data && p.insights.data[0];
    const views = ins && ins.values && ins.values[0] ? Number(ins.values[0].value) || 0 : 0;
    return {
      post_id: String(p.id),
      post_excerpt: String(p.message || '(no text)').slice(0, 120),
      posted_date: String(p.created_time || '').slice(0, 10),
      views,
      insights_date: today,
    };
  });

  if (records.length) {
    await svc.entities.FacebookEngagement.upsert(records, { key: 'post_id' });
  }

  let engagementLine = '';
  try {
    const insightsRes = await fetch(
      `${GRAPH}/${pageId}/insights?metric=page_total_media_view_unique,page_post_engagements,page_follows&period=week`,
      { headers, signal: AbortSignal.timeout(15000) }
    );
    const insightsRaw = await insightsRes.text();
    if (!insightsData_ok(insightsRes.status) || !insightsRaw.includes('"data"') || insightsRaw.includes('"error"')) {
      return Response.json({ ok: true, posts_tracked: records.length, engagement_line: `debug: ${insightsRaw.slice(0, 500)}`, top });
    }
    const insightsData = JSON.parse(insightsRaw);
    const lines: string[] = [];
    for (const row of insightsData.data || []) {
      const vals = row.values || [];
      const last7 = vals.slice(-7).reduce((s: number, v: any) => s + (Number(v.value) || 0), 0);
      if (row.name === 'page_total_media_view_unique') lines.push(`${last7.toLocaleString()} unique page views`);
      if (row.name === 'page_post_engagements') lines.push(`${last7.toLocaleString()} post engagements`);
      if (row.name === 'page_follows') lines.push(`${last7.toLocaleString()} new followers`);
    }
    engagementLine = lines.join(', ');
  } catch (e: any) {
    return Response.json({ ok: true, posts_tracked: records.length, engagement_line: `debug-ex: ${e.message}`, top });
  }

  const top = [...records].sort((a: any, b: any) => b.views - a.views).slice(0, 3);
  return Response.json({ ok: true, posts_tracked: records.length, engagement_line: engagementLine, top });
}

function insightsData_ok(status: number): boolean {
  return status >= 200 && status < 300;
}

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const svc = base44.asServiceRole;

    let body: any = {};
    try { body = await req.json(); } catch {}
    const action = body.action || 'digest';

    if (action === 'engagement') return await runEngagement(base44);
    if (action === 'digest') return await runDigest(base44);
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}