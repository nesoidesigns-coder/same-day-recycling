import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Server-side rate limiting backed by the RateLimit entity.
// Tracks a SHA-256 hash of the caller IP per route; rejects when over budget.
export async function checkRateLimit(base44, req, route, maxPerHour) {
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim()
    || req.headers.get('cf-connecting-ip') || 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(ip));
  const ipHash = Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
  const cutoff = new Date(Date.now() - 3600000).toISOString();
  const srole = base44.asServiceRole;
  const { items } = await srole.entities.RateLimit.filter(
    { ip_hash: ipHash, route, created_date: { $gte: cutoff } },
    { limit: maxPerHour + 1 }
  );
  if (items.length >= maxPerHour) return { allowed: false };
  await srole.entities.RateLimit.create({ ip_hash: ipHash, route });
  // Opportunistic cleanup of entries older than 2 hours (~2% of calls)
  if (Math.random() < 0.02) {
    const stale = new Date(Date.now() - 7200000).toISOString();
    await srole.entities.RateLimit.deleteMany({ created_date: { $lt: stale } }).catch(() => {});
  }
  return { allowed: true };
}

export function rateLimitedResponse() {
  return Response.json(
    { error: 'Too many requests right now. Please try again shortly, or call us at (604) 849-1745.' },
    { status: 429, headers: { 'Retry-After': '3600' } }
  );
}