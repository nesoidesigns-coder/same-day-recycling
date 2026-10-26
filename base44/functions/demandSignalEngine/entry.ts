import { createClientFromRequest } from 'npm:@base44/sdk@0.8.57';
import { detectMarkets, detectUrgency, detectIntent, detectLanguage, extractKeywords } from '../../shared/demandTaxonomy.ts';
import { scoreSignal, DEFAULT_WEIGHTS } from '../../shared/opportunityScoring.ts';

// Demand Signal Engine — the unified ingestion pipeline for the Canadian
// Demand Intelligence Network. It harvests EXISTING source records (public
// discovery, search intelligence, internal platform inquiries, confirmed
// bookings) into one DemandSignal entity: classified, deduplicated,
// geo-confident, coverage-checked and explainably scored.
//
// Rules honored here:
// - Original source evidence is never rewritten; derived fields only.
// - Search interest (aggregate keyword data) is never treated as a lead.
// - Public posters' personal details and exact locations are never stored.
// - Location-unresolved signals stay unresolved; nothing is guessed.
// - No automatic outreach: qualified opportunities await owner review.

const DAY_MS = 86400000;
const QUEUE_ELIGIBLE = ['observed_public_request', 'platform_inquiry'];
const normCity = (c) => String(c || '').trim().toLowerCase();

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const action = body.action || 'feed';
    if (action === 'run') return await handleRun(base44);
    if (action === 'feed') return await handleFeed(base44);
    if (action === 'review') return await handleReview(base44, user, body);
    if (action === 'settings') return await handleSettings(base44, body);
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ---------- settings ----------
async function loadSettings(base44) {
  let settings = (await base44.asServiceRole.entities.DemandNetworkSettings.filter({}, { limit: 1 })).items[0];
  if (!settings) {
    settings = await base44.asServiceRole.entities.DemandNetworkSettings.create({
      weights: DEFAULT_WEIGHTS, queue_threshold: 60, stale_days: 30, duplicate_window_days: 7,
      history: [{ date: new Date().toISOString(), event: 'created', note: 'Default scoring weights and thresholds' }],
    });
  }
  return settings;
}

async function handleSettings(base44, body) {
  const settings = await loadSettings(base44);
  if (body.save) {
    const cleanWeights: any = {};
    for (const k of Object.keys(DEFAULT_WEIGHTS)) {
      const v = Number((body.weights || {})[k]);
      if (Number.isFinite(v) && v >= 0 && v <= 50) cleanWeights[k] = v;
    }
    await base44.asServiceRole.entities.DemandNetworkSettings.update(settings.id, {
      weights: { ...DEFAULT_WEIGHTS, ...cleanWeights },
      queue_threshold: Math.min(Math.max(Number(body.queue_threshold) || 60, 20), 95),
      stale_days: Math.min(Math.max(Number(body.stale_days) || 30, 7), 120),
      history: [...(settings.history || []).slice(-40), { date: new Date().toISOString(), event: 'settings_updated', note: `weights=${JSON.stringify(cleanWeights)}; threshold=${body.queue_threshold}; stale=${body.stale_days}` }],
    });
    return Response.json({ ok: true, settings: await loadSettings(base44) });
  }
  return Response.json({ settings });
}

// ---------- ingestion ----------
interface Draft {
  signal_key: string; source_platform: string; source_type: string; source_ref: string;
  source_url: string; source_published_at: string | null; title: string; customer_need: string;
  demand_type: string; service_category: string; city: string; province_code: string;
  text: string; metric_context: any; source_reliability: string;
}

function coverageFor(city: string, province: string, cities: Set<string>, provinces: Set<string>): 'covered' | 'province_near' | 'uncovered' | 'unknown' {
  if (city && cities.has(normCity(city))) return 'covered';
  if (province && provinces.has(String(province).toUpperCase())) return 'province_near';
  return city || province ? 'uncovered' : 'unknown';
}

