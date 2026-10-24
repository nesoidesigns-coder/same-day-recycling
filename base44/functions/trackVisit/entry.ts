import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { classifySource, GBP_HOSTS } from '../../shared/analytics.ts';

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
    // Anonymous browser-session key + coarse country (device timezone), so
    // visits join to later quote requests and bookings in the same session.
    const sid = String(body?.sid || '').slice(0, 40);
    const country = body?.country === 'CA' || body?.country === 'other' ? body.country : 'CA';

    const ua = String(req.headers.get('user-agent') || '').toLowerCase();
    if (!ua || BOT_PATTERN.test(ua)) {
      // Bots are recorded (so their volume is visible) but classified as bot
      // traffic — they never inflate customer counts.
      const r = referrer.toLowerCase();
      let botSource = 'direct';
      if (r.includes('google.') || r.includes('bing.')) botSource = 'search';
      else if (r) botSource = 'other';
      await base44.asServiceRole.entities.Visit.create({ source: botSource, path, referrer, traffic_class: 'bot', sid, country });
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

    // Single shared classifier: identical attribution in every dashboard.
    // An empty referrer stays "direct" (Direct / unknown) — never re-labelled
    // as search or social without evidence.
    let source = classifySource(referrer);

    // Google Business Profile / Maps traffic: attributed ahead of generic
    // search so the GBP funnel (visit -> inquiry -> quote -> completed job
    // -> commission) can be tracked end-to-end.
    const srcParam = String(body?.src || '').toLowerCase();
    const GBP_HOSTS = ['business.google.com', 'maps.google', 'google.com/maps', 'goo.gl/maps', 'maps.app.goo.gl'];
    if (srcParam === 'gbp' || srcParam === 'google_business' || GBP_HOSTS.some((h) => r.includes(h))) {
      source = 'google_business';
    }

    await base44.asServiceRole.entities.Visit.create({ source, path, referrer, traffic_class, sid, country });
    return Response.json({ ok: true, traffic_class });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}