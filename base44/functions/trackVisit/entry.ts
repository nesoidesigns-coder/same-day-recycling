import { createClientFromRequest } from 'npm:@base44/sdk@0.8.53';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const referrer = String(body?.referrer || '').slice(0, 200);
    const path = String(body?.path || '/').slice(0, 200) || '/';

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