function buildDrafts(base44, settings, cities, provinces): Promise<{ drafts: Draft[]; skipped: any }> {
  const staleDays = Math.max(7, Number(settings.stale_days) || 30);
  const staleCutoff = new Date(Date.now() - staleDays * DAY_MS).toISOString();

  const load = async (entity: string, filter: any, limit = 200) =>
    (await (base44.asServiceRole as any).entities[entity].filter(filter, { sort: '-created_date', limit })).items || [];

  // Full-scan loader: a small head-of-list window would only ingest the most
  // recently synced keyword groups (the tail of the taxonomy), starving the
  // signal index of the service keywords it actually measures.
  const loadAll = async (entity: string, maxRecords = 8000) => {
    const all: any[] = [];
    let cursor: string | undefined;
    do {
      const page = await (base44.asServiceRole as any).entities[entity].list(
        cursor ? { sort: '-created_date', limit: 1000, cursor } : { sort: '-created_date', limit: 1000 },
      );
      all.push(...((page.items || []) as any[]));
      cursor = page.next_cursor;
    } while (cursor && all.length < maxRecords);
    return all;
  };

  return (async () => {
    const drafts: Draft[] = [];
    const skipped: any = {};

    // A) Public discovery — permitted public posts (never general discussion, never unverified).
    const opps = await load('PublicOpportunity', { status: 'open', classification: { $in: ['active_request', 'potential_opportunity'] } }, 250);
    skipped.public_stale = 0; skipped.public_unverified = 0;
    for (const p of opps) {
      if (p.posted_at && p.posted_at < staleCutoff) { skipped.public_stale++; continue; }
      const text = `${p.title || ''} ${p.excerpt || ''} ${p.description || ''}`;
      drafts.push({
        signal_key: `public_discovery:${p.external_id || p.id}`, source_platform: p.source || 'other',
        source_type: 'public_discovery', source_ref: String(p.external_id || p.id), source_url: p.source_url || '',
        source_published_at: p.posted_at || null, title: String(p.title || '').slice(0, 200),
        customer_need: String(p.description || p.excerpt || '').slice(0, 600),
        demand_type: 'observed_public_request', service_category: p.service_category || 'other',
        city: p.city || '', province_code: p.province_code || '', text,
        metric_context: { job_status: p.job_status || '', classification: p.classification }, source_reliability: 'public_source',
      });
    }

    // B) Search intelligence — aggregate observations; NEVER individual leads.
    const obs = await loadAll('DemandObservation');
    skipped.search_stale = 0;
    skipped.search_offmarket = 0;
    for (const o of obs) {
      const periodEnd = o.period_end || (o.period ? `${o.period}-28` : '');
      if (periodEnd && periodEnd < staleCutoff.slice(0, 10)) { skipped.search_stale++; continue; }
      // Market-relevance gate. The observations table samples every industry
      // group we track (insurance, dental, software, trades...). Only keywords
      // that resolve to one of the eight removal/recycling markets are this
      // platform's service demand; the rest belong to other industries and must
      // never be counted as recycling demand on any gauge.
      const markets = detectMarkets(`${o.keyword || ''} ${o.close_variants || ''}`, o.service_category || '');
      if (!markets.length) { skipped.search_offmarket++; continue; }
      drafts.push({
        signal_key: `search_intelligence:${o.keyword}|${o.geo_key || o.province_code || ''}|${o.period || ''}`,
        source_platform: o.provider || 'licensed_import', source_type: 'search_intelligence',
        source_ref: `${o.keyword}|${o.geo_key || o.province_code || ''}|${o.period || ''}`, source_url: o.source_url || '',
        source_published_at: o.period || o.retrieved_at || null,
        title: `${o.keyword} — search interest`, customer_need: o.description || '',
        demand_type: 'search_interest', service_category: o.service_category || 'other',
        city: o.geo_type === 'city' ? (o.city || o.geo_key) : '', province_code: o.province_code || (o.geo_type === 'province' ? o.geo_key : '') || '',
        text: `${o.keyword} ${o.close_variants || []}`, metric_context: {
          metric_type: o.metric_type, trend_index: o.trend_index, trend_direction: o.trend_direction,
          volume_basis: o.volume_basis, period: o.period, comparison_group: o.comparison_group,
        }, source_reliability: 'aggregate_data',
      });
    }

    // C) Internal platform inquiries (ServiceQuery / QuoteLead) — anonymized.
    const queries = await load('ServiceQuery', {}, 200);
    // ServiceQuery holds two very different things: questions asked on our own
    // site (a real platform inquiry) and public posts harvested from the web by
    // queryHunter (someone else's post, never our inquiry). They must not share
    // a demand type. The signal_key prefix is left unchanged so existing records
    // keep deduplicating correctly.
    const PUBLIC_HARVEST = ['web_hunt', 'reddit', 'kijiji', 'facebook_group', 'forum', 'craigslist'];
    for (const q of queries) {
      const isSearch = q.source === 'search_console';
      const isPublicPost = PUBLIC_HARVEST.includes(String(q.source || ''));
      // A site-chat question only counts as a platform inquiry when it shows real
      // purchasing intent. General questions ("What do you take?") are
      // information interest — never counted as a customer inquiry or lead.
      const isInfoQuestion = q.source === 'receptionist' && detectIntent(q.query_text, q.intent) === 'none';
      // Public posts harvested from the web are handled by PublicOpportunity —
      // the evidence-backed public surface — and enter demand from there. They
      // are never counted twice, and a post without a source URL never becomes
      // a public request.
      if (isPublicPost) continue;
      drafts.push({
        signal_key: `internal_platform:service_query:${q.id}`, source_platform: 'recycling_os',
        source_type: 'internal_platform', source_ref: `service_query:${q.id}`, source_url: '',
        source_published_at: q.captured_date || null, title: String(q.query_text || '').slice(0, 200),
        customer_need: String(q.description || '').slice(0, 600),
        demand_type: isSearch ? 'search_interest' : (isInfoQuestion ? 'market_indicator' : 'platform_inquiry'),
        service_category: q.service || 'other',
        city: q.city || '', province_code: '', text: `${q.query_text || ''} ${q.service || ''}`,
        metric_context: { source_kind: q.source, intent: q.intent || '' },
        source_reliability: isSearch ? 'aggregate_data' : (isPublicPost ? 'public_source' : 'internal_record'),
      });
    }
    const leads = await load('QuoteLead', {}, 200);
    for (const l of leads) {
      drafts.push({
        signal_key: `internal_platform:quote_lead:${l.id}`, source_platform: 'recycling_os',
        source_type: 'internal_platform', source_ref: `quote_lead:${l.id}`, source_url: '',
        source_published_at: l.created_date || null,
        title: l.items_description ? String(l.items_description).slice(0, 200) : 'Quote request',
        customer_need: String(l.items_description || '').slice(0, 600),
        demand_type: 'platform_inquiry', service_category: l.service_type || 'other',
        city: l.city || '', province_code: l.province_code || '', text: `${l.items_description || ''} ${l.city || ''}`,
        metric_context: { status: l.status || '' }, source_reliability: 'internal_record',
      });
    }

    // D) Confirmed bookings / live booking requests — internal_test and cancelled excluded.
    const bookings = await load('Booking', { record_type: 'service' }, 200);
    for (const b of bookings) {
      if (b.status === 'cancelled') { skipped.bookings_cancelled = (skipped.bookings_cancelled || 0) + 1; continue; }
      const confirmed = ['confirmed', 'contacted', 'scheduled', 'completed'].includes(b.status);
      drafts.push({
        signal_key: `internal_platform:booking:${b.id}`, source_platform: 'recycling_os',
        source_type: 'internal_platform', source_ref: `booking:${b.id}`, source_url: '',
        source_published_at: b.created_date || null,
        title: b.items_description ? String(b.items_description).slice(0, 200) : 'Removal / recycling pickup',
        customer_need: String(b.items_description || '').slice(0, 600),
        demand_type: confirmed ? 'confirmed_booking' : 'platform_inquiry', service_category: 'junk_removal',
        city: b.city || '', province_code: b.province_code || '', text: `${b.items_description || ''} ${b.city || ''}`,
        metric_context: { status: b.status, partner: b.partner_name || '' }, source_reliability: 'internal_record',
      });
    }

    return { drafts, skipped };
  })();
}

