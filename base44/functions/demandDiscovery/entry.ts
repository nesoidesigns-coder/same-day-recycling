import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { secrets } from 'base44:runtime';

// National AI demand discovery: retrieves genuinely public posts seeking
// removal / hauling / recycling services from authorized public sources,
// classifies them, deduplicates, and stores verified opportunities.
// Compliance: official public read endpoints only, low volume, brief excerpts
// with direct links, no login bypass, no private content, no fabrication.

const UA = 'RecyclingOS-Community-Discovery/1.0 (public service-request discovery; samedayrecycling.ca)';

const SUBREDDITS = [
  { sub: 'vancouver', city: 'Vancouver', province: 'BC' },
  { sub: 'victoriabc', city: 'Victoria', province: 'BC' },
  { sub: 'Calgary', city: 'Calgary', province: 'AB' },
  { sub: 'Edmonton', city: 'Edmonton', province: 'AB' },
  { sub: 'toronto', city: 'Toronto', province: 'ON' },
  { sub: 'ottawa', city: 'Ottawa', province: 'ON' },
  { sub: 'Montreal', city: 'Montreal', province: 'QC' },
  { sub: 'Winnipeg', city: 'Winnipeg', province: 'MB' },
  { sub: 'Saskatoon', city: 'Saskatoon', province: 'SK' },
  { sub: 'halifax', city: 'Halifax', province: 'atlantic' },
];

const SEARCH_QUERY = '"junk removal" OR "furniture pickup" OR "appliance removal" OR "mattress disposal" OR "haul away" OR "scrap metal pickup" OR "hot tub removal" OR "estate cleanout" OR "garage cleanout" OR "construction debris"';

const CATEGORIES = ['junk_removal', 'furniture_removal', 'appliance_removal', 'electronics', 'recycling', 'waste_disposal', 'estate_cleanout', 'construction_debris', 'demolition_cleanup', 'mattress_disposal', 'yard_waste_removal', 'commercial_waste', 'hot_tub_removal', 'scrap_metal', 'bin_rentals', 'same_day_pickup', 'other'];
const PROVINCE_CODES = ['BC', 'AB', 'SK', 'MB', 'ON', 'QC', 'atlantic', 'northern'];
const VALID_CLASSIFICATIONS = ['active_request', 'potential_opportunity', 'general_discussion'];

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const action = body.action || 'search';

    if (action === 'search') return await handleSearch(base44, body);

    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    if (action === 'status') return await handleStatus(base44);
    if (action === 'run') return await runDiscovery(base44);
    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// ---- Public natural-language search over verified stored opportunities ----
async function handleSearch(base44, body) {
  const q = String(body.q || '').trim().slice(0, 300);
  let filters = {
    keywords: [],
    category: String(body.category || ''),
    province: String(body.province || ''),
    classification: String(body.classification || ''),
    days: Math.min(Math.max(Number(body.days) || 30, 1), 90),
  };

  if (q) {
    const parsed = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `A community member asks a search question: "${q}". Extract filters for a database of public Canadian service-request posts (junk removal, furniture pickup, appliance disposal, hauling, recycling, cleanouts). Return: keywords (2-5 short search phrases, lowercase, drawn from the request), category (one of ${CATEGORIES.join(', ')} or empty string), province_code (BC, AB, SK, MB, ON, QC, atlantic, northern, or empty string for all of Canada), days (1-90, default 30). Never invent locations the member did not name.`,
      response_json_schema: {
        type: 'object',
        properties: {
          keywords: { type: 'array', items: { type: 'string' } },
          category: { type: 'string' },
          province_code: { type: 'string' },
          days: { type: 'number' },
        },
        required: ['keywords'],
      },
    });
    filters = {
      keywords: (Array.isArray(parsed.keywords) ? parsed.keywords : []).slice(0, 5).map((k) => String(k).toLowerCase()).filter(Boolean),
      category: CATEGORIES.includes(parsed.category) ? parsed.category : '',
      province: PROVINCE_CODES.includes(parsed.province_code) ? parsed.province_code : '',
      classification: '',
      days: Math.min(Math.max(Math.round(Number(parsed.days) || 30), 1), 90),
    };
  }

  const query = { status: 'open', source_status: 'available' };
  if (filters.province) query.province_code = filters.province;
  if (filters.category) query.service_category = filters.category;
  if (filters.classification) query.classification = filters.classification;
  query.posted_at = { $gte: new Date(Date.now() - filters.days * 86400000).toISOString() };

  const { items } = await base44.asServiceRole.entities.PublicOpportunity.filter(query, { sort: '-posted_at', limit: 200 });
  let results = items;
  if (filters.keywords.length) {
    results = items.filter((it) => {
      const hay = `${it.title || ''} ${it.excerpt || ''}`.toLowerCase();
      return filters.keywords.some((k) => hay.includes(k));
    });
  }

  return Response.json({
    results: results.slice(0, 25).map(pickPublic),
    filters_used: filters,
    source_note: 'Verified public posts discovered from authorized public sources. Each result links to the original post.',
  });
}

