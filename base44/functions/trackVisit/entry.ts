import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const referrer = String(body?.referrer || '').slice(0, 200);
    const path = String(body?.path || '/').slice(0, 200) || '/';

    // Exclude known bots/crawlers so they never inflate visitor counts.
    const ua = String(req.headers.get('user-agent') || '').toLowerCase();
    const BOT_PATTERN = /bot|crawl|spider|slurp|ahrefs|semrush|mj12|dotbot|petalbot|bingpreview|lighthouse|headlesschrome|python-requests|python-urllib|curl\/|wget|java\/|httpclient|axios\/|go-http-client|facebookexternalhit|embedly|quora link preview|preview|monitor|uptime|pingdom|sitebulb|screaming frog|archive\.org/;
    if (!ua || BOT_PATTERN.test(ua)) {
      return Response.json({ ok: true, bot: true });
    }

    const r = referrer.toLowerCase();
    let source = 'direct';
    if (r.includes('facebook.com') || r.includes('fb.me') || r.includes('instagram.com') || r.includes('l.facebook') || r.includes('l.instagram')) {
      source = 'facebook';
    } else if (r.includes('google.') || r.includes('bing.') || r.includes('duckduckgo.') || r.includes('yahoo.')) {
      source = 'search';
    } else if (r) {
      source = 'other';
    }

    await base44.asServiceRole.entities.Visit.create({ source, path, referrer });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}