function classifyDraft(draft: Draft, settings, cities: Set<string>, provinces: Set<string>) {
  const weights = { ...DEFAULT_WEIGHTS, ...(settings.weights || {}) };
  const market_categories = detectMarkets(draft.text, draft.service_category);
  const urgency = detectUrgency(draft.text);
  const commercial_intent = draft.source_type === 'search_intelligence' ? 'none'
    : detectIntent(draft.text, draft.metric_context?.intent);
  const geo_confidence = draft.city ? 'exact_city' : draft.province_code ? 'province' : 'unresolved';
  const coverage_status = coverageFor(draft.city, draft.province_code, cities, provinces);
  const published = draft.source_published_at && /^\d{4}-\d{2}/.test(draft.source_published_at)
    ? (draft.source_published_at.length === 7 ? `${draft.source_published_at}-15` : draft.source_published_at)
    : draft.source_published_at;
  const { score, factors, explanation, duplicate_penalty } = scoreSignal({
    market_categories, service_category: draft.service_category, geo_confidence: geo_confidence as any,
    source_reliability: draft.source_reliability as any, demand_type: draft.demand_type,
    published_at: published, commercial_intent: commercial_intent as any, urgency: urgency as any,
    coverage_status: coverage_status as any, related_count: 1,
  }, weights);

  let recommended_action = 'Monitor';
  if (draft.demand_type === 'confirmed_booking') recommended_action = 'Fulfill the job and record verified outcomes.';
  else if (draft.demand_type === 'platform_inquiry' && coverage_status === 'covered') recommended_action = 'Respond to the inquiry and route to dispatch.';
  else if (draft.demand_type === 'platform_inquiry') recommended_action = 'Respond to the inquiry; no verified contractor coverage yet.';
  else if (draft.demand_type === 'observed_public_request' && coverage_status === 'covered') recommended_action = 'Add to the outreach review queue for owner approval.';
  else if (draft.demand_type === 'observed_public_request' && score >= (settings.queue_threshold || 60)) recommended_action = 'Demand without verified contractor capacity: consider recruitment.';
  else if (draft.demand_type === 'search_interest') recommended_action = 'Marketing input only: SEO or landing-page planning. Never an individual lead.';
  else if (draft.demand_type === 'market_indicator') recommended_action = 'Contextual evidence: monitor for emerging demand.';

  return {
    ...draft,
    market_categories, urgency, commercial_intent, geo_confidence, coverage_status,
    language: detectLanguage(draft.text), keywords: extractKeywords(draft.text),
    confidence_score: score, score_factors: { factors, duplicate_penalty }, score_explanation: explanation,
    recommended_action, text: undefined,
  };
}

