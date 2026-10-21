import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { ACTIVE_CITIES } from '../../shared/coverageStatus.ts';

// Authoritative facility dataset: the Provider entity. Every surface (map,
// directory, region and city pages) reads from here — the legacy
// RecyclingCenter cache is no longer read anywhere.
const CITIES = ACTIVE_CITIES;

// Map a Provider record to the public listing shape (no internal fields).
const toPublic = (p) => ({
  id: p.id,
  name: p.name,
  city: p.city,
  province: p.province || '',
  address: p.address || '',
  lat: p.lat,
  lng: p.lng,
  phone: p.phone || '',
  website: p.website || '',
  accepts: p.materials_note || (p.accepted_categories || []).join(', '),
  note: p.notes || '',
  verification: p.verification || 'researched',
  provider_type: p.provider_type || '',
  researched_date: p.last_confirmed_date || '',
  source_url: p.source_url || '',
});

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let payload = {};
    try { payload = await req.json(); } catch {}
    const action = payload.action || 'list';
    const svc = base44.asServiceRole;

    // Public lookup of listed facilities (cached shape, no PII). "Verified"
    // means details were confirmed against the official operator or
    // municipal source recorded on the listing; "researched" listings come
    // from dated research and are not yet independently confirmed.
    if (action === 'list') {
      const filter = payload.city ? { city: payload.city } : {};
      const page = await svc.entities.Provider.filter(filter, { sort: 'city', limit: 500 });
      const centers = (page.items || []).map(toPublic);
      return Response.json({ centers, count: centers.length });
    }

    // Admin only: AI re-researches every city from live web sources and
    // replaces only that city's RESEARCHED listings. "Verified" listings are
    // never touched by the refresh.
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
                `Research real recycling centres, depots, transfer stations and public drop-off facilities in ${city}, Canada. ` +
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
              provider_type: 'private_business',
              province: '',
              city: r.value.city,
              address: String(c.address || '').slice(0, 200),
              lat: c.lat,
              lng: c.lng,
              phone: String(c.phone || '').slice(0, 40),
              website: String(c.website || '').slice(0, 200),
              service_type: 'drop_off',
              accepted_categories: [],
              materials_note: String(c.accepts || '').slice(0, 300),
              // AI-refreshed listings are always "researched", never auto-verified.
              verification: 'researched',
              source_name: 'Same Day Recycling facility research',
              source_url: String(c.website || '').slice(0, 200),
              last_confirmed_date: today,
              sponsored: false,
              notes: String(c.note || '').slice(0, 200),
            }));
          if (!rows.length) continue;
          // Replace only this city's researched listings so refreshed data
          // never duplicates and never downgrades verified records.
          await svc.entities.Provider.deleteMany({ city: r.value.city, verification: 'researched' });
          await svc.entities.Provider.bulkCreate(rows);
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