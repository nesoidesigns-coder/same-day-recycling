import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { checkRateLimit, rateLimitedResponse } from '../../shared/rateLimit.ts';
import { INDUSTRY_TAXONOMY, flattenTaxonomy } from '../../shared/industryTaxonomy.ts';

// National demand gauge: aggregates REAL, connected demand evidence per
// taxonomy topic. Nothing is estimated that no source supports — topics with
// no connected data simply return connected: false.
//
// Sources (all existing, first-party or source-reported):
//  - DemandObservation: licensed/source-reported relative search interest
//  - ServiceQuery: first-party searches captured on this platform
//  - DemandSignal: platform inquiries, observed public requests, confirmed bookings

type AnyRec = any;

async function ensureSeeded(srole: any, force = false) {
  const { items } = await srole.entities.IndustryNode.list({ limit: 1 });
  if (items.length && !force) return { seeded: false, nodes: items.length };
  if (items.length && force) await srole.entities.IndustryNode.deleteMany({});
  const rows = flattenTaxonomy();
  await srole.entities.IndustryNode.bulkCreate(rows);
  return { seeded: true, nodes: rows.length };
}

const norm = (v: any) => String(v || '').toLowerCase();

// Deterministic classification: every search phrase fits its single most
// specific topic, so each search counts once, in the right industry.
const STOP = new Set(['the', 'and', 'for', 'with', 'near', 'me', 'my', 'our', 'your', 'a', 'an', 'of', 'in', 'to', 'on', 'at', 'is', 'are', 'best', 'cheap', 'need', 'want', 'looking', 'help', 'service', 'services', 'company', 'companies', 'local', 'any', 'there', 'can', 'will', 'how', 'much', 'cost', 'quote']);
const stem = (w: string) => w.replace(/ies$/, 'y').replace(/sses$/, 'ss').replace(/ches$/, 'ch').replace(/shes$/, 'sh').replace(/xes$/, 'x').replace(/s$/, '');
function tokenSet(text: string) {
  const out = new Set<string>();
  norm(text).split(/[^a-z0-9]+/).forEach((w) => { if (w.length >= 2 && !STOP.has(w)) out.add(stem(w)); });
  return out;
}
function kwScore(textTokens: Set<string>, kw: string): number {
  const parts = norm(kw).split(/[^a-z0-9]+/).map(stem).filter((p) => p && !STOP.has(p));
  if (!parts.length) return 0;
  return parts.every((p) => textTokens.has(p)) ? parts.length : 0;
}
function classify(text: string, topics: AnyRec[], index: Map<string, number>): string | null {
  const tokens = tokenSet(text);
  if (!tokens.size) return null;
  let best: { slug: string; score: number; len: number; order: number } | null = null;
  for (const topic of topics) {
    let score = 0, len = 0;
    for (const kw of topic.keywords || []) {
      const s = kwScore(tokens, kw);
      if (s > 0) { score += s; len = Math.max(len, norm(kw).length); }
    }
    if (score > 0) {
      const order = index.get(topic.slug) ?? 999;
      if (!best || score > best.score || (score === best.score && (len > best.len || (len === best.len && order < best.order)))) {
        best = { slug: topic.slug, score, len, order };
      }
    }
  }
  return best ? best.slug : null;
}

function monthKey(iso: string) { return String(iso || '').slice(0, 7); }

function firstPartyTrend(matches: AnyRec[]) {
  const counts = new Map<string, number>();
  matches.forEach((q) => {
    const m = monthKey(q.captured_date || q.created_date);
    if (m) counts.set(m, (counts.get(m) || 0) + 1);
  });
  const months = [...counts.keys()].sort();
  if (months.length < 2) return null;
  const last = months[months.length - 1], prev = months[months.length - 2];
  const delta = (counts.get(last) || 0) - (counts.get(prev) || 0);
  return { direction: delta > 0 ? 'rising' : delta < 0 ? 'falling' : 'steady', last_month: last, note: `Platform searches: ${counts.get(prev) || 0} → ${counts.get(last) || 0} between ${prev} and ${last}` };
}

