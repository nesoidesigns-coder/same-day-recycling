import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

// Canadian Market Opportunity Engine: separates measured demand from confirmed
// capacity. Demand = real bookings/service requests (internal tests excluded);
// search interest = city names matched in real Search Console queries; capacity
// = verified active partners. Recruitment recommendations cite that evidence —
// nothing is invented.
const REFERENCE_CITIES = [
  ['Vancouver', 'BC'], ['North Vancouver', 'BC'], ['West Vancouver', 'BC'], ['Burnaby', 'BC'],
  ['Surrey', 'BC'], ['Richmond', 'BC'], ['Coquitlam', 'BC'], ['Langley', 'BC'], ['Abbotsford', 'BC'],
  ['Victoria', 'BC'], ['Kelowna', 'BC'], ['Calgary', 'AB'], ['Edmonton', 'AB'], ['Toronto', 'ON'],
  ['Ottawa', 'ON'], ['Mississauga', 'ON'], ['Hamilton', 'ON'], ['Winnipeg', 'MB'],
  ['Montreal', 'QC'], ['Quebec City', 'QC'], ['Halifax', 'NS'],
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Real Search Console queries (from the existing Search Authority function).
    let searchQueries = [];
    let searchConnected = true;
    const authRes = await base44.functions.invoke('searchAuthority', {});
    const authData = authRes?.data ?? authRes;
    if (authData?.connected && Array.isArray(authData.queries)) {
      searchQueries = authData.queries;
    } else {
      searchConnected = false;
    }

    // Demand: real bookings and nationwide service requests, tests excluded.
    const [bookingsPage, requestsPage, partners] = await Promise.all([
      base44.asServiceRole.entities.Booking.filter({ record_type: 'service' }, { limit: 500 }),
      base44.asServiceRole.entities.NationalRequest.filter({ record_type: 'service' }, { limit: 500 }),
      base44.asServiceRole.entities.Partner.filter({ active: true }, { limit: 500 }),
    ]);
    const items = (p) => (Array.isArray(p) ? p : p?.items) || [];

    const verifiedByCity = {};
    for (const p of items(partners)) {
      const c = String(p.city || '').trim();
      if (!c) continue;
      verifiedByCity[c] = (verifiedByCity[c] || 0) + ((p.verified === undefined || p.verified) ? 1 : 0);
    }

    const demandByCity = {};
    const addDemand = (city, status) => {
      const c = String(city || '').trim();
      if (!c) return;
      demandByCity[c] = demandByCity[c] || { requests: 0, completed: 0 };
      demandByCity[c].requests += 1;
      if (status === 'completed') demandByCity[c].completed += 1;
    };
    for (const b of items(bookingsPage)) addDemand(b.city, b.status);
    for (const r of items(requestsPage)) addDemand(r.city, r.status);

    // Search interest: city name appearing in a real GSC query string.
    const interestByCity = {};
    if (searchConnected) {
      for (const city of REFERENCE_CITIES.map((c) => c[0])) {
        const needle = city.toLowerCase();
        interestByCity[city] = searchQueries
          .filter((q) => (q.key || '').toLowerCase().includes(needle))
          .reduce((a, q) => a + (q.impressions || 0), 0);
      }
    }

    const cities = [];
    const seen = new Set();
    const consider = (city, province) => {
      const key = city;
      if (seen.has(key)) return;
      seen.add(key);
      const d = demandByCity[city] || { requests: 0, completed: 0 };
      const verified = verifiedByCity[city] || 0;
      const interest = searchConnected ? (interestByCity[city] || 0) : null;
      const confirmed = verified > 0;
      let classification;
      if (confirmed) classification = 'confirmed_capacity';
      else if (d.requests > 0) classification = 'matching_territory';
      else if (interest > 0) classification = 'recruitment_opportunity';
      else if (d.requests > 0 || verified > 0 || interest > 0) classification = 'watchlist';
      else return; // no evidence at all — not listed, not guessed
      const score = (d.requests * 3) + (interest || 0) * 2 + (confirmed ? 0 : 5);
      cities.push({
        city, province_code: province,
        demand_requests: d.requests, demand_completed: d.completed,
        verified_partners: verified,
        search_interest_impressions: interest,
        classification, opportunity_score: score,
      });
    };
    for (const [city, province] of REFERENCE_CITIES) consider(city, province);
    for (const c of Object.keys(demandByCity)) {
      const ref = REFERENCE_CITIES.find((r) => r[0].toLowerCase() === c.toLowerCase());
      if (ref) continue;
      consider(c, '');
    }
    cities.sort((a, b) => b.opportunity_score - a.opportunity_score);

    return Response.json({
      generated_at: new Date().toISOString(),
      search_connected: searchConnected,
      demand_records_scanned: items(bookingsPage).length + items(requestsPage).length,
      cities: cities.slice(0, 25),
      definitions: {
        confirmed_capacity: 'Verified active contractor accepts jobs here today.',
        matching_territory: 'Real requests accepted here, pending contractor matching — no verified contractor yet.',
        recruitment_opportunity: 'Real search interest here, but no demand records and no contractor yet.',
      },
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}