async function handleRun(base44) {
  const settings = await loadSettings(base44);
  const partners = (await base44.asServiceRole.entities.Partner.filter({ active: true, verified: true }, { limit: 500 })).items || [];
  const cities = new Set<string>(), provinces = new Set<string>();
  for (const p of partners) {
    if (p.city) cities.add(normCity(p.city));
    for (const c of p.service_cities || []) cities.add(normCity(c));
    if (p.province_code) provinces.add(String(p.province_code).toUpperCase());
  }

  const { drafts, skipped } = await buildDrafts(base44, settings, cities, provinces);
  const keys = drafts.map((d) => d.signal_key);
  const existing = keys.length
    ? (await base44.asServiceRole.entities.DemandSignal.filter({ signal_key: { $in: keys } }, { limit: 1000 })).items || []
    : [];
  const byKey = new Map(existing.map((e) => [e.signal_key, e]));

  const queueThreshold = Number(settings.queue_threshold) || 60;
  const now = new Date().toISOString();
  const toCreate: any[] = [], toUpdate: any[] = [];
  const byType: Record<string, number> = {};
  for (const draft of drafts) {
    const classified = classifyDraft(draft, settings, cities, provinces);
    byType[classified.demand_type] = (byType[classified.demand_type] || 0) + 1;
    const reviewEligible = QUEUE_ELIGIBLE.includes(classified.demand_type)
      && classified.confidence_score >= queueThreshold && classified.geo_confidence !== 'unresolved';
    const payload = {
      source_platform: classified.source_platform, source_type: classified.source_type, source_ref: classified.source_ref,
      source_url: classified.source_url, source_published_at: classified.source_published_at,
      title: classified.title, customer_need: classified.customer_need, demand_type: classified.demand_type,
      market_categories: classified.market_categories, service_category: classified.service_category,
      city: classified.city, province_code: classified.province_code, geo_confidence: classified.geo_confidence,
      commercial_intent: classified.commercial_intent, urgency: classified.urgency, language: classified.language,
      confidence_score: classified.confidence_score, score_factors: classified.score_factors,
      score_explanation: classified.score_explanation, source_reliability: classified.source_reliability,
      keywords: classified.keywords, coverage_status: classified.coverage_status,
      recommended_action: classified.recommended_action, metric_context: classified.metric_context,
      processing_status: 'classified',
      review_status: reviewEligible ? 'pending' : 'not_required',
    };
    const prev = byKey.get(draft.signal_key);
    if (prev) {
      // Derived fields refresh; source evidence untouched.
      toUpdate.push({
        id: prev.id, ...payload,
        last_verified_at: now,
        review_status: ['qualified', 'dismissed'].includes(prev.review_status) ? prev.review_status : payload.review_status,
        processing_status: ['reviewed', 'actioned'].includes(prev.processing_status) ? prev.processing_status : 'classified',
        review_note: prev.review_note || '', reviewed_by: prev.reviewed_by || '', reviewed_date: prev.reviewed_date || '',
      });
    } else {
      toCreate.push({ ...payload, signal_key: draft.signal_key, collected_at: now, last_verified_at: now, processing_status: reviewEligible ? 'review_pending' : 'classified' });
    }
  }
  if (toUpdate.length) await base44.asServiceRole.entities.DemandSignal.bulkUpdate(toUpdate);
  if (toCreate.length) await base44.asServiceRole.entities.DemandSignal.bulkCreate(toCreate);

  // Expire stale public-discovery signals (their window has passed).
  const staleCutoff = new Date(Date.now() - (Math.max(7, Number(settings.stale_days) || 30) + 14) * DAY_MS).toISOString();
  const expired = await base44.asServiceRole.entities.DemandSignal.updateMany(
    { source_type: 'public_discovery', processing_status: { $ne: 'expired' }, source_published_at: { $lt: staleCutoff } },
    { $set: { processing_status: 'expired' } },
  );

  // Related-signal references: same city + primary market within the duplicate window.
  const windowDays = Math.max(1, Number(settings.duplicate_window_days) || 7);
  const recent = toCreate.length || toUpdate.length
    ? (await base44.asServiceRole.entities.DemandSignal.filter({ collected_at: { $gte: new Date(Date.now() - windowDays * DAY_MS).toISOString() } }, { limit: 500 })).items || []
    : [];
  const groups = new Map<string, any[]>();
  for (const s of recent) {
    if (s.demand_type !== 'observed_public_request' || !s.city) continue;
    const g = `${normCity(s.city)}|${(s.market_categories || [])[0] || 'other'}`;
    let arr = groups.get(g);
    if (!arr) { arr = []; groups.set(g, arr); }
    arr.push(s);
  }
  const relatedUpdates: any[] = [];
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const s of group) {
      const others = group.filter((o) => o.id !== s.id).map((o) => o.signal_key);
      if (others.length && JSON.stringify(others) !== JSON.stringify(s.related_signal_refs || [])) {
        relatedUpdates.push({ id: s.id, related_signal_refs: others });
      }
    }
  }
  if (relatedUpdates.length) await base44.asServiceRole.entities.DemandSignal.bulkUpdate(relatedUpdates);

  await base44.asServiceRole.entities.DemandNetworkSettings.update(settings.id, {
    last_run_at: now,
    history: [...(settings.history || []).slice(-40), { date: now, event: 'ingest_run', note: `created=${toCreate.length} updated=${toUpdate.length} expired=${expired?.modified_count ?? 0}` }],
  });

  return Response.json({ ok: true, created: toCreate.length, updated: toUpdate.length, related_marked: relatedUpdates.length, expired: expired?.modified_count ?? 0, by_type: byType, skipped, coverage: { cities: [...cities].length, provinces: [...provinces] }, ran_at: now });
}

