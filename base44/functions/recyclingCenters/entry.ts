import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { ACTIVE_CITIES } from '../../shared/coverageStatus.ts';

// Sync every city the national coverage model lists — kept in one place so
// the recycling center map never drifts from the coverage source of truth.
const CITIES = ACTIVE_CITIES;

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let payload = {};
    try { payload = await req.json(); } catch {}
    const action = payload.action || 'list';
    const svc = base44.asServiceRole;

    // Public lookup of the AI-researched recycling centers (cached, no PII)
    if (action === 'list') {
      const filter = payload.city ? { city: payload.city } : {};
      const page = await svc.entities.RecyclingCenter.filter(filter, { sort: 'city', limit: 500 });
      const centers = (page.items || []).map((c) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        address: c.address || '',
        lat: c.lat,
        lng: c.lng,
        phone: c.phone || '',
        website: c.website || '',
        accepts: c.accepts || '',
        note: c.note || '',
        researched_date: c.researched_date || '',
      }));
      return Response.json({ centers, count: centers.length });
    }

    // Admin only: AI re-researches every city from live web sources and replaces the cache
    if (action === 'refresh') {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
      if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

      const cities = Array.isArray(payload.cities) && payload.cities.length
        ? payload.cities.slice(0, 30)
        : CITIES;
      const today = new Date().toISOString().slice(0, 10);
      let researched = 0;
      const errors = [];

      for (let i = 0; i < cities.length; i += 6) {
        const batch = cities.slice(i, i + 6);
        const results = await Promise.allSettled(
          batch.map((city) =>
            svc.integrations.Core.InvokeLLM({
              prompt:
                `Research real recycling centers, depots, transfer stations and public drop-off facilities in ${city}, Canada, Canada. ` +
                'Use current web sources (municipal websites, provincial recycling programs, Google Maps listings). ' +
                'Return up to 8 real, verifiable facilities. For each give: exact name, full street address, latitude, longitude, ' +
                'phone number if known, website if known, main materials accepted (comma separated, e.g. cardboard, scrap metal, appliances, electronics, yard waste, paint), ' +
                'and a short note (e.g. drop-off only, fees may apply, residential only). ' +
                `Include coordinates for every facility. Focus on ${city} itself and its immediate metro area.`,
              add_context_from_internet: true,
              response_json_schema: {
                type: 'object',
                properties: {
                  centers: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        name: { type: 'string' },
                        address: { type: 'string' },
                        lat: { type: 'number' },
                        lng: { type: 'number' },
                        phone: { type: 'string' },
                        website: { type: 'string' },
                        accepts: { type: 'string' },
                        note: { type: 'string' },
                      },
                      required: ['name', 'address', 'lat', 'lng'],
                    },
                  },
                },
                required: ['centers'],
              },
            }).then((res) => ({ city, list: res.centers || [] }))
          )
        );
        for (const r of results) {
          if (r.status !== 'fulfilled') {
            errors.push(String(r.reason?.message || r.reason).slice(0, 200));
            continue;
          }
          const rows = (r.value.list || [])
            .filter((c) => c && c.name && Number.isFinite(c.lat) && Number.isFinite(c.lng))
            .slice(0, 8)
            .map((c) => ({
              name: String(c.name).slice(0, 120),
              city: r.value.city,
              address: String(c.address || '').slice(0, 200),
              lat: c.lat,
              lng: c.lng,
              phone: String(c.phone || '').slice(0, 40),
              website: String(c.website || '').slice(0, 200),
              accepts: String(c.accepts || '').slice(0, 300),
              note: String(c.note || '').slice(0, 200),
              researched_date: today,
            }));
          if (!rows.length) continue;
          // Replace this city's cache so the map always reflects the latest research
          await svc.entities.RecyclingCenter.deleteMany({ city: r.value.city });
          await svc.entities.RecyclingCenter.bulkCreate(rows);
          researched += rows.length;
        }
      }
      return Response.json({ ok: true, researched, errors });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}