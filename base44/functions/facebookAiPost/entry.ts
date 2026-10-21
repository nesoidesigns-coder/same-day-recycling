import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getFacebookPage, FB_MARKETING_PLAYBOOK } from '../../shared/facebook.ts';

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
        prompt: `You write Facebook posts for "Same Day Recycling", a junk removal and same-day recycling service across Canada. Tone: friendly, local, energetic. They offer same-day junk and furniture removal, free metal pickup, eco-friendly disposal, and a $299/month subscription for property managers.\n\n${FB_MARKETING_PLAYBOOK}\n\nWrite 3 short Facebook post variations (2-4 sentences each, max 80 words) about this topic: "${topic}". Return them as variations.`,
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

      // Attach an AI-generated picture so the post shows visuals on the homepage feed
      let imageUrl = null;
      try {
        const img = await base44.asServiceRole.integrations.Core.GenerateImage({
          prompt: `Realistic, bright, professional photo for a Facebook post by "Same Day Recycling", a junk removal and recycling company in Canada, matching this post: "${message.slice(0, 300)}". Show a tidy green-branded truck or crew loading furniture, appliances or scrap metal outdoors in a sunny Canadian neighbourhood, no text or words in the image.`,
        });
        imageUrl = (img && img.url) || null;
      } catch {}

      const endpoint = imageUrl ? `${GRAPH}/${pageId}/photos` : `${GRAPH}/${pageId}/feed`;
      const payload = imageUrl ? { url: imageUrl, message } : { message };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { Authorization: `Bearer ${pageToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(20000),
      });
      const data = await res.json();
      if (data.error) {
        return Response.json({ error: data.error.message || 'Facebook refused the post' }, { status: 502 });
      }
      return Response.json({ ok: true, post_id: data.post_id || data.id, image: imageUrl });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}