function pickPublic(p) {
  return {
    id: p.id,
    title: p.title,
    excerpt: p.excerpt,
    source: p.source,
    source_label: p.source_label,
    source_url: p.source_url,
    posted_at: p.posted_at,
    last_verified_at: p.last_verified_at,
    service_category: p.service_category,
    province_code: p.province_code,
    city: p.city,
    classification: p.classification,
    relevance_score: p.relevance_score,
    source_status: p.source_status,
  };
}

// ---- Scheduled / owner-triggered discovery run ----
async function runDiscovery(base44) {
  let settings = (await base44.asServiceRole.entities.PublicDiscoverySettings.filter({}, { limit: 1 })).items[0];
  if (!settings) {
    settings = await base44.asServiceRole.entities.PublicDiscoverySettings.create({ paused: false, reddit_enabled: true, max_posts_per_run: 120 });
  }
  if (settings.paused) return Response.json({ skipped: true, reason: 'Discovery is paused by the owner.' });
  if (!settings.reddit_enabled) return Response.json({ skipped: true, reason: 'No discovery sources are enabled.' });

  const startedAt = new Date().toISOString();
  const maxPosts = Math.max(20, Math.min(Number(settings.max_posts_per_run) || 120, 200));

  // Official Reddit OAuth when credentials exist; otherwise the public read
  // endpoint is attempted and its failure is reported honestly.
  const token = await redditToken();
  // Source fetch: batches of 6 parallel, bounded, 10s timeout each.
  const batches = [];
  for (let i = 0; i < SUBREDDITS.length; i += 6) batches.push(SUBREDDITS.slice(i, i + 6));
  const posts = [];
  let failedQueries = 0;
  for (const batch of batches) {
    const settled = await Promise.allSettled(batch.map((s) => fetchSubreddit(s, token)));
    for (const r of settled) {
      if (r.status === 'fulfilled' && Array.isArray(r.value)) posts.push(...r.value);
      else failedQueries += 1;
    }
  }

  // Deduplicate and cap politeness.
  const seen = new Set();
  const unique = [];
  for (const p of posts) {
    if (!p.external_id || seen.has(p.external_id)) continue;
    seen.add(p.external_id);
    unique.push(p);
  }
  unique.sort((a, b) => String(b.posted_at).localeCompare(String(a.posted_at)));
  const capped = unique.slice(0, maxPosts);

  // Skip already-known posts.
  const ids = capped.map((p) => p.external_id);
  const existing = ids.length
    ? (await base44.asServiceRole.entities.PublicOpportunity.filter({ external_id: { $in: ids } }, { limit: 250 })).items
    : [];
  const existingIds = new Set(existing.map((e) => e.external_id));
  const fresh = capped.filter((p) => !existingIds.has(p.external_id));

  // AI classification of only genuinely relevant posts.
  let classified = [];
  let llmError = '';
  if (fresh.length) {
    try {
      const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: `You classify public posts for a Canadian service-opportunity discovery feed. The network offers: junk removal, furniture pickup, appliance disposal, mattress disposal, hot tub removal, scrap metal pickup, estate cleanouts, garage cleanouts, construction debris hauling, bin rentals, recycling.
For EACH post decide:
- relevant: true only if plausibly connected to these services in Canada. Advertisements, memes, US-only posts, people ADVERTISING their own service, and unrelated topics are NOT relevant.
- classification: "active_request" (explicitly seeking the service), "potential_opportunity" (a problem or situation that may need the service), "general_discussion" (relevant talk without clear purchasing intent), or "unverified". Never label general discussion as an active request.
- category: one of ${CATEGORIES.join(', ')}.
- city and province_code: ONLY when clearly stated in the post text; otherwise empty string. province_code must be one of BC, AB, SK, MB, ON, QC, atlantic, northern, or "".
- score: 0-100 for relevance and service-seeking intent.
Never invent details not present in the post.
Posts (JSON array): ${JSON.stringify(fresh.slice(0, 80).map((p) => ({ id: p.external_id, community: `r/${p.subreddit}`, title: p.title, excerpt: p.excerpt })))}`,
        response_json_schema: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  relevant: { type: 'boolean' },
                  classification: { type: 'string' },
                  category: { type: 'string' },
                  city: { type: 'string' },
                  province_code: { type: 'string' },
                  score: { type: 'number' },
                },
                required: ['id', 'relevant'],
              },
            },
          },
          required: ['results'],
        },
      });
      const byId = new Map((llm.results || []).map((r) => [String(r.id), r]));
      classified = fresh
        .map((p) => ({ p, r: byId.get(p.external_id) }))
        .filter((x) => x.r && x.r.relevant === true);
    } catch (e) {
      llmError = e?.message || 'classification failed';
    }
  }

  const now = new Date().toISOString();
  const toCreate = classified.map(({ p, r }) => ({
    external_id: p.external_id,
    source: 'reddit',
    source_label: `r/${p.subreddit} · Reddit public post`,
    source_url: p.source_url,
    title: p.title,
    excerpt: p.excerpt,
    posted_at: p.posted_at,
    service_category: CATEGORIES.includes(r.category) ? r.category : 'other',
    province_code: PROVINCE_CODES.includes(r.province_code) ? r.province_code : p.province,
    city: String(r.city || p.city || '').slice(0, 80),
    classification: VALID_CLASSIFICATIONS.includes(r.classification) ? r.classification : 'general_discussion',
    relevance_score: Math.max(0, Math.min(100, Math.round(Number(r.score) || 0))),
    source_status: 'available',
    last_verified_at: now,
    status: 'open',
  }));
  if (toCreate.length) await base44.asServiceRole.entities.PublicOpportunity.bulkCreate(toCreate);

  const runStatus = failedQueries === 0 && !llmError ? 'success' : (posts.length > 0 ? 'partial' : 'failed');
  await base44.asServiceRole.entities.DiscoveryRun.create({
    source: 'reddit',
    run_date: now.slice(0, 10),
    status: runStatus,
    started_at: startedAt,
    finished_at: now,
    queries_run: SUBREDDITS.length,
    posts_fetched: posts.length,
    duplicates_skipped: capped.length - fresh.length,
    irrelevant_filtered: fresh.length - classified.length,
    opportunities_saved: toCreate.length,
    error: [failedQueries ? `${failedQueries} source queries failed` : '', llmError].filter(Boolean).join('; ').slice(0, 1000),
    notes: 'Public Reddit city-subreddit search via the official read endpoint. Brief excerpts with direct links only; no republication, no private content.',
  });
  await base44.asServiceRole.entities.PublicDiscoverySettings.update(settings.id, { last_run_at: now });

  return Response.json({
    ok: true,
    status: runStatus,
    posts_fetched: posts.length,
    duplicates_skipped: capped.length - fresh.length,
    irrelevant_filtered: fresh.length - classified.length,
    opportunities_saved: toCreate.length,
    failed_queries: failedQueries,
  });
}

