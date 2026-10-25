import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';

// Credential-free, openly licensed Panoramax imagery. No Google calls or paid
// services. A future authorized Google adapter can return the same contract.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'streetImagery', 30);
    if (!limited.allowed) return rateLimitedResponse();
    const { lat, lng } = await req.json();
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < 41 || lat > 84 || lng < -142 || lng > -52) return Response.json({ error: 'Valid Canadian pickup coordinates required.' }, { status: 422 });
    const radius = 100;
    const dy = radius / 111320, dx = dy / Math.cos(lat * Math.PI / 180);
    const query = new URLSearchParams({ bbox: [lng - dx, lat - dy, lng + dx, lat + dy].join(','), limit: '12', filter: 'field_of_view = 360' });
    const response = await fetch(`https://api.panoramax.xyz/api/search?${query}`, { headers: { Accept: 'application/geo+json', 'User-Agent': 'RecyclingOS/1.0' }, signal: AbortSignal.timeout(10000) });
    const base = { provider: 'panoramax', radius_m: radius, google: 'not_configured', checked_at: new Date().toISOString() };
    if (!response.ok) return Response.json({ ...base, status: 'provider_error' });
    const body = await response.json();
    if (!Array.isArray(body.features)) return Response.json({ ...base, status: 'provider_error' });
    const rad = Math.PI / 180;
    const distance = (a, b) => { const v = Math.sin((a - lat) * rad / 2) ** 2 + Math.cos(lat * rad) * Math.cos(a * rad) * Math.sin((b - lng) * rad / 2) ** 2; return 6371000 * 2 * Math.atan2(Math.sqrt(v), Math.sqrt(1 - v)); };
    const uuid = /^[a-f0-9-]{36}$/i;
    const nearby = body.features.filter((f) => f.geometry?.type === 'Point' && uuid.test(f.id) && uuid.test(f.collection) && ['CC-BY-SA-4.0', 'CC-BY-4.0', 'CC0-1.0'].includes(f.properties?.license))
      .map((f) => ({ f, distance: distance(f.geometry.coordinates[1], f.geometry.coordinates[0]) })).filter((p) => p.distance <= radius).sort((a, b) => a.distance - b.distance)[0];
    if (!nearby) return Response.json({ ...base, status: 'unavailable' });
    const f = nearby.f;
    const params = new URLSearchParams({ pic: f.id, seq: f.collection, focus: 'pic' });
    return Response.json({ ...base, status: 'available', image_id: f.id, collection: f.collection, lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0],
      distance_m: Math.round(nearby.distance), captured_at: f.properties.datetime, credit: f.providers?.map((p) => p.name).filter(Boolean).join(', ') || 'Panoramax contributors',
      license: f.properties.license, viewer_url: `https://explore.panoramax.fr/?${params}` });
  } catch {
    return Response.json({ status: 'provider_error', provider: 'panoramax', google: 'not_configured' });
  }
}