// ---------- review queue ----------
async function handleReview(base44, user, body) {
  const id = String(body.id || '');
  const decision = body.decision;
  if (!id || !['qualified', 'dismissed'].includes(decision)) return Response.json({ error: 'Provide id and decision (qualified|dismissed).' }, { status: 400 });
  const signal = await base44.asServiceRole.entities.DemandSignal.get(id);
  if (!signal) return Response.json({ error: 'Signal not found.' }, { status: 404 });
  await base44.asServiceRole.entities.DemandSignal.update(id, {
    review_status: decision, review_note: String(body.note || '').slice(0, 500),
    reviewed_by: user.email || 'admin', reviewed_date: new Date().toISOString().slice(0, 10),
    processing_status: 'reviewed',
  });
  return Response.json({ ok: true });
}

// ---------- observatory feed ----------
const TYPE_LABEL: Record<string, string> = {
  observed_public_request: 'Observed public request',
  search_interest: 'Search interest (aggregate, not leads)',
  market_indicator: 'Market indicator',
  platform_inquiry: 'Platform inquiry',
  qualified_opportunity: 'Qualified opportunity',
  confirmed_booking: 'Confirmed booking',
};

async function handleFeed(base44) {
  const settings = await loadSettings(base44);
  const signals = (await base44.asServiceRole.entities.DemandSignal.list({ sort: '-collected_at', limit: 800 })).items || [];
  const queueThreshold = Number(settings.queue_threshold) || 60;

  const byType: Record<string, number> = {}, byMarket: Record<string, number> = {};
  const cityMap = new Map<string, any>();
  const sourceMap = new Map<string, any>();
  const bookingsByCity: Record<string, number> = {};
  for (const s of signals) {
    if (s.processing_status === 'expired') continue;
    byType[s.demand_type] = (byType[s.demand_type] || 0) + 1;
    for (const m of s.market_categories || []) byMarket[m] = (byMarket[m] || 0) + 1;
    if (s.city) {
      const key = `${s.city}|${s.province_code || ''}`;
      const row = cityMap.get(key) || { city: s.city, province_code: s.province_code || '', count: 0, high_intent: 0, unresolved_nearby: s.geo_confidence !== 'exact_city' };
      row.count++;
      if (s.confidence_score >= queueThreshold) row.high_intent++;
      cityMap.set(key, row);
    }
    if (s.demand_type === 'confirmed_booking' && s.city) bookingsByCity[s.city] = (bookingsByCity[s.city] || 0) + 1;
    const sk = `${s.source_type}:${s.source_platform}`;
    const row = sourceMap.get(sk) || { source_type: s.source_type, source_platform: s.source_platform, count: 0, last_collected: '', last_verified: '' };
    row.count++;
    if (!row.last_collected || s.collected_at > row.last_collected) row.last_collected = s.collected_at || '';
    if (!row.last_verified || (s.last_verified_at || '') > row.last_verified) row.last_verified = s.last_verified_at || '';
    sourceMap.set(sk, row);
  }

  const live = signals.filter((s) => s.processing_status !== 'expired');
  const queue = live
    .filter((s) => s.review_status === 'pending' && QUEUE_ELIGIBLE.includes(s.demand_type))
    .sort((a, b) => (b.confidence_score || 0) - (a.confidence_score || 0))
    .slice(0, 50);
  const findings = live
    .filter((s) => ['observed_public_request', 'market_indicator'].includes(s.demand_type))
    .slice(0, 15);

  const compact = (s: any) => ({
    id: s.id, title: s.title, city: s.city || '', province_code: s.province_code || '',
    geo_confidence: s.geo_confidence, demand_type: s.demand_type, market_categories: s.market_categories || [],
    confidence_score: s.confidence_score, urgency: s.urgency, commercial_intent: s.commercial_intent,
    coverage_status: s.coverage_status, source_platform: s.source_platform, source_type: s.source_type,
    source_url: s.source_url || '', source_published_at: s.source_published_at || '',
    collected_at: s.collected_at || '', last_verified_at: s.last_verified_at || '',
    keywords: s.keywords || [], recommended_action: s.recommended_action || '',
    review_status: s.review_status, processing_status: s.processing_status,
    score_explanation: s.score_explanation || '', metric_context: s.metric_context || {},
  });

  return Response.json({
    generated_at: new Date().toISOString(),
    total: live.length,
    counts: {
      by_type: byType, by_market: byMarket,
      review: {
        pending: live.filter((s) => s.review_status === 'pending').length,
        qualified: live.filter((s) => s.review_status === 'qualified').length,
        dismissed: live.filter((s) => s.review_status === 'dismissed').length,
      },
      coverage: {
        covered: live.filter((s) => s.coverage_status === 'covered').length,
        uncovered: live.filter((s) => s.coverage_status === 'uncovered').length,
        unresolved: live.filter((s) => s.geo_confidence === 'unresolved').length,
      },
    },
    top_cities: [...cityMap.values()].sort((a, b) => b.count - a.count).slice(0, 20),
    queue: queue.map(compact),
    findings: findings.map(compact),
    signals: live.slice(0, 600).map(compact),
    coverage_cities: [...new Set(
      ((await base44.asServiceRole.entities.Partner.filter({ active: true, verified: true }, { limit: 500 })).items || [])
        .flatMap((p: any) => [p.city, ...(p.service_cities || [])].filter(Boolean)),
    )],
    bookings_by_city: bookingsByCity,
    sources: [...sourceMap.values()].sort((a, b) => b.count - a.count),
    // Collection health for the admin view only. Every figure is counted from
    // stored records — nothing is estimated, and excluded records are reported
    // rather than silently dropped.
    health: {
      total_live: live.length,
      expired_excluded: signals.length - live.length,
      unique_signal_keys: new Set(signals.map((s: any) => s.signal_key || s.id)).size,
      duplicate_keys_excluded: signals.length - new Set(signals.map((s: any) => s.signal_key || s.id)).size,
      last_collected_at: signals.reduce((m: string, s: any) => (s.collected_at > m ? s.collected_at : m), ''),
      last_sync_at: settings.last_run_at || '',
      genuine_public_requests: live.filter((s: any) => s.demand_type === 'observed_public_request').length,
      platform_inquiries: live.filter((s: any) => s.demand_type === 'platform_inquiry').length,
      confirmed_bookings: live.filter((s: any) => s.demand_type === 'confirmed_booking').length,
      basis: 'Counted from the most recent stored signals loaded for this view.',
    },
    settings,
    type_labels: TYPE_LABEL,
    notes: [
      'Search interest is aggregate keyword data — never an individual lead or an absolute search count.',
      'Observed public requests are source-backed posts, never confirmed bookings.',
      'Public posters are never identified; map markers show municipality level only.',
      'Signals with unresolved location are excluded from geographic counts, never guessed.',
    ],
  });
}