async function redditToken() {
  try {
    const id = secrets.get('REDDIT_CLIENT_ID');
    const secret = secrets.get('REDDIT_CLIENT_SECRET');
    if (!id || !secret) return null;
    const res = await fetch('https://www.reddit.com/api/v1/access_token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(`${id}:${secret}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': UA,
      },
      body: 'grant_type=client_credentials',
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

async function fetchSubreddit(s, token) {
  const base = token ? 'https://oauth.reddit.com' : 'https://www.reddit.com';
  const url = `${base}/r/${s.sub}/search.json?q=${encodeURIComponent(SEARCH_QUERY)}&restrict_sr=1&sort=new&t=month&limit=20&raw_json=1`;
  const headers = { 'User-Agent': UA };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Reddit returned ${res.status}`);
  const data = await res.json();
  return (data?.data?.children || [])
    .map((c) => c.data)
    .filter((p) => p && p.title && !p.stickied && !p.over_18)
    .map((p) => ({
      external_id: `reddit_${p.id}`,
      title: String(p.title).slice(0, 200),
      excerpt: String(p.selftext || '').replace(/\s+/g, ' ').trim().slice(0, 600),
      source_url: `https://www.reddit.com${p.permalink}`,
      posted_at: new Date(p.created_utc * 1000).toISOString(),
      subreddit: s.sub,
      city: s.city,
      province: s.province,
    }));
}

// ---- Owner status snapshot ----
async function handleStatus(base44) {
  const settings = (await base44.asServiceRole.entities.PublicDiscoverySettings.filter({}, { limit: 1 })).items[0] || null;
  const runs = (await base44.asServiceRole.entities.DiscoveryRun.filter({}, { sort: '-created_date', limit: 10 })).items || [];
  const total = await base44.asServiceRole.entities.PublicOpportunity.count({ status: 'open' });
  const byClassification = await base44.asServiceRole.entities.PublicOpportunity.aggregate({ query: { status: 'open' }, groupBy: 'classification' });
  const byProvince = await base44.asServiceRole.entities.PublicOpportunity.aggregate({ query: { status: 'open' }, groupBy: 'province_code' });
  return Response.json({ settings, runs, total, by_classification: byClassification?.rows || [], by_province: byProvince?.rows || [] });
}