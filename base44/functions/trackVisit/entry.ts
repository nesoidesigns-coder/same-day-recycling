import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { classifySource, classifyChannel, GBP_HOSTS } from '../../shared/analytics.ts';

// Traffic classification for Recycling OS:
//   owner      — the admin's own testing and administration (signed-in admin)
//   customer   — people exploring services and requesting quotes
//   contractor — providers exploring partnerships and software pages
//   bot        — automated crawlers and suspicious requests (tracked, never counted as traffic)
// Attribution: `source` keeps the legacy coarse category; `channel` records
// the detailed acquisition channel from recorded evidence (UTM tags or the
// HTTP referrer). Nothing is inferred beyond that evidence.
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

    // Campaign tags captured from the landing URL, when present.
    const utm_source = String(body?.utm_source || '').slice(0, 80);
    const utm_medium = String(body?.utm_medium || '').slice(0, 80);
    const utm_campaign = String(body?.utm_campaign || '').slice(0, 120);

    const ua = String(req.headers.get('user-agent') || '').toLowerCase();
    const r = referrer.toLowerCase();
    const srcParam = String(body?.src || '').toLowerCase();
    const gbp = srcParam === 'gbp' || srcParam === 'google_business' || GBP_HOSTS.some((h) => r.includes(h));
    const channel = classifyChannel({ referrer, utm_source, utm_medium, utm_campaign, gbp });

    if (!ua || BOT_PATTERN.test(ua)) {
      // Bots are recorded (so their volume is visible) but classified as bot
      // traffic — they never inflate customer counts.
      let botSource = 'direct';
      if (r.includes('google.') || r.includes('bing.')) botSource = 'search';
      else if (r) botSource = 'other';
      await base44.asServiceRole.entities.Visit.create({ source: botSource, channel, path, referrer, traffic_class: 'bot', sid, country, utm_source, utm_medium, utm_campaign });
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

    // Legacy coarse source (kept identical for historical compatibility) —
    // an empty referrer stays "direct"; never re-labelled without evidence.
    let source = classifySource(referrer);
    if (gbp) source = 'google_business';

    await base44.asServiceRole.entities.Visit.create({ source, channel, path, referrer, traffic_class, sid, country, utm_source, utm_medium, utm_campaign });
    return Response.json({ ok: true, traffic_class });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}