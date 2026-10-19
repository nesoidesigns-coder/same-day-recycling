import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { getFacebookPage } from '../../shared/facebook.ts';

const GRAPH = "https://graph.facebook.com/v25.0";

const ANGLES = [
  'eco-friendly recycling and where junk actually goes after pickup',
  'same-day speed and booking before noon to get service today',
  'free metal pickup and how it works',
  'the stress of clutter at home and the relief of clearing it',
  'the $299/month subscription for property managers and turnovers',
  'honest upfront pricing with no surprises on arrival',
];

// Called daily by the "Facebook AI Auto Post" workflow: writes one post with AI
// (seeded by recent completed jobs, no customer PII) and publishes it to the page.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });
    const svc = base44.asServiceRole;

    const settingsPage = await svc.entities.FacebookSettings.list();
    const settings = (settingsPage.items || [])[0];
    if (settings && settings.auto_post_enabled === false) {
      return Response.json({ ok: true, skipped: 'auto-posting is turned off' });
    }

    const { pageId, pageToken } = await getFacebookPage(base44);

    const recent = await svc.entities.Booking.filter(
      { status: 'completed' },
      { sort: '-created_date', limit: 10, fields: ['city', 'items_description'] }
    );
    const jobs = (recent.items || [])
      .slice(0, 5)
      .map((b) => ({ city: b.city || 'Metro Vancouver', load: String(b.items_description || '').slice(0, 80) }));

    const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

    const llm = await svc.integrations.Core.InvokeLLM({
      prompt: `You write Facebook posts for "Same Day Recycling", a junk removal and same-day recycling service in Metro Vancouver, BC (Vancouver, Burnaby, Surrey, Richmond, Coquitlam, Kamloops, Kelowna). Tone: friendly, local, energetic, no hype, no em-dashes.\n\nWrite ONE short Facebook post (2-4 sentences, max 80 words) about: ${angle}.${jobs.length ? ` Use these recent real jobs for color, but NEVER mention customer names, phone numbers or street addresses: ${JSON.stringify(jobs)}.` : ''} End with a light call to action to call or text (604) 849-1745 or book online at samedayrecycling.ca, plus 2-4 hashtags.`,
      response_json_schema: {
        type: 'object',
        properties: { post: { type: 'string' } },
        required: ['post'],
      },
    });
    const message = String(llm.post || '').trim().slice(0, 3000);
    if (!message) return Response.json({ ok: true, skipped: 'AI returned nothing' });

    // Generate a matching picture so every post carries a visual (shows on the homepage feed)
    let imageUrl = null;
    try {
      const img = await svc.integrations.Core.GenerateImage({
        prompt: `Realistic, bright, professional photo for a Facebook post by "Same Day Recycling", a junk removal and recycling company in Vancouver BC. Theme: ${angle}. Show a tidy green-branded truck and crew loading clean furniture, appliances or scrap metal outdoors in a sunny BC neighbourhood, daylight, no text or words in the image.`,
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
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}