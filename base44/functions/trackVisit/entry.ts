import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';

// Traffic classification for Recycling OS:
//   owner      — the admin's own testing and administration (signed-in admin)
//   customer   — people exploring services and requesting quotes
//   contractor — providers exploring partnerships and software pages
//   bot        — automated crawlers and suspicious requests (tracked, never counted as traffic)
const BOT_PATTERN = /bot|crawl|spider|slurp|ahrefs|semrush|mj12|dotbot|petalbot|bingpreview|lighthouse|headlesschrome|python-requests|python-urllib|curl\/|wget|java\/|httpclient|axios\/|go-http-client|facebookexternalhit|embedly|quora link preview|preview|monitor|uptime|pingdom|sitebulb|screaming frog|archive\.org/;

const CONTRACTOR_PREFIXES = [
  '/contractors',
  '/contractor-onboarding',
  '/partner-register',
  '/partners',
  '/partner-portal',
  '/software',
  '/software-pay',
  '/white-label',
  '/white-label-pay',
  '/license-agreement',
  '/membership-pay',
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const referrer = String(body?.referrer || '').slice(0, 200);
    const path = String(body?.path || '/').slice(0, 200) || '/';

    const ua = String(req.headers.get('user-agent') || '').toLowerCase();
    if (!ua || BOT_PATTERN.test(ua)) {
      // Bots are recorded (so their volume is visible) but classified as bot
      // traffic — they never inflate customer counts.
      const r = referrer.toLowerCase();
      let botSource = 'direct';
      if (r.includes('google.') || r.includes('bing.')) botSource = 'search';
      else if (r) botSource = 'other';
      await base44.asServiceRole.entities.Visit.create({ source: botSource, path, referrer, traffic_class: 'bot' });
      return Response.json({ ok: true, traffic_class: 'bot' });
    }

    let traffic_class = 'customer';

    // Owner: signed-in administrators touring their own platform.
    try {
      const user = await base44.auth.me();
      if (user && user.role === 'admin') traffic_class = 'owner';
    } catch { /* anonymous visitor */ }

    // Contractor: partnership / software exploration pages.
    if (traffic_class === 'customer') {
      const p = path.toLowerCase();
      if (CONTRACTOR_PREFIXES.some((pre) => p === pre || p.startsWith(pre + '/') || p.startsWith(pre + '?'))) {
        traffic_class = 'contractor';
      }
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

    await base44.asServiceRole.entities.Visit.create({ source, path, referrer, traffic_class });
    return Response.json({ ok: true, traffic_class });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}