async function buildGauge(srole: any) {
  await ensureSeeded(srole, false);
  const nodes = (await srole.entities.IndustryNode.list({ limit: 1000 })).items as AnyRec[];
  if (!nodes.length) return { error: 'Taxonomy not seeded.' };

  // A live gauge only needs the most recent reporting period — fetch just
  // that month so every keyword is included regardless of history size.
  const peek = await srole.entities.DemandObservation.list({ sort: '-period', limit: 1 });
  const latestPeriod = String((((peek as AnyRec).items || peek)[0] || {}).period || '');
  const obs = latestPeriod
    ? await srole.entities.DemandObservation.filter({ period: latestPeriod }, { limit: 500 })
    : await srole.entities.DemandObservation.list({ limit: 500 });
  const [queries, signals] = await Promise.all([
    srole.entities.ServiceQuery.list({ limit: 1000 }),
    srole.entities.DemandSignal.list({ limit: 1000 }),
  ]);
  const obsItems = (obs as AnyRec).items || obs || [];
  const queryItems = (queries as AnyRec).items || queries || [];
  const signalItems = (signals as AnyRec).items || signals || [];

  const topicNodes = nodes.filter((n) => n.level === 'topic');
  const topicNodeBySlug = new Map(topicNodes.map((n) => [n.slug, n]));
  const subsBySlug = new Map(nodes.filter((n) => n.level === 'subdivision').map((n) => [n.slug, n]));
  const indsBySlug = new Map(nodes.filter((n) => n.level === 'industry').map((n) => [n.slug, n]));

  // Classify every real record into exactly one best-fitting topic.
  const topicIndex = new Map(topicNodes.map((n: AnyRec, i: number) => [n.slug, Number(n.order ?? i)]));
  const bucket = (map: Map<string, AnyRec[]>, slug: string, rec: AnyRec) => { const arr = map.get(slug) || []; arr.push(rec); map.set(slug, arr); };
  const obsByTopic = new Map<string, AnyRec[]>();
  obsItems.forEach((o: AnyRec) => { const slug = classify(`${o.keyword || ''} ${o.close_variants || ''}`, topicNodes, topicIndex); if (slug) bucket(obsByTopic, slug, o); });
  const queryByTopic = new Map<string, AnyRec[]>();
  queryItems.forEach((q: AnyRec) => { const slug = classify(q.query_text || '', topicNodes, topicIndex); if (slug) bucket(queryByTopic, slug, q); });
  const signalByTopic = new Map<string, AnyRec[]>();
  signalItems.forEach((d: AnyRec) => { const slug = classify(`${d.title || ''} ${(d.keywords || []).join(' ')}`, topicNodes, topicIndex); if (slug) bucket(signalByTopic, slug, d); });

  const statsFor = (topic: AnyRec) => {
    const obsMatches = obsByTopic.get(topic.slug) || [];
    const sqMatches = queryByTopic.get(topic.slug) || [];
    const dsMatches = signalByTopic.get(topic.slug) || [];

    let interest: any = null;
    if (obsMatches.length) {
      const withIndex = obsMatches.filter((o: AnyRec) => Number(o.trend_index) > 0);
      const dirs = obsMatches.map((o: AnyRec) => o.trend_direction).filter(Boolean);
      const direction = ['rising', 'falling', 'steady'].find((d) => dirs.filter((x: string) => x === d).length >= dirs.length / 2) || 'unknown';
      interest = {
        basis: 'relative_interest',
        index: withIndex.length ? Math.max(...withIndex.map((o: AnyRec) => Number(o.trend_index) || 0)) : 0,
        direction,
        period: obsMatches.map((o: AnyRec) => o.period).filter(Boolean)[0] || '',
        provider: [...new Set(obsMatches.map((o: AnyRec) => o.provider).filter(Boolean))].join(', ') || 'source-reported',
        records: obsMatches.length,
      };
    }

    const inquiries = dsMatches.filter((d: AnyRec) => ['observed_public_request', 'platform_inquiry'].includes(d.demand_type)).length;
    const confirmed = dsMatches.filter((d: AnyRec) => d.demand_type === 'confirmed_booking').length;

    const cityMap = new Map<string, { city: string; province_code: string; count: number }>();
    const addCity = (city: string, province: string) => {
      const c = String(city || '').trim();
      if (!c) return;
      const key = c.toLowerCase();
      const row = cityMap.get(key) || { city: c, province_code: String(province || ''), count: 0 };
      row.count += 1;
      if (!row.province_code && province) row.province_code = province;
      cityMap.set(key, row);
    };
    dsMatches.forEach((d: AnyRec) => { if (d.geo_confidence && d.geo_confidence !== 'unresolved') addCity(d.city, d.province_code); });
    sqMatches.forEach((q: AnyRec) => addCity(q.city, ''));

    const searches = sqMatches.length;
    const connected = Boolean(interest) || searches > 0 || inquiries > 0 || confirmed > 0;
    const activity = searches + inquiries + confirmed;
    const weight = interest ? Math.max(interest.index / 100, Math.min(1, activity / 12)) : Math.min(1, activity / 12);
    return {
      connected,
      weight: connected ? Math.max(0.15, Number(weight.toFixed(3))) : 0,
      first_party_searches: searches,
      platform_inquiries: inquiries,
      confirmed_bookings: confirmed,
      interest,
      first_party_trend: firstPartyTrend(sqMatches),
      cities: [...cityMap.values()].sort((a, b) => b.count - a.count).slice(0, 8),
    };
  };

  const industries = INDUSTRY_TAXONOMY.map((ind: any) => {
    const nodeInd = indsBySlug.get(ind.slug);
    if (!nodeInd) return null;
    const subdivisions = ind.subdivisions.map((sub: any) => {
      const topics = sub.topics.map((topic: any) => {
        const node = topicNodeBySlug.get(topic.slug);
        if (!node) return null;
        return { slug: topic.slug, name: node.name || topic.name, stats: statsFor(node) };
      }).filter(Boolean);
      return { slug: sub.slug, name: (subsBySlug.get(sub.slug) || sub).name, topics };
    }).filter(Boolean);
    const allTopics = subdivisions.flatMap((s: any) => s.topics);
    const connected = allTopics.filter((topic: any) => topic.stats.connected).length;
    return {
      slug: ind.slug,
      name: nodeInd.name || ind.name,
      blurb: ind.blurb,
      connected_topics: connected,
      weight: allTopics.length ? Math.max(...allTopics.map((topic: any) => topic.stats.weight)) : 0,
      subdivisions,
    };
  }).filter(Boolean);

  const allTopics = industries.flatMap((i: any) => i.subdivisions.flatMap((s: any) => s.topics));
  return {
    generated_at: new Date().toISOString(),
    data_integrity: {
      statement: 'Every number on this page comes from a connected source and is labelled with its basis. Topics without connected data are shown as unavailable — never filled in with estimates.',
      sources: [
        { key: 'google_trends', label: 'Relative search interest (index)', basis: 'source-reported index, not a count of searches' },
        { key: 'service_query', label: 'First-party searches on this platform', basis: 'actual captured queries' },
        { key: 'demand_signal', label: 'Platform inquiries & confirmed bookings', basis: 'actual records' },
      ],
    },
    counts: {
      industries: industries.length,
      topics: allTopics.length,
      connected_topics: allTopics.filter((topic: any) => topic.stats.connected).length,
      first_party_searches: allTopics.reduce((n: number, topic: any) => n + topic.stats.first_party_searches, 0),
      platform_inquiries: allTopics.reduce((n: number, topic: any) => n + topic.stats.platform_inquiries, 0),
      observed_records: allTopics.reduce((n: number, topic: any) => n + (topic.stats.interest?.records || 0), 0),
    },
    industries,
  };
}

export default async function (req: any) {
  try {
    const base44 = createClientFromRequest(req);
    const limited = await checkRateLimit(base44, req, 'nationalDemand', 90);
    if (!limited.allowed) return rateLimitedResponse();
    const { action } = await req.json().catch(() => ({}));
    const srole = base44.asServiceRole;
    if (action === 'seed') return Response.json(await ensureSeeded(srole, true));
    if (action !== 'gauge') return Response.json({ error: 'Unknown action.' }, { status: 422 });
    return Response.json(await buildGauge(srole));
  } catch (e: any) {
    return Response.json({ error: 'Could not build the national demand gauge.', detail: String(e?.message || e) }, { status: 500 });
  }
}