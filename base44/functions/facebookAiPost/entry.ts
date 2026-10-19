import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getFacebookPage } from '../../shared/facebook.ts';

const GRAPH = "https://graph.facebook.com/v25.0";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = String(body.action || 'status');

    const { pageId, pageName, pageToken, fanCount, followersCount } = await getFacebookPage(base44);

    if (action === 'status') {
      return Response.json({
        page_id: pageId,
        page_name: pageName,
        followers: followersCount ?? fanCount,
      });
    }

    if (action === 'draft') {
      const topic = String(body.topic || '').slice(0, 500);
      if (!topic) return Response.json({ error: 'Describe the post topic first' }, { status: 400 });
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You write Facebook posts for "Same Day Recycling", a junk removal and same-day recycling service in Metro Vancouver, BC. Their tone: friendly, local, energetic, no hype, no em-dashes. They offer same-day junk and furniture removal, free metal pickup, eco-friendly disposal, and a $299/month subscription for property managers. Write 3 short Facebook post variations (2-4 sentences each, max 80 words) about this topic: "${topic}". Each variation should end with a light call to action to call or text (604) 849-1745 or book online at samedayrecycling.ca. Include 2-4 relevant hashtags at the end of each. Return them as variations.`,
        response_json_schema: {
          type: 'object',
          properties: { variations: { type: 'array', items: { type: 'string' } } },
          required: ['variations'],
        },
      });
      return Response.json({ variations: (llm.variations || []).slice(0, 3) });
    }

    if (action === 'publish') {
      const message = String(body.message || '').slice(0, 3000);
      if (!message) return Response.json({ error: 'Post text is required' }, { status: 400 });
      const res = await fetch(`${GRAPH}/${pageId}/feed`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pageToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
        signal: AbortSignal.timeout(10000),
      });
      const data = await res.json();
      if (data.error) {
        return Response.json({ error: data.error.message || 'Facebook refused the post' }, { status: 502 });
      }
      return Response.json({ ok: true, post_id